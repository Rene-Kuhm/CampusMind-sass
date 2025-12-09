import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  CreateFlashcardDto,
  UpdateFlashcardDto,
  CreateDeckDto,
  UpdateDeckDto,
} from "./dto/flashcard.dto";
import { UsageLimitsService } from "../billing/services/usage-limits.service";
import { UsageTypeEnum } from "../billing/constants/plans.constant";

// Tipos extendidos para Prisma
type PrismaWithFlashcards = PrismaService & {
  flashcardDeck: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  flashcard: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
    aggregate: (args: any) => Promise<any>;
  };
  flashcardReview: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    aggregate: (args: any) => Promise<any>;
  };
};

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  formula?: string | null;
  tags: string[];
  // Spaced repetition fields (SM-2 algorithm)
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  subjectId?: string | null;
  color?: string | null;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// SM-2 Algorithm constants
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);
  private readonly prisma: PrismaWithFlashcards;

  constructor(
    prisma: PrismaService,
    private readonly usageLimitsService: UsageLimitsService,
  ) {
    this.prisma = prisma as PrismaWithFlashcards;
  }

  // ==================== DECK OPERATIONS ====================

  /**
   * Crear un nuevo deck
   */
  async createDeck(userId: string, dto: CreateDeckDto): Promise<FlashcardDeck> {
    // Validar materia si se proporciona
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    const deck = await this.prisma.flashcardDeck.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        subjectId: dto.subjectId,
        color: dto.color,
      },
    });

    return { ...deck, cardCount: 0 } as FlashcardDeck;
  }

  /**
   * Obtener todos los decks del usuario
   */
  async getDecks(userId: string, subjectId?: string): Promise<FlashcardDeck[]> {
    const where: any = { userId };
    if (subjectId) {
      where.subjectId = subjectId;
    }

    const decks = await this.prisma.flashcardDeck.findMany({
      where,
      include: {
        _count: {
          select: { flashcards: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return decks.map((deck: any) => ({
      ...deck,
      cardCount: deck._count.flashcards,
    })) as FlashcardDeck[];
  }

  /**
   * Obtener deck por ID
   */
  async getDeck(deckId: string, userId: string): Promise<FlashcardDeck> {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, userId },
      include: {
        _count: {
          select: { flashcards: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException("Deck no encontrado");
    }

    return { ...deck, cardCount: deck._count.flashcards } as FlashcardDeck;
  }

  /**
   * Actualizar deck
   */
  async updateDeck(
    deckId: string,
    userId: string,
    dto: UpdateDeckDto,
  ): Promise<FlashcardDeck> {
    await this.getDeck(deckId, userId);

    const deck = await this.prisma.flashcardDeck.update({
      where: { id: deckId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
      include: {
        _count: {
          select: { flashcards: true },
        },
      },
    });

    return { ...deck, cardCount: deck._count.flashcards } as FlashcardDeck;
  }

  /**
   * Eliminar deck
   */
  async deleteDeck(deckId: string, userId: string): Promise<void> {
    await this.getDeck(deckId, userId);
    await this.prisma.flashcardDeck.delete({ where: { id: deckId } });
  }

  // ==================== FLASHCARD OPERATIONS ====================

  /**
   * Crear flashcard
   */
  async createFlashcard(
    userId: string,
    dto: CreateFlashcardDto,
  ): Promise<Flashcard> {
    // Verificar límite de flashcards
    await this.usageLimitsService.enforceUsageLimit(
      userId,
      UsageTypeEnum.FLASHCARDS,
      "Has alcanzado el límite de flashcards de tu plan. Mejora tu plan para crear más.",
    );

    // Verificar que el deck pertenece al usuario
    if (dto.deckId) {
      await this.getDeck(dto.deckId, userId);
    }

    const card = await this.prisma.flashcard.create({
      data: {
        deckId: dto.deckId,
        front: dto.front,
        back: dto.back,
        formula: dto.formula,
        tags: dto.tags || [],
        repetitions: 0,
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        nextReviewDate: new Date(),
      },
    });

    return card as Flashcard;
  }

  /**
   * Crear múltiples flashcards
   */
  async createFlashcards(
    userId: string,
    deckId: string,
    cards: Array<{
      front: string;
      back: string;
      formula?: string;
      tags?: string[];
    }>,
  ): Promise<Flashcard[]> {
    await this.getDeck(deckId, userId);

    const createdCards: Flashcard[] = [];

    for (const card of cards) {
      const created = await this.prisma.flashcard.create({
        data: {
          deckId,
          front: card.front,
          back: card.back,
          formula: card.formula,
          tags: card.tags || [],
          repetitions: 0,
          easeFactor: DEFAULT_EASE_FACTOR,
          interval: 0,
          nextReviewDate: new Date(),
        },
      });
      createdCards.push(created as Flashcard);
    }

    return createdCards;
  }

  /**
   * Obtener flashcards de un deck
   */
  async getFlashcards(deckId: string, userId: string): Promise<Flashcard[]> {
    await this.getDeck(deckId, userId);

    const cards = await this.prisma.flashcard.findMany({
      where: { deckId },
      orderBy: { createdAt: "asc" },
    });

    return cards as Flashcard[];
  }

  /**
   * Obtener flashcard por ID
   */
  async getFlashcard(cardId: string, userId: string): Promise<Flashcard> {
    const card = await this.prisma.flashcard.findFirst({
      where: { id: cardId },
      include: {
        deck: {
          select: { userId: true },
        },
      },
    });

    if (!card || card.deck.userId !== userId) {
      throw new NotFoundException("Flashcard no encontrada");
    }

    return card as Flashcard;
  }

  /**
   * Actualizar flashcard
   */
  async updateFlashcard(
    cardId: string,
    userId: string,
    dto: UpdateFlashcardDto,
  ): Promise<Flashcard> {
    await this.getFlashcard(cardId, userId);

    const card = await this.prisma.flashcard.update({
      where: { id: cardId },
      data: {
        ...(dto.front && { front: dto.front }),
        ...(dto.back && { back: dto.back }),
        ...(dto.formula !== undefined && { formula: dto.formula }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.deckId && { deckId: dto.deckId }),
      },
    });

    return card as Flashcard;
  }

  /**
   * Eliminar flashcard
   */
  async deleteFlashcard(cardId: string, userId: string): Promise<void> {
    await this.getFlashcard(cardId, userId);
    await this.prisma.flashcard.delete({ where: { id: cardId } });
  }

  // ==================== SPACED REPETITION (SM-2) ====================

  /**
   * Obtener flashcards para revisar hoy
   */
  async getDueCards(userId: string, deckId?: string): Promise<Flashcard[]> {
    const now = new Date();

    const where: any = {
      nextReviewDate: { lte: now },
      deck: { userId },
    };

    if (deckId) {
      where.deckId = deckId;
    }

    const cards = await this.prisma.flashcard.findMany({
      where,
      orderBy: { nextReviewDate: "asc" },
      take: 20, // Limitar a 20 tarjetas por sesión
    });

    return cards as Flashcard[];
  }

  /**
   * Registrar revisión de flashcard (SM-2 algorithm)
   *
   * Quality scale:
   * 0 - Complete failure
   * 1 - Incorrect, but remembered after seeing answer
   * 2 - Incorrect, easy to recall
   * 3 - Correct with serious difficulty
   * 4 - Correct with some hesitation
   * 5 - Perfect response
   */
  async reviewFlashcard(
    cardId: string,
    userId: string,
    quality: number,
  ): Promise<Flashcard> {
    const card = await this.getFlashcard(cardId, userId);

    // SM-2 Algorithm implementation
    let { repetitions, easeFactor, interval } = card;

    if (quality < 3) {
      // Failed - reset repetitions
      repetitions = 0;
      interval = 1;
    } else {
      // Passed - update using SM-2
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // Update ease factor
    easeFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Update card
    const updatedCard = await this.prisma.flashcard.update({
      where: { id: cardId },
      data: {
        repetitions,
        easeFactor,
        interval,
        nextReviewDate,
      },
    });

    // Log the review
    await this.prisma.flashcardReview.create({
      data: {
        flashcardId: cardId,
        quality,
        interval,
        easeFactor,
      },
    });

    return updatedCard as Flashcard;
  }

  /**
   * Calcular racha de días consecutivos de estudio
   */
  private async calculateStreakDays(userId: string): Promise<number> {
    // Obtener todas las fechas únicas de reviews del usuario
    const reviews = await this.prisma.flashcardReview.findMany({
      where: {
        flashcard: {
          deck: { userId },
        },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    if (reviews.length === 0) return 0;

    // Extraer fechas únicas (solo día, sin hora)
    const uniqueDates = new Set<string>();
    reviews.forEach((review: { createdAt: Date }) => {
      const dateStr = review.createdAt.toISOString().split("T")[0];
      uniqueDates.add(dateStr);
    });

    // Convertir a array y ordenar de más reciente a más antiguo
    const sortedDates = Array.from(uniqueDates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    // Verificar si estudió hoy o ayer (para mantener el streak)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Si no estudió ni hoy ni ayer, el streak es 0
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }

    // Contar días consecutivos
    let streak = 0;
    const currentDate = sortedDates[0] === todayStr ? today : yesterday;

    for (const dateStr of sortedDates) {
      const expectedDateStr = currentDate.toISOString().split("T")[0];

      if (dateStr === expectedDateStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dateStr < expectedDateStr) {
        // Hay un hueco, terminar el conteo
        break;
      }
    }

    return streak;
  }

  /**
   * Obtener estadísticas de estudio
   */
  async getStudyStats(
    userId: string,
    deckId?: string,
  ): Promise<{
    totalCards: number;
    dueToday: number;
    reviewedToday: number;
    averageEaseFactor: number;
    masteredCards: number;
    streakDays: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const where: any = { deck: { userId } };
    if (deckId) {
      where.deckId = deckId;
    }

    const [totalCards, dueCards, todayReviews, avgEase, mastered, streakDays] =
      await Promise.all([
        // Total cards
        this.prisma.flashcard.count({ where }),
        // Due today
        this.prisma.flashcard.count({
          where: { ...where, nextReviewDate: { lte: now } },
        }),
        // Reviewed today
        this.prisma.flashcardReview.findMany({
          where: {
            flashcard: where,
            createdAt: { gte: todayStart },
          },
        }),
        // Average ease factor
        this.prisma.flashcard.aggregate({
          where,
          _avg: { easeFactor: true },
        }),
        // Mastered (interval >= 21 days)
        this.prisma.flashcard.count({
          where: { ...where, interval: { gte: 21 } },
        }),
        // Calculate streak
        this.calculateStreakDays(userId),
      ]);

    return {
      totalCards,
      dueToday: dueCards,
      reviewedToday: todayReviews.length,
      averageEaseFactor: avgEase._avg?.easeFactor || DEFAULT_EASE_FACTOR,
      masteredCards: mastered,
      streakDays,
    };
  }

  /**
   * Obtener progreso del deck
   */
  async getDeckProgress(
    deckId: string,
    userId: string,
  ): Promise<{
    total: number;
    new: number;
    learning: number;
    reviewing: number;
    mastered: number;
  }> {
    await this.getDeck(deckId, userId);

    const [total, newCards, learning, reviewing, mastered] = await Promise.all([
      this.prisma.flashcard.count({ where: { deckId } }),
      this.prisma.flashcard.count({ where: { deckId, repetitions: 0 } }),
      this.prisma.flashcard.count({
        where: { deckId, repetitions: { gte: 1, lt: 3 } },
      }),
      this.prisma.flashcard.count({
        where: { deckId, repetitions: { gte: 3 }, interval: { lt: 21 } },
      }),
      this.prisma.flashcard.count({
        where: { deckId, interval: { gte: 21 } },
      }),
    ]);

    return {
      total,
      new: newCards,
      learning,
      reviewing,
      mastered,
    };
  }
}

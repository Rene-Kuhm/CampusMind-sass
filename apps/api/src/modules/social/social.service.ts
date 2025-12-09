import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  CreateProfessorReviewDto,
  UpdateBuddyPreferencesDto,
  CreateMarketplaceListingDto,
  UpdateMarketplaceListingDto,
  MarketplaceQueryDto,
  CreateMarketplaceMessageDto,
  ShareDeckDto,
  SharedDecksQueryDto,
  RateDeckDto,
  MatchStatusEnum,
} from "./dto";

// Extended Prisma type for social features
type PrismaWithSocial = PrismaService & {
  professor: {
    findFirst: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
  };
  professorReview: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown>;
    aggregate: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  studyBuddyPreferences: {
    upsert: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
  };
  studyBuddyMatch: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  marketplaceListing: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  marketplaceMessage: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    count: (args: unknown) => Promise<number>;
  };
  flashcardDeck: {
    findFirst: (args: unknown) => Promise<unknown>;
  };
  sharedFlashcardDeck: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  deckRating: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
    aggregate: (args: unknown) => Promise<unknown>;
    groupBy: (args: unknown) => Promise<unknown[]>;
    count: (args: unknown) => Promise<number>;
  };
  userProfile: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
};

interface UserProfile {
  firstName: string;
  lastName: string;
  university?: string | null;
  career?: string | null;
  year?: number | null;
  studyStyle?: string;
}

interface User {
  id: string;
  profile?: UserProfile | null;
}

interface ProfessorReview {
  id: string;
  userId: string;
  professorId: string;
  overallRating: number;
  difficultyRating: number;
  clarityRating: number;
  helpfulnessRating: number;
  courseName?: string | null;
  grade?: string | null;
  wouldTakeAgain: boolean;
  isForCredit: boolean;
  comment?: string | null;
  tags: string[];
  isAnonymous: boolean;
  isApproved: boolean;
  createdAt: Date;
  user?: User;
}

interface BuddyPreferences {
  id: string;
  userId: string;
  isSearching: boolean;
  subjects: string[];
  studyStyle: string;
  availability: unknown;
  sameUniversity: boolean;
  sameCareer: boolean;
  sameYear: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

interface BuddyMatch {
  id: string;
  userId1: string;
  userId2: string;
  commonSubjects: string[];
  matchScore: number;
  status: string;
  initiatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  user1?: User;
  user2?: User;
}

interface MarketplaceListing {
  id: string;
  sellerId: string;
  title: string;
  description?: string | null;
  type: string;
  condition: string;
  price: number;
  currency: string;
  isNegotiable: boolean;
  category?: string | null;
  isbn?: string | null;
  author?: string | null;
  edition?: string | null;
  images: string[];
  location?: string | null;
  isDelivery: boolean;
  isPickup: boolean;
  status: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  seller?: User;
}

interface MarketplaceMessage {
  id: string;
  listingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender?: User;
}

interface FlashcardDeck {
  id: string;
  userId: string;
  name: string;
  _count?: { flashcards: number };
}

interface SharedDeck {
  id: string;
  deckId: string;
  userId: string;
  title: string;
  description?: string | null;
  tags: string[];
  subject?: string | null;
  university?: string | null;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deck?: FlashcardDeck;
  user?: User;
}

interface DeckRating {
  id: string;
  sharedDeckId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  user?: User;
}

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);
  private readonly prisma: PrismaWithSocial;

  constructor(prisma: PrismaService) {
    this.prisma = prisma as PrismaWithSocial;
  }

  // ==================== PROFESSOR REVIEWS ====================

  /**
   * Create a review for a professor
   */
  async createProfessorReview(
    userId: string,
    professorId: string,
    dto: CreateProfessorReviewDto
  ) {
    // Verify professor exists
    const professor = await this.prisma.professor.findUnique({
      where: { id: professorId },
    });

    if (!professor) {
      throw new NotFoundException(`Professor with ID ${professorId} not found`);
    }

    // Check if user already reviewed this professor
    const existingReview = await this.prisma.professorReview.findFirst({
      where: { userId, professorId },
    });

    if (existingReview) {
      throw new ConflictException("You have already reviewed this professor");
    }

    const review = await this.prisma.professorReview.create({
      data: {
        userId,
        professorId,
        overallRating: dto.overallRating,
        difficultyRating: dto.difficultyRating,
        clarityRating: dto.clarityRating,
        helpfulnessRating: dto.helpfulnessRating,
        courseName: dto.courseName,
        grade: dto.grade,
        wouldTakeAgain: dto.wouldTakeAgain,
        isForCredit: dto.isForCredit ?? true,
        comment: dto.comment,
        tags: dto.tags ?? [],
        isAnonymous: dto.isAnonymous ?? true,
        isApproved: false, // Requires moderation
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    this.logger.log(`User ${userId} created review for professor ${professorId}`);

    return this.formatReviewResponse(review as ProfessorReview);
  }

  /**
   * Get all reviews for a professor
   */
  async getProfessorReviews(professorId: string) {
    // Verify professor exists
    const professor = await this.prisma.professor.findUnique({
      where: { id: professorId },
    });

    if (!professor) {
      throw new NotFoundException(`Professor with ID ${professorId} not found`);
    }

    const reviews = (await this.prisma.professorReview.findMany({
      where: {
        professorId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })) as ProfessorReview[];

    // Calculate aggregates
    const aggregates = (await this.prisma.professorReview.aggregate({
      where: { professorId, isApproved: true },
      _avg: {
        overallRating: true,
        difficultyRating: true,
        clarityRating: true,
        helpfulnessRating: true,
      },
      _count: true,
    })) as {
      _avg: {
        overallRating: number | null;
        difficultyRating: number | null;
        clarityRating: number | null;
        helpfulnessRating: number | null;
      };
      _count: number;
    };

    // Calculate would take again percentage
    const wouldTakeAgainCount = await this.prisma.professorReview.count({
      where: { professorId, isApproved: true, wouldTakeAgain: true },
    });

    const totalReviews = aggregates._count;
    const wouldTakeAgainPercent =
      totalReviews > 0 ? (wouldTakeAgainCount / totalReviews) * 100 : 0;

    return {
      reviews: reviews.map((r) => this.formatReviewResponse(r)),
      averageRating: aggregates._avg.overallRating ?? 0,
      averageDifficulty: aggregates._avg.difficultyRating ?? 0,
      averageClarity: aggregates._avg.clarityRating ?? 0,
      averageHelpfulness: aggregates._avg.helpfulnessRating ?? 0,
      wouldTakeAgainPercent: Math.round(wouldTakeAgainPercent),
      totalReviews,
    };
  }

  private formatReviewResponse(review: ProfessorReview) {
    return {
      id: review.id,
      professorId: review.professorId,
      overallRating: review.overallRating,
      difficultyRating: review.difficultyRating,
      clarityRating: review.clarityRating,
      helpfulnessRating: review.helpfulnessRating,
      courseName: review.courseName,
      grade: review.grade,
      wouldTakeAgain: review.wouldTakeAgain,
      isForCredit: review.isForCredit,
      comment: review.comment,
      tags: review.tags,
      isAnonymous: review.isAnonymous,
      isApproved: review.isApproved,
      createdAt: review.createdAt,
      reviewer: review.isAnonymous
        ? null
        : review.user
          ? {
              id: review.user.id,
              firstName: review.user.profile?.firstName,
              lastName: review.user.profile?.lastName,
            }
          : null,
    };
  }

  // ==================== STUDY BUDDY MATCHING ====================

  /**
   * Update or create buddy preferences
   */
  async updateBuddyPreferences(userId: string, dto: UpdateBuddyPreferencesDto) {
    const preferences = await this.prisma.studyBuddyPreferences.upsert({
      where: { userId },
      create: {
        userId,
        isSearching: dto.isSearching ?? false,
        subjects: dto.subjects ?? [],
        studyStyle: dto.studyStyle ?? "BALANCED",
        availability: dto.availability ?? null,
        sameUniversity: dto.sameUniversity ?? false,
        sameCareer: dto.sameCareer ?? false,
        sameYear: dto.sameYear ?? false,
      },
      update: {
        isSearching: dto.isSearching,
        subjects: dto.subjects,
        studyStyle: dto.studyStyle,
        availability: dto.availability,
        sameUniversity: dto.sameUniversity,
        sameCareer: dto.sameCareer,
        sameYear: dto.sameYear,
      },
    });

    this.logger.log(`User ${userId} updated buddy preferences`);

    return preferences;
  }

  /**
   * Get buddy preferences for a user
   */
  async getBuddyPreferences(userId: string) {
    const preferences = await this.prisma.studyBuddyPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Return default preferences
      return {
        id: null,
        userId,
        isSearching: false,
        subjects: [],
        studyStyle: "BALANCED",
        availability: null,
        sameUniversity: false,
        sameCareer: false,
        sameYear: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return preferences;
  }

  /**
   * Find potential study buddy matches
   */
  async findBuddyMatches(userId: string) {
    // Get user's preferences
    const userPrefs = (await this.prisma.studyBuddyPreferences.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            profile: {
              select: {
                university: true,
                career: true,
                year: true,
                studyStyle: true,
              },
            },
          },
        },
      },
    })) as BuddyPreferences | null;

    if (!userPrefs || !userPrefs.isSearching) {
      return { matches: [], total: 0 };
    }

    const userProfile = (userPrefs as BuddyPreferences & { user?: User }).user?.profile;

    // Build filters for potential matches
    const filters: Record<string, unknown> = {
      isSearching: true,
      userId: { not: userId },
    };

    // Find potential matches
    const potentialMatches = (await this.prisma.studyBuddyPreferences.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                university: true,
                career: true,
                year: true,
                studyStyle: true,
              },
            },
          },
        },
      },
    })) as (BuddyPreferences & { user: User })[];

    // Calculate match scores
    const scoredMatches = potentialMatches
      .map((match) => {
        const matchProfile = match.user?.profile;
        let score = 0;
        const commonSubjects: string[] = [];

        // Subject overlap (most important - up to 50 points)
        if (userPrefs.subjects.length > 0 && match.subjects.length > 0) {
          const overlap = userPrefs.subjects.filter((s) =>
            match.subjects.includes(s)
          );
          commonSubjects.push(...overlap);
          score += (overlap.length / Math.max(userPrefs.subjects.length, 1)) * 50;
        }

        // Study style match (up to 20 points)
        if (userPrefs.studyStyle === match.studyStyle) {
          score += 20;
        }

        // University match (up to 10 points)
        if (
          userProfile?.university &&
          matchProfile?.university &&
          userProfile.university === matchProfile.university
        ) {
          if (userPrefs.sameUniversity) score += 10;
          else score += 5;
        } else if (userPrefs.sameUniversity) {
          return null; // Filter out if sameUniversity required
        }

        // Career match (up to 10 points)
        if (
          userProfile?.career &&
          matchProfile?.career &&
          userProfile.career === matchProfile.career
        ) {
          if (userPrefs.sameCareer) score += 10;
          else score += 5;
        } else if (userPrefs.sameCareer) {
          return null; // Filter out if sameCareer required
        }

        // Year match (up to 10 points)
        if (
          userProfile?.year &&
          matchProfile?.year &&
          userProfile.year === matchProfile.year
        ) {
          if (userPrefs.sameYear) score += 10;
          else score += 5;
        } else if (userPrefs.sameYear) {
          return null; // Filter out if sameYear required
        }

        return {
          userId: match.user.id,
          matchScore: Math.round(score),
          commonSubjects,
          profile: matchProfile,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null && m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20); // Limit to top 20 matches

    // Check for existing matches
    const existingMatches = (await this.prisma.studyBuddyMatch.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
    })) as BuddyMatch[];

    const existingMatchUserIds = new Set(
      existingMatches.map((m) => (m.userId1 === userId ? m.userId2 : m.userId1))
    );

    const formattedMatches = scoredMatches.map((match) => {
      const existingMatch = existingMatches.find(
        (em) => em.userId1 === match.userId || em.userId2 === match.userId
      );

      return {
        id: existingMatch?.id ?? `potential-${match.userId}`,
        matchScore: match.matchScore,
        commonSubjects: match.commonSubjects,
        status: existingMatch?.status ?? "NONE",
        initiatedBy: existingMatch?.initiatedBy ?? "",
        createdAt: existingMatch?.createdAt ?? new Date(),
        matchedUser: {
          id: match.userId,
          firstName: match.profile?.firstName,
          lastName: match.profile?.lastName,
          university: match.profile?.university,
          career: match.profile?.career,
          year: match.profile?.year,
          studyStyle: match.profile?.studyStyle,
        },
        isExisting: existingMatchUserIds.has(match.userId),
      };
    });

    return {
      matches: formattedMatches,
      total: formattedMatches.length,
    };
  }

  /**
   * Initiate or update a buddy match
   */
  async updateMatchStatus(
    userId: string,
    matchId: string,
    status: MatchStatusEnum
  ) {
    const match = (await this.prisma.studyBuddyMatch.findFirst({
      where: {
        id: matchId,
        OR: [{ userId1: userId }, { userId2: userId }],
      },
    })) as BuddyMatch | null;

    if (!match) {
      throw new NotFoundException("Match not found");
    }

    // Only the non-initiator can accept/reject pending matches
    if (match.status === "PENDING" && match.initiatedBy === userId) {
      if (status === MatchStatusEnum.ACCEPTED || status === MatchStatusEnum.REJECTED) {
        throw new BadRequestException(
          "You cannot accept/reject a match you initiated"
        );
      }
    }

    const updatedMatch = await this.prisma.studyBuddyMatch.update({
      where: { id: matchId },
      data: { status },
      include: {
        user1: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        user2: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    this.logger.log(`Match ${matchId} status updated to ${status}`);

    return updatedMatch;
  }

  /**
   * Create a new buddy match request
   */
  async createBuddyMatch(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException("You cannot match with yourself");
    }

    // Check if match already exists
    const existingMatch = await this.prisma.studyBuddyMatch.findFirst({
      where: {
        OR: [
          { userId1: userId, userId2: targetUserId },
          { userId1: targetUserId, userId2: userId },
        ],
      },
    });

    if (existingMatch) {
      throw new ConflictException("A match already exists with this user");
    }

    // Get common subjects
    const userPrefs = (await this.prisma.studyBuddyPreferences.findUnique({
      where: { userId },
    })) as BuddyPreferences | null;

    const targetPrefs = (await this.prisma.studyBuddyPreferences.findUnique({
      where: { userId: targetUserId },
    })) as BuddyPreferences | null;

    const commonSubjects = userPrefs?.subjects.filter((s) =>
      targetPrefs?.subjects.includes(s)
    ) ?? [];

    const match = await this.prisma.studyBuddyMatch.create({
      data: {
        userId1: userId,
        userId2: targetUserId,
        commonSubjects,
        matchScore: commonSubjects.length * 10, // Simple score
        status: "PENDING",
        initiatedBy: userId,
      },
      include: {
        user1: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        user2: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    this.logger.log(`User ${userId} initiated match with ${targetUserId}`);

    return match;
  }

  // ==================== MARKETPLACE ====================

  /**
   * Create a marketplace listing
   */
  async createListing(userId: string, dto: CreateMarketplaceListingDto) {
    const listing = await this.prisma.marketplaceListing.create({
      data: {
        sellerId: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        condition: dto.condition ?? "GOOD",
        price: dto.price,
        currency: dto.currency ?? "ARS",
        isNegotiable: dto.isNegotiable ?? true,
        category: dto.category,
        isbn: dto.isbn,
        author: dto.author,
        edition: dto.edition,
        images: dto.images ?? [],
        location: dto.location,
        isDelivery: dto.isDelivery ?? false,
        isPickup: dto.isPickup ?? true,
        status: "ACTIVE",
      },
      include: {
        seller: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, university: true },
            },
          },
        },
      },
    });

    this.logger.log(`User ${userId} created listing: ${listing.id}`);

    return this.formatListingResponse(listing as MarketplaceListing);
  }

  /**
   * Get marketplace listings with filters
   */
  async getListings(query: MarketplaceQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.category) {
      where.category = { contains: query.category, mode: "insensitive" };
    }

    if (query.condition) {
      where.condition = query.condition;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        (where.price as Record<string, number>).gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        (where.price as Record<string, number>).lte = query.maxPrice;
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { author: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [listings, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              profile: {
                select: { firstName: true, lastName: true, university: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);

    return {
      listings: (listings as MarketplaceListing[]).map((l) =>
        this.formatListingResponse(l)
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single listing by ID
   */
  async getListing(listingId: string, incrementView = true) {
    const listing = (await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, university: true },
            },
          },
        },
      },
    })) as MarketplaceListing | null;

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    // Increment view count
    if (incrementView) {
      await this.prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { viewCount: { increment: 1 } },
      });
    }

    return this.formatListingResponse(listing);
  }

  /**
   * Get user's own listings
   */
  async getUserListings(userId: string) {
    const listings = (await this.prisma.marketplaceListing.findMany({
      where: { sellerId: userId },
      include: {
        seller: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, university: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })) as MarketplaceListing[];

    return {
      listings: listings.map((l) => this.formatListingResponse(l)),
      total: listings.length,
      page: 1,
      limit: listings.length,
      totalPages: 1,
    };
  }

  /**
   * Update a listing
   */
  async updateListing(
    userId: string,
    listingId: string,
    dto: UpdateMarketplaceListingDto
  ) {
    const listing = (await this.prisma.marketplaceListing.findFirst({
      where: { id: listingId, sellerId: userId },
    })) as MarketplaceListing | null;

    if (!listing) {
      throw new NotFoundException("Listing not found or you don't have permission");
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        condition: dto.condition,
        price: dto.price,
        currency: dto.currency,
        isNegotiable: dto.isNegotiable,
        category: dto.category,
        isbn: dto.isbn,
        author: dto.author,
        edition: dto.edition,
        images: dto.images,
        location: dto.location,
        isDelivery: dto.isDelivery,
        isPickup: dto.isPickup,
        status: dto.status,
      },
      include: {
        seller: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, university: true },
            },
          },
        },
      },
    });

    this.logger.log(`User ${userId} updated listing ${listingId}`);

    return this.formatListingResponse(updated as MarketplaceListing);
  }

  /**
   * Delete a listing
   */
  async deleteListing(userId: string, listingId: string) {
    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { id: listingId, sellerId: userId },
    });

    if (!listing) {
      throw new NotFoundException("Listing not found or you don't have permission");
    }

    await this.prisma.marketplaceListing.delete({
      where: { id: listingId },
    });

    this.logger.log(`User ${userId} deleted listing ${listingId}`);

    return { success: true, message: "Listing deleted successfully" };
  }

  /**
   * Send a message about a listing
   */
  async sendListingMessage(
    userId: string,
    listingId: string,
    dto: CreateMarketplaceMessageDto
  ) {
    const listing = (await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    })) as MarketplaceListing | null;

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    if (listing.sellerId === userId) {
      throw new BadRequestException("You cannot message yourself");
    }

    const message = await this.prisma.marketplaceMessage.create({
      data: {
        listingId,
        senderId: userId,
        receiverId: listing.sellerId,
        content: dto.content,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    this.logger.log(`User ${userId} sent message about listing ${listingId}`);

    return this.formatMessageResponse(message as MarketplaceMessage);
  }

  /**
   * Get messages for a listing
   */
  async getListingMessages(userId: string, listingId: string) {
    const listing = (await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    })) as MarketplaceListing | null;

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    // Only seller or message participants can view messages
    const messages = (await this.prisma.marketplaceMessage.findMany({
      where: {
        listingId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })) as MarketplaceMessage[];

    return {
      messages: messages.map((m) => this.formatMessageResponse(m)),
      total: messages.length,
    };
  }

  private formatListingResponse(listing: MarketplaceListing) {
    return {
      id: listing.id,
      sellerId: listing.sellerId,
      title: listing.title,
      description: listing.description,
      type: listing.type,
      condition: listing.condition,
      price: listing.price,
      currency: listing.currency,
      isNegotiable: listing.isNegotiable,
      category: listing.category,
      isbn: listing.isbn,
      author: listing.author,
      edition: listing.edition,
      images: listing.images,
      location: listing.location,
      isDelivery: listing.isDelivery,
      isPickup: listing.isPickup,
      status: listing.status,
      viewCount: listing.viewCount,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      seller: listing.seller
        ? {
            id: listing.seller.id,
            firstName: listing.seller.profile?.firstName,
            lastName: listing.seller.profile?.lastName,
            university: listing.seller.profile?.university,
          }
        : undefined,
    };
  }

  private formatMessageResponse(message: MarketplaceMessage) {
    return {
      id: message.id,
      listingId: message.listingId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: message.sender
        ? {
            id: message.sender.id,
            firstName: message.sender.profile?.firstName,
            lastName: message.sender.profile?.lastName,
          }
        : undefined,
    };
  }

  // ==================== SHARED FLASHCARD DECKS ====================

  /**
   * Share a flashcard deck
   */
  async shareDeck(userId: string, deckId: string, dto: ShareDeckDto) {
    // Verify deck exists and belongs to user
    const deck = (await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, userId },
      include: {
        _count: { select: { flashcards: true } },
      },
    })) as FlashcardDeck | null;

    if (!deck) {
      throw new NotFoundException("Deck not found or you don't have permission");
    }

    // Check if already shared
    const existingShare = await this.prisma.sharedFlashcardDeck.findFirst({
      where: { deckId },
    });

    if (existingShare) {
      throw new ConflictException("This deck is already shared");
    }

    const sharedDeck = await this.prisma.sharedFlashcardDeck.create({
      data: {
        deckId,
        userId,
        title: dto.title,
        description: dto.description,
        tags: dto.tags ?? [],
        subject: dto.subject,
        university: dto.university,
        isApproved: false, // Requires moderation
        isActive: true,
      },
      include: {
        deck: {
          include: {
            _count: { select: { flashcards: true } },
          },
        },
        user: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    this.logger.log(`User ${userId} shared deck ${deckId}`);

    return this.formatSharedDeckResponse(sharedDeck as SharedDeck);
  }

  /**
   * Get shared decks with filters
   */
  async getSharedDecks(query: SharedDecksQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isApproved: true,
      isActive: true,
    };

    if (query.subject) {
      where.subject = { contains: query.subject, mode: "insensitive" };
    }

    if (query.university) {
      where.university = { contains: query.university, mode: "insensitive" };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search } },
      ];
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (query.sortBy === "rating") {
      orderBy = { rating: "desc" };
    } else if (query.sortBy === "downloads") {
      orderBy = { downloadCount: "desc" };
    }

    const [decks, total] = await Promise.all([
      this.prisma.sharedFlashcardDeck.findMany({
        where,
        include: {
          deck: {
            include: {
              _count: { select: { flashcards: true } },
            },
          },
          user: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.sharedFlashcardDeck.count({ where }),
    ]);

    return {
      decks: (decks as SharedDeck[]).map((d) => this.formatSharedDeckResponse(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single shared deck
   */
  async getSharedDeck(sharedDeckId: string) {
    const deck = (await this.prisma.sharedFlashcardDeck.findUnique({
      where: { id: sharedDeckId },
      include: {
        deck: {
          include: {
            _count: { select: { flashcards: true } },
          },
        },
        user: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })) as SharedDeck | null;

    if (!deck) {
      throw new NotFoundException(`Shared deck with ID ${sharedDeckId} not found`);
    }

    return this.formatSharedDeckResponse(deck);
  }

  /**
   * Rate a shared deck
   */
  async rateDeck(userId: string, sharedDeckId: string, dto: RateDeckDto) {
    const sharedDeck = (await this.prisma.sharedFlashcardDeck.findUnique({
      where: { id: sharedDeckId },
    })) as SharedDeck | null;

    if (!sharedDeck) {
      throw new NotFoundException(`Shared deck with ID ${sharedDeckId} not found`);
    }

    if (sharedDeck.userId === userId) {
      throw new BadRequestException("You cannot rate your own deck");
    }

    // Upsert rating (user can update their rating)
    const rating = await this.prisma.deckRating.upsert({
      where: {
        sharedDeckId_userId: {
          sharedDeckId,
          userId,
        },
      },
      create: {
        sharedDeckId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Update deck's average rating
    const aggregates = (await this.prisma.deckRating.aggregate({
      where: { sharedDeckId },
      _avg: { rating: true },
      _count: true,
    })) as { _avg: { rating: number | null }; _count: number };

    await this.prisma.sharedFlashcardDeck.update({
      where: { id: sharedDeckId },
      data: {
        rating: aggregates._avg.rating ?? 0,
        ratingCount: aggregates._count,
      },
    });

    this.logger.log(`User ${userId} rated deck ${sharedDeckId}: ${dto.rating}/5`);

    return this.formatRatingResponse(rating as DeckRating);
  }

  /**
   * Get ratings for a shared deck
   */
  async getDeckRatings(sharedDeckId: string) {
    const sharedDeck = await this.prisma.sharedFlashcardDeck.findUnique({
      where: { id: sharedDeckId },
    });

    if (!sharedDeck) {
      throw new NotFoundException(`Shared deck with ID ${sharedDeckId} not found`);
    }

    const ratings = (await this.prisma.deckRating.findMany({
      where: { sharedDeckId },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })) as DeckRating[];

    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    for (const r of ratings) {
      distribution[r.rating as keyof typeof distribution]++;
      totalRating += r.rating;
    }

    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    return {
      ratings: ratings.map((r) => this.formatRatingResponse(r)),
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
      distribution,
    };
  }

  private formatSharedDeckResponse(deck: SharedDeck) {
    return {
      id: deck.id,
      deckId: deck.deckId,
      userId: deck.userId,
      title: deck.title,
      description: deck.description,
      tags: deck.tags,
      subject: deck.subject,
      university: deck.university,
      downloadCount: deck.downloadCount,
      rating: Math.round(deck.rating * 10) / 10,
      ratingCount: deck.ratingCount,
      isApproved: deck.isApproved,
      isActive: deck.isActive,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      cardCount: deck.deck?._count?.flashcards ?? 0,
      sharedBy: deck.user
        ? {
            id: deck.user.id,
            firstName: deck.user.profile?.firstName,
            lastName: deck.user.profile?.lastName,
          }
        : undefined,
    };
  }

  private formatRatingResponse(rating: DeckRating) {
    return {
      id: rating.id,
      sharedDeckId: rating.sharedDeckId,
      userId: rating.userId,
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.createdAt,
      ratedBy: rating.user
        ? {
            id: rating.user.id,
            firstName: rating.user.profile?.firstName,
            lastName: rating.user.profile?.lastName,
          }
        : undefined,
    };
  }
}

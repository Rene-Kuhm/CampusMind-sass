import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  ImportDataDto,
  ImportFlashcardsDto,
  ImportTasksDto,
  ImportNotesDto,
  ParseCsvDto,
  ImportResultDto,
  ExportDataDto,
  ImportType,
  ImportFormat,
} from "./dto/import.dto";

type PrismaWithImport = PrismaService & {
  flashcardDeck: {
    create: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
  };
  flashcard: {
    create: (args: any) => Promise<any>;
    createMany: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
  task: {
    create: (args: any) => Promise<any>;
    createMany: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
  resourceNote: {
    create: (args: any) => Promise<any>;
    createMany: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
};

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly prisma: PrismaWithImport;

  constructor(prisma: PrismaService) {
    this.prisma = prisma as PrismaWithImport;
  }

  /**
   * Parse CSV content into rows
   */
  parseCsv(dto: ParseCsvDto): { headers: string[]; rows: Record<string, string>[] } {
    const { content, delimiter = ",", hasHeader = true } = dto;

    const lines = content.trim().split("\n").map(line => line.trim());
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    let headers: string[];
    let dataLines: string[];

    if (hasHeader) {
      headers = parseRow(lines[0]);
      dataLines = lines.slice(1);
    } else {
      const firstRow = parseRow(lines[0]);
      headers = firstRow.map((_, i) => `column_${i + 1}`);
      dataLines = lines;
    }

    const rows = dataLines
      .filter(line => line.length > 0)
      .map(line => {
        const values = parseRow(line);
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || "";
        });
        return row;
      });

    return { headers, rows };
  }

  /**
   * Import flashcards from structured data
   */
  async importFlashcards(
    userId: string,
    dto: ImportFlashcardsDto,
  ): Promise<ImportResultDto> {
    const errors: string[] = [];
    const createdIds: string[] = [];
    let imported = 0;
    let failed = 0;

    // Get or create deck
    let deckId = dto.deckId;
    if (!deckId && dto.deckName) {
      const deck = await this.prisma.flashcardDeck.create({
        data: {
          userId,
          name: dto.deckName,
          subjectId: dto.subjectId,
        },
      });
      deckId = deck.id;
    }

    if (!deckId) {
      throw new BadRequestException("Se requiere deckId o deckName");
    }

    // Verify deck belongs to user
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, userId },
    });
    if (!deck) {
      throw new BadRequestException("Deck no encontrado");
    }

    // Import cards
    for (let i = 0; i < dto.cards.length; i++) {
      const card = dto.cards[i];
      try {
        if (!card.front || !card.back) {
          throw new Error("Front y back son requeridos");
        }

        const created = await this.prisma.flashcard.create({
          data: {
            deckId,
            front: card.front.slice(0, 500),
            back: card.back.slice(0, 2000),
            formula: card.formula,
            tags: card.tags || [],
            repetitions: 0,
            easeFactor: 2.5,
            interval: 0,
            nextReviewDate: new Date(),
          },
        });
        createdIds.push(created.id);
        imported++;
      } catch (error) {
        failed++;
        errors.push(`Fila ${i + 1}: ${error instanceof Error ? error.message : "Error desconocido"}`);
      }
    }

    return { imported, failed, errors, createdIds };
  }

  /**
   * Import tasks from structured data
   */
  async importTasks(
    userId: string,
    dto: ImportTasksDto,
  ): Promise<ImportResultDto> {
    const errors: string[] = [];
    const createdIds: string[] = [];
    let imported = 0;
    let failed = 0;

    // Verify subject if provided
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new BadRequestException("Materia no encontrada");
      }
    }

    for (let i = 0; i < dto.tasks.length; i++) {
      const task = dto.tasks[i];
      try {
        if (!task.title) {
          throw new Error("Titulo es requerido");
        }

        const priorityMap: Record<string, string> = {
          low: "LOW",
          medium: "MEDIUM",
          high: "HIGH",
          bajo: "LOW",
          medio: "MEDIUM",
          alto: "HIGH",
        };

        const created = await this.prisma.task.create({
          data: {
            userId,
            subjectId: dto.subjectId,
            title: task.title.slice(0, 200),
            description: task.description,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            priority: priorityMap[task.priority?.toLowerCase() || "medium"] || "MEDIUM",
            status: "PENDING",
          },
        });
        createdIds.push(created.id);
        imported++;
      } catch (error) {
        failed++;
        errors.push(`Fila ${i + 1}: ${error instanceof Error ? error.message : "Error desconocido"}`);
      }
    }

    return { imported, failed, errors, createdIds };
  }

  /**
   * Generic import from CSV/JSON
   */
  async importData(
    userId: string,
    dto: ImportDataDto,
  ): Promise<ImportResultDto> {
    const { type, format, content } = dto;

    // Parse content based on format
    let data: any[];
    if (format === ImportFormat.JSON) {
      try {
        data = JSON.parse(content);
        if (!Array.isArray(data)) {
          data = [data];
        }
      } catch {
        throw new BadRequestException("JSON invalido");
      }
    } else if (format === ImportFormat.CSV) {
      const parsed = this.parseCsv({ content });
      data = parsed.rows;

      // Apply column mapping if provided
      if (dto.columnMapping) {
        data = data.map(row => {
          const mapped: Record<string, any> = {};
          Object.entries(dto.columnMapping!).forEach(([target, source]) => {
            mapped[target] = row[source];
          });
          return mapped;
        });
      }
    } else {
      throw new BadRequestException(`Formato no soportado: ${format}`);
    }

    // Route to specific importer
    switch (type) {
      case ImportType.FLASHCARDS:
        return this.importFlashcards(userId, {
          deckId: dto.deckId,
          subjectId: dto.subjectId,
          cards: data.map(item => ({
            front: item.front || item.pregunta || item.question || "",
            back: item.back || item.respuesta || item.answer || "",
            tags: item.tags ? (Array.isArray(item.tags) ? item.tags : [item.tags]) : [],
            formula: item.formula,
          })),
        });

      case ImportType.TASKS:
        return this.importTasks(userId, {
          subjectId: dto.subjectId,
          tasks: data.map(item => ({
            title: item.title || item.titulo || item.name || "",
            description: item.description || item.descripcion || "",
            dueDate: item.dueDate || item.fecha || item.due_date || undefined,
            priority: item.priority || item.prioridad || "medium",
          })),
        });

      default:
        throw new BadRequestException(`Tipo de importacion no soportado: ${type}`);
    }
  }

  /**
   * Export data to CSV/JSON
   */
  async exportData(
    userId: string,
    dto: ExportDataDto,
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const { type, format, subjectId, deckId } = dto;

    let data: any[];
    let filename: string;

    switch (type) {
      case ImportType.FLASHCARDS: {
        const where: any = { deck: { userId } };
        if (deckId) where.deckId = deckId;
        if (subjectId) where.deck = { ...where.deck, subjectId };

        const flashcards = await this.prisma.flashcard.findMany({
          where,
          include: { deck: { select: { name: true } } },
        });

        data = flashcards.map((fc: any) => ({
          front: fc.front,
          back: fc.back,
          formula: fc.formula || "",
          tags: fc.tags.join(", "),
          deck: fc.deck?.name || "",
        }));
        filename = `flashcards_export_${Date.now()}`;
        break;
      }

      case ImportType.TASKS: {
        const where: any = { userId };
        if (subjectId) where.subjectId = subjectId;

        const tasks = await this.prisma.task.findMany({
          where,
          include: { subject: { select: { name: true } } },
        });

        data = tasks.map((task: any) => ({
          title: task.title,
          description: task.description || "",
          dueDate: task.dueDate?.toISOString() || "",
          priority: task.priority,
          status: task.status,
          subject: task.subject?.name || "",
        }));
        filename = `tasks_export_${Date.now()}`;
        break;
      }

      default:
        throw new BadRequestException(`Tipo de exportacion no soportado: ${type}`);
    }

    if (format === "json") {
      return {
        content: JSON.stringify(data, null, 2),
        filename: `${filename}.json`,
        mimeType: "application/json",
      };
    } else {
      // CSV
      if (data.length === 0) {
        return { content: "", filename: `${filename}.csv`, mimeType: "text/csv" };
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map(row =>
          headers.map(h => {
            const val = row[h]?.toString() || "";
            return val.includes(",") || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          }).join(",")
        ),
      ];

      return {
        content: csvRows.join("\n"),
        filename: `${filename}.csv`,
        mimeType: "text/csv",
      };
    }
  }

  /**
   * Get import templates
   */
  getTemplates(): Record<string, { headers: string[]; example: Record<string, string>[] }> {
    return {
      flashcards: {
        headers: ["front", "back", "tags", "formula"],
        example: [
          { front: "¿Qué es la fotosíntesis?", back: "Proceso por el cual las plantas convierten luz solar en energía", tags: "biología,plantas", formula: "" },
          { front: "¿Cuál es la fórmula del agua?", back: "H2O", tags: "química", formula: "H₂O" },
        ],
      },
      tasks: {
        headers: ["title", "description", "dueDate", "priority"],
        example: [
          { title: "Estudiar para examen", description: "Repasar capítulos 1-5", dueDate: "2024-03-15", priority: "high" },
          { title: "Entregar tarea", description: "Ejercicios de matemáticas", dueDate: "2024-03-10", priority: "medium" },
        ],
      },
    };
  }
}

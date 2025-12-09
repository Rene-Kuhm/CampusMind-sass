import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { CreateMindMapDto, UpdateMindMapDto } from "./dto/mindmap.dto";

type PrismaWithMindMaps = PrismaService & {
  mindMap: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
};

export interface MindMap {
  id: string;
  userId: string;
  subjectId?: string | null;
  title: string;
  description?: string | null;
  data: any;
  thumbnail?: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MindMapsService {
  private readonly logger = new Logger(MindMapsService.name);
  private readonly prisma: PrismaWithMindMaps;

  constructor(prisma: PrismaService) {
    this.prisma = prisma as PrismaWithMindMaps;
  }

  /**
   * Crear un nuevo mapa mental
   */
  async create(userId: string, dto: CreateMindMapDto): Promise<MindMap> {
    // Validar materia si se proporciona
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    const mindMap = await this.prisma.mindMap.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        data: dto.data,
        tags: dto.tags || [],
        isPublic: dto.isPublic || false,
      },
    });

    return mindMap as MindMap;
  }

  /**
   * Obtener todos los mapas mentales del usuario
   */
  async findAll(
    userId: string,
    options?: {
      subjectId?: string;
      search?: string;
      isPublic?: boolean;
    },
  ): Promise<MindMap[]> {
    const where: any = { userId };

    if (options?.subjectId) {
      where.subjectId = options.subjectId;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { tags: { hasSome: [options.search.toLowerCase()] } },
      ];
    }

    if (options?.isPublic !== undefined) {
      where.isPublic = options.isPublic;
    }

    const mindMaps = await this.prisma.mindMap.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return mindMaps as MindMap[];
  }

  /**
   * Obtener mapas mentales publicos
   */
  async findPublic(options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<MindMap[]> {
    const where: any = { isPublic: true };

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { tags: { hasSome: [options.search.toLowerCase()] } },
      ];
    }

    const mindMaps = await this.prisma.mindMap.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        user: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    return mindMaps as MindMap[];
  }

  /**
   * Obtener mapa mental por ID
   */
  async findOne(id: string, userId: string): Promise<MindMap> {
    const mindMap = await this.prisma.mindMap.findFirst({
      where: {
        id,
        OR: [{ userId }, { isPublic: true }],
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!mindMap) {
      throw new NotFoundException("Mapa mental no encontrado");
    }

    return mindMap as MindMap;
  }

  /**
   * Actualizar mapa mental
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateMindMapDto,
  ): Promise<MindMap> {
    // Verificar que el mapa pertenece al usuario
    const existing = await this.prisma.mindMap.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException("Mapa mental no encontrado");
    }

    // Validar materia si se proporciona
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    const mindMap = await this.prisma.mindMap.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.data && { data: dto.data }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return mindMap as MindMap;
  }

  /**
   * Eliminar mapa mental
   */
  async remove(id: string, userId: string): Promise<void> {
    const mindMap = await this.prisma.mindMap.findFirst({
      where: { id, userId },
    });

    if (!mindMap) {
      throw new NotFoundException("Mapa mental no encontrado");
    }

    await this.prisma.mindMap.delete({ where: { id } });
  }

  /**
   * Duplicar mapa mental
   */
  async duplicate(id: string, userId: string): Promise<MindMap> {
    const original = await this.findOne(id, userId);

    const duplicate = await this.prisma.mindMap.create({
      data: {
        userId,
        title: `${original.title} (copia)`,
        description: original.description,
        subjectId: original.subjectId,
        data: original.data,
        tags: original.tags,
        isPublic: false, // Duplicates are private by default
      },
    });

    return duplicate as MindMap;
  }

  /**
   * Obtener estadisticas de mapas mentales del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    public: number;
    private: number;
    bySubject: { subjectId: string; subjectName: string; count: number }[];
  }> {
    const [total, publicCount, bySubject] = await Promise.all([
      this.prisma.mindMap.count({ where: { userId } }),
      this.prisma.mindMap.count({ where: { userId, isPublic: true } }),
      this.prisma.mindMap.findMany({
        where: { userId, subjectId: { not: null } },
        select: {
          subjectId: true,
          subject: { select: { name: true } },
        },
      }),
    ]);

    // Group by subject
    const subjectCounts = new Map<
      string,
      { subjectId: string; subjectName: string; count: number }
    >();
    for (const map of bySubject) {
      if (map.subjectId) {
        const existing = subjectCounts.get(map.subjectId);
        if (existing) {
          existing.count++;
        } else {
          subjectCounts.set(map.subjectId, {
            subjectId: map.subjectId,
            subjectName: map.subject?.name || "Sin nombre",
            count: 1,
          });
        }
      }
    }

    return {
      total,
      public: publicCount,
      private: total - publicCount,
      bySubject: Array.from(subjectCounts.values()),
    };
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UsageLimitsService } from "../billing/services/usage-limits.service";
import { UsageTypeEnum } from "../billing/constants/plans.constant";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageLimitsService: UsageLimitsService,
  ) {}

  async create(userId: string, dto: CreateTaskDto) {
    // Verificar límite de tareas activas
    await this.usageLimitsService.enforceUsageLimit(
      userId,
      UsageTypeEnum.TASKS,
      "Has alcanzado el límite de tareas activas. Completa o elimina tareas existentes, o mejora tu plan.",
    );

    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        priority: dto.priority || "MEDIUM",
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : null,
        tags: dto.tags || [],
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  async findAll(
    userId: string,
    options?: {
      subjectId?: string;
      status?: string;
      priority?: string;
      dueBefore?: string;
      dueAfter?: string;
    },
  ) {
    const where: any = { userId };

    if (options?.subjectId) {
      where.subjectId = options.subjectId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.priority) {
      where.priority = options.priority;
    }

    if (options?.dueBefore || options?.dueAfter) {
      where.dueDate = {};
      if (options.dueBefore) {
        where.dueDate.lte = new Date(options.dueBefore);
      }
      if (options.dueAfter) {
        where.dueDate.gte = new Date(options.dueAfter);
      }
    }

    return this.prisma.task.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        attachments: true,
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: {
        subject: true,
        attachments: true,
      },
    });

    if (!task) {
      throw new NotFoundException("Tarea no encontrada");
    }

    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    await this.findOne(id, userId);

    const updateData: any = { ...dto };

    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    if (dto.reminderAt) {
      updateData.reminderAt = new Date(dto.reminderAt);
    }

    // Si se marca como completada, registrar la fecha
    if (dto.status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (dto.status) {
      // Si se cambia a otro estado, limpiar la fecha de completado
      updateData.completedAt = null;
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async markComplete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  async getUpcoming(userId: string, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.task.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  async getOverdue(userId: string) {
    const now = new Date();

    return this.prisma.task.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  async getStats(userId: string) {
    const [total, completed, pending, overdue] = await Promise.all([
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.count({
        where: { userId, status: "COMPLETED" },
      }),
      this.prisma.task.count({
        where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
      this.prisma.task.count({
        where: {
          userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    // Tasks by subject
    const bySubject = await this.prisma.task.groupBy({
      by: ["subjectId"],
      where: { userId },
      _count: true,
    });

    // Tasks by priority
    const byPriority = await this.prisma.task.groupBy({
      by: ["priority"],
      where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      _count: true,
    });

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      bySubject,
      byPriority,
    };
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async bulkUpdateStatus(ids: string[], userId: string, status: string) {
    // Verify ownership
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: ids }, userId },
    });

    if (tasks.length !== ids.length) {
      throw new NotFoundException("Una o más tareas no encontradas");
    }

    const updateData: any = { status };
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    return this.prisma.task.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });
  }

  async bulkDelete(ids: string[], userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: ids }, userId },
    });

    if (tasks.length !== ids.length) {
      throw new NotFoundException("Una o más tareas no encontradas");
    }

    return this.prisma.task.deleteMany({
      where: { id: { in: ids } },
    });
  }
}

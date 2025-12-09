import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { CreateSessionDto, EndSessionDto, StudySessionType } from "./dto/create-session.dto";
import { UsageLimitsService } from "../billing/services/usage-limits.service";
import { UsageTypeEnum } from "../billing/constants/plans.constant";

@Injectable()
export class StudySessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageLimitsService: UsageLimitsService,
  ) {}

  async startSession(userId: string, dto: CreateSessionDto) {
    // Check for active sessions
    const activeSession = await this.prisma.studySession.findFirst({
      where: { userId, status: "IN_PROGRESS" },
    });

    if (activeSession) {
      throw new BadRequestException("Ya tienes una sesión activa. Finalízala primero.");
    }

    // Check usage limits
    await this.usageLimitsService.enforceUsageLimit(
      userId,
      UsageTypeEnum.STUDY_SESSIONS,
      "Has alcanzado el límite de sesiones de estudio de tu plan.",
    );

    // Set defaults based on session type
    let targetMinutes = dto.targetMinutes ?? 25;
    let breakMinutes = dto.breakMinutes ?? 5;

    if (dto.type === StudySessionType.DEEP_WORK) {
      targetMinutes = dto.targetMinutes ?? 90;
      breakMinutes = dto.breakMinutes ?? 20;
    } else if (dto.type === StudySessionType.EXAM_MODE) {
      targetMinutes = dto.targetMinutes ?? 120;
      breakMinutes = 0;
    }

    const session = await this.prisma.studySession.create({
      data: {
        userId,
        subjectId: dto.subjectId,
        type: dto.type || StudySessionType.POMODORO,
        targetMinutes,
        breakMinutes,
        startedAt: new Date(),
        status: "IN_PROGRESS",
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Increment usage
    await this.usageLimitsService.incrementUsage(userId, UsageTypeEnum.STUDY_SESSIONS);

    return session;
  }

  async endSession(id: string, userId: string, dto: EndSessionDto) {
    const session = await this.prisma.studySession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException("Sesión no encontrada");
    }

    if (session.status !== "IN_PROGRESS") {
      throw new BadRequestException("La sesión ya fue finalizada");
    }

    const endedAt = new Date();
    const actualMinutes = Math.round(
      (endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60),
    );

    return this.prisma.studySession.update({
      where: { id },
      data: {
        endedAt,
        actualMinutes,
        focusScore: dto.focusScore,
        notes: dto.notes,
        status: "COMPLETED",
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  async pauseSession(id: string, userId: string) {
    const session = await this.prisma.studySession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException("Sesión no encontrada");
    }

    if (session.status !== "IN_PROGRESS") {
      throw new BadRequestException("Solo puedes pausar sesiones activas");
    }

    return this.prisma.studySession.update({
      where: { id },
      data: { status: "PAUSED" },
    });
  }

  async resumeSession(id: string, userId: string) {
    const session = await this.prisma.studySession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException("Sesión no encontrada");
    }

    if (session.status !== "PAUSED") {
      throw new BadRequestException("Solo puedes reanudar sesiones pausadas");
    }

    return this.prisma.studySession.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });
  }

  async abandonSession(id: string, userId: string) {
    const session = await this.prisma.studySession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException("Sesión no encontrada");
    }

    const endedAt = new Date();
    const actualMinutes = Math.round(
      (endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60),
    );

    return this.prisma.studySession.update({
      where: { id },
      data: {
        endedAt,
        actualMinutes,
        status: "ABANDONED",
      },
    });
  }

  async getActiveSession(userId: string) {
    return this.prisma.studySession.findFirst({
      where: { userId, status: { in: ["IN_PROGRESS", "PAUSED"] } },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  async getSessionHistory(
    userId: string,
    options?: {
      subjectId?: string;
      type?: StudySessionType;
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
  ) {
    const where: any = { userId };

    if (options?.subjectId) {
      where.subjectId = options.subjectId;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.startDate || options?.endDate) {
      where.startedAt = {};
      if (options.startDate) {
        where.startedAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.startedAt.lte = new Date(options.endDate);
      }
    }

    return this.prisma.studySession.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: options?.limit || 50,
    });
  }

  async getStats(
    userId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { userId, status: "COMPLETED" };

    if (options?.startDate || options?.endDate) {
      where.startedAt = {};
      if (options.startDate) {
        where.startedAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.startedAt.lte = new Date(options.endDate);
      }
    }

    const sessions = await this.prisma.studySession.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);
    const avgFocusScore =
      sessions.filter((s) => s.focusScore).length > 0
        ? sessions.reduce((acc, s) => acc + (s.focusScore || 0), 0) /
          sessions.filter((s) => s.focusScore).length
        : 0;

    // Stats by session type
    const byType: Record<string, { count: number; totalMinutes: number }> = {};
    for (const session of sessions) {
      if (!byType[session.type]) {
        byType[session.type] = { count: 0, totalMinutes: 0 };
      }
      byType[session.type].count++;
      byType[session.type].totalMinutes += session.actualMinutes || 0;
    }

    // Stats by subject
    const bySubject: Map<string, { name: string; count: number; totalMinutes: number }> = new Map();
    for (const session of sessions) {
      if (session.subject) {
        const current = bySubject.get(session.subjectId!) || {
          name: session.subject.name,
          count: 0,
          totalMinutes: 0,
        };
        current.count++;
        current.totalMinutes += session.actualMinutes || 0;
        bySubject.set(session.subjectId!, current);
      }
    }

    // Daily streak
    const sortedByDate = [...sessions].sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedByDate) {
      const sessionDate = new Date(session.startedAt);
      sessionDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 0 || daysDiff === 1) {
        if (daysDiff === 1) {
          currentDate = sessionDate;
        }
        streak++;
      } else {
        break;
      }
    }

    return {
      totalSessions,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      avgFocusScore: Math.round(avgFocusScore),
      currentStreak: streak,
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        ...data,
      })),
      bySubject: Array.from(bySubject.entries()).map(([id, data]) => ({
        subjectId: id,
        ...data,
      })),
    };
  }

  async getTodayStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getStats(userId, {
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    });
  }

  async getWeekStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.getStats(userId, {
      startDate: weekAgo.toISOString(),
      endDate: today.toISOString(),
    });
  }
}

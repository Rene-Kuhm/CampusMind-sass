import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateStudyEventDto,
  UpdateStudyEventDto,
  StudyEventType,
  RecurrenceType,
} from './dto/create-study-event.dto';

// Extender PrismaService para incluir el modelo studyEvent
// Esto será generado automáticamente cuando se corra prisma generate
type PrismaWithStudyEvent = PrismaService & {
  studyEvent: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
};

export interface StudyEvent {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  type: StudyEventType;
  subjectId?: string | null;
  resourceId?: string | null;
  color?: string | null;
  recurrence: RecurrenceType;
  reminderMinutes?: number | null;
  isAllDay: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly prisma: PrismaWithStudyEvent;

  constructor(prisma: PrismaService) {
    this.prisma = prisma as PrismaWithStudyEvent;
  }

  /**
   * Crear un nuevo evento de estudio
   */
  async create(userId: string, dto: CreateStudyEventDto): Promise<StudyEvent> {
    // Validar fechas
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }

    // Validar materia si se proporciona
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException('Materia no encontrada');
      }
    }

    // Validar recurso si se proporciona
    if (dto.resourceId) {
      const resource = await this.prisma.resource.findUnique({
        where: { id: dto.resourceId },
        include: { subject: true },
      });
      if (!resource || resource.subject.userId !== userId) {
        throw new NotFoundException('Recurso no encontrado');
      }
    }

    const event = await this.prisma.studyEvent.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        startTime,
        endTime,
        type: dto.type || StudyEventType.STUDY_SESSION,
        subjectId: dto.subjectId,
        resourceId: dto.resourceId,
        color: dto.color,
        recurrence: dto.recurrence || RecurrenceType.NONE,
        reminderMinutes: dto.reminderMinutes,
        isAllDay: dto.isAllDay || false,
        isCompleted: false,
      },
    });

    return event as StudyEvent;
  }

  /**
   * Obtener eventos por rango de fechas
   */
  async getByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      subjectId?: string;
      type?: StudyEventType;
      includeCompleted?: boolean;
    },
  ): Promise<StudyEvent[]> {
    const where: any = {
      userId,
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    };

    if (options?.subjectId) {
      where.subjectId = options.subjectId;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (!options?.includeCompleted) {
      where.isCompleted = false;
    }

    const events = await this.prisma.studyEvent.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        resource: {
          select: { id: true, title: true },
        },
      },
    });

    return events as StudyEvent[];
  }

  /**
   * Obtener eventos de hoy
   */
  async getTodayEvents(userId: string): Promise<StudyEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getByDateRange(userId, today, tomorrow);
  }

  /**
   * Obtener eventos de esta semana
   */
  async getWeekEvents(userId: string): Promise<StudyEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Inicio de la semana (lunes)
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));

    // Fin de la semana (domingo)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return this.getByDateRange(userId, weekStart, weekEnd);
  }

  /**
   * Obtener evento por ID
   */
  async getById(eventId: string, userId: string): Promise<StudyEvent> {
    const event = await this.prisma.studyEvent.findFirst({
      where: { id: eventId, userId },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        resource: {
          select: { id: true, title: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    return event as StudyEvent;
  }

  /**
   * Actualizar evento
   */
  async update(
    eventId: string,
    userId: string,
    dto: UpdateStudyEventDto,
  ): Promise<StudyEvent> {
    // Verificar que el evento existe
    await this.getById(eventId, userId);

    // Validar fechas si se proporcionan
    if (dto.startTime && dto.endTime) {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);
      if (endTime <= startTime) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
      }
    }

    const event = await this.prisma.studyEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.type && { type: dto.type }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.resourceId !== undefined && { resourceId: dto.resourceId }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.recurrence && { recurrence: dto.recurrence }),
        ...(dto.reminderMinutes !== undefined && { reminderMinutes: dto.reminderMinutes }),
        ...(dto.isAllDay !== undefined && { isAllDay: dto.isAllDay }),
        ...(dto.isCompleted !== undefined && { isCompleted: dto.isCompleted }),
      },
    });

    return event as StudyEvent;
  }

  /**
   * Marcar evento como completado
   */
  async markCompleted(eventId: string, userId: string): Promise<StudyEvent> {
    return this.update(eventId, userId, { isCompleted: true });
  }

  /**
   * Eliminar evento
   */
  async delete(eventId: string, userId: string): Promise<void> {
    await this.getById(eventId, userId);
    await this.prisma.studyEvent.delete({ where: { id: eventId } });
  }

  /**
   * Obtener próximos recordatorios
   */
  async getUpcomingReminders(
    userId: string,
    withinMinutes: number = 60,
  ): Promise<StudyEvent[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + withinMinutes * 60 * 1000);

    const events = await this.prisma.studyEvent.findMany({
      where: {
        userId,
        isCompleted: false,
        reminderMinutes: { not: null },
        startTime: {
          gte: now,
          lte: futureTime,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return events as StudyEvent[];
  }

  /**
   * Obtener estadísticas de estudio
   */
  async getStudyStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalEvents: number;
    completedEvents: number;
    totalStudyHours: number;
    byType: Record<StudyEventType, number>;
    bySubject: Array<{ subjectId: string; subjectName: string; hours: number }>;
  }> {
    const events = await this.prisma.studyEvent.findMany({
      where: {
        userId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      include: {
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    const completed = events.filter((e) => e.isCompleted);

    const byType: Record<string, number> = {};
    const bySubject: Map<string, { name: string; hours: number }> = new Map();

    let totalHours = 0;

    for (const event of events) {
      const hours =
        (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
      totalHours += hours;

      // Por tipo
      byType[event.type] = (byType[event.type] || 0) + hours;

      // Por materia
      if (event.subject) {
        const current = bySubject.get(event.subject.id) || {
          name: event.subject.name,
          hours: 0,
        };
        current.hours += hours;
        bySubject.set(event.subject.id, current);
      }
    }

    return {
      totalEvents: events.length,
      completedEvents: completed.length,
      totalStudyHours: Math.round(totalHours * 100) / 100,
      byType: byType as Record<StudyEventType, number>,
      bySubject: Array.from(bySubject.entries()).map(([id, data]) => ({
        subjectId: id,
        subjectName: data.name,
        hours: Math.round(data.hours * 100) / 100,
      })),
    };
  }

  /**
   * Generar sugerencias de estudio basadas en fechas de exámenes
   */
  async generateStudySuggestions(
    userId: string,
    examEventId: string,
  ): Promise<CreateStudyEventDto[]> {
    const examEvent = await this.getById(examEventId, userId);

    if (examEvent.type !== StudyEventType.EXAM) {
      throw new BadRequestException('El evento debe ser un examen');
    }

    const suggestions: CreateStudyEventDto[] = [];
    const examDate = new Date(examEvent.startTime);
    const daysUntilExam = Math.ceil(
      (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExam <= 0) {
      return suggestions;
    }

    // Generar sesiones de estudio progresivas
    // Más intensas cerca del examen
    const sessionsPerDay = daysUntilExam <= 3 ? 2 : 1;
    const sessionDuration = daysUntilExam <= 7 ? 120 : 90; // minutos

    for (let day = 1; day <= Math.min(daysUntilExam, 14); day++) {
      for (let session = 0; session < sessionsPerDay; session++) {
        const startHour = session === 0 ? 10 : 16; // 10am o 4pm
        const sessionDate = new Date(examDate);
        sessionDate.setDate(sessionDate.getDate() - day);
        sessionDate.setHours(startHour, 0, 0, 0);

        const endDate = new Date(sessionDate);
        endDate.setMinutes(endDate.getMinutes() + sessionDuration);

        suggestions.push({
          title: `Preparación: ${examEvent.title}`,
          description: `Sesión de estudio ${day <= 3 ? 'intensiva' : 'regular'} para ${examEvent.title}`,
          startTime: sessionDate.toISOString(),
          endTime: endDate.toISOString(),
          type: day <= 3 ? StudyEventType.REVIEW : StudyEventType.STUDY_SESSION,
          subjectId: examEvent.subjectId || undefined,
          color: examEvent.color || undefined,
          reminderMinutes: 15,
        });
      }
    }

    return suggestions;
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  CreateClassScheduleDto,
  CreateProfessorDto,
  ClassType,
} from "./dto/create-schedule.dto";

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CLASS SCHEDULES
  // ============================================

  async createSchedule(
    subjectId: string,
    userId: string,
    dto: CreateClassScheduleDto,
  ) {
    // Verify subject ownership
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.classSchedule.create({
      data: {
        subjectId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        classroom: dto.classroom,
        building: dto.building,
        type: dto.type || ClassType.THEORY,
        professorId: dto.professorId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        professor: true,
      },
    });
  }

  async findSchedulesBySubject(subjectId: string, userId: string) {
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.classSchedule.findMany({
      where: { subjectId },
      include: {
        professor: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async findAllSchedules(userId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: { userId, isArchived: false },
      select: { id: true },
    });

    const subjectIds = subjects.map((s) => s.id);

    return this.prisma.classSchedule.findMany({
      where: { subjectId: { in: subjectIds } },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        professor: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async getWeeklySchedule(userId: string) {
    const schedules = await this.findAllSchedules(userId);

    // Group by day of week
    const weeklySchedule: Record<number, typeof schedules> = {
      0: [], // Domingo
      1: [], // Lunes
      2: [], // Martes
      3: [], // Miércoles
      4: [], // Jueves
      5: [], // Viernes
      6: [], // Sábado
    };

    for (const schedule of schedules) {
      weeklySchedule[schedule.dayOfWeek].push(schedule);
    }

    const dayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    return Object.entries(weeklySchedule).map(([day, classes]) => ({
      dayOfWeek: Number(day),
      dayName: dayNames[Number(day)],
      classes: classes.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  }

  async getTodaySchedule(userId: string) {
    const today = new Date().getDay(); // 0 = Domingo
    const schedules = await this.findAllSchedules(userId);

    return schedules.filter((s) => s.dayOfWeek === today);
  }

  async updateSchedule(
    id: string,
    userId: string,
    dto: Partial<CreateClassScheduleDto>,
  ) {
    const schedule = await this.prisma.classSchedule.findFirst({
      where: { id },
      include: { subject: true },
    });

    if (!schedule) {
      throw new NotFoundException("Horario no encontrado");
    }

    await this.verifySubjectOwnership(schedule.subjectId, userId);

    return this.prisma.classSchedule.update({
      where: { id },
      data: {
        ...dto,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        professor: true,
      },
    });
  }

  async deleteSchedule(id: string, userId: string) {
    const schedule = await this.prisma.classSchedule.findFirst({
      where: { id },
      include: { subject: true },
    });

    if (!schedule) {
      throw new NotFoundException("Horario no encontrado");
    }

    await this.verifySubjectOwnership(schedule.subjectId, userId);

    return this.prisma.classSchedule.delete({
      where: { id },
    });
  }

  // ============================================
  // PROFESSORS
  // ============================================

  async createProfessor(userId: string, dto: CreateProfessorDto) {
    return this.prisma.professor.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email,
        office: dto.office,
        officeHours: dto.officeHours,
      },
    });
  }

  async findAllProfessors(userId: string) {
    return this.prisma.professor.findMany({
      where: { userId },
      include: {
        classes: {
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async updateProfessor(
    id: string,
    userId: string,
    dto: Partial<CreateProfessorDto>,
  ) {
    const professor = await this.prisma.professor.findFirst({
      where: { id, userId },
    });

    if (!professor) {
      throw new NotFoundException("Profesor no encontrado");
    }

    return this.prisma.professor.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProfessor(id: string, userId: string) {
    const professor = await this.prisma.professor.findFirst({
      where: { id, userId },
    });

    if (!professor) {
      throw new NotFoundException("Profesor no encontrado");
    }

    return this.prisma.professor.delete({
      where: { id },
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private async verifySubjectOwnership(subjectId: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundException("Materia no encontrada");
    }

    return subject;
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateTutorProfileDto,
  UpdateTutorProfileDto,
  BookSessionDto,
  UpdateSessionDto,
  CreateReviewDto,
  TutorQueryDto,
} from './dto';

@Injectable()
export class TutoringService {
  constructor(private prisma: PrismaService) {}

  // Tutor Profiles
  async createTutorProfile(userId: string, dto: CreateTutorProfileDto) {
    const existing = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Tutor profile already exists');
    }

    return this.prisma.tutorProfile.create({
      data: {
        userId,
        bio: dto.bio,
        expertise: dto.expertise,
        university: dto.university,
        career: dto.career,
        year: dto.year,
        hourlyRate: dto.hourlyRate,
        currency: dto.currency || 'ARS',
        isFree: dto.isFree ?? false,
        availability: dto.availability,
      },
      include: {
        user: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async updateTutorProfile(userId: string, dto: UpdateTutorProfileDto) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return this.prisma.tutorProfile.update({
      where: { userId },
      data: {
        bio: dto.bio,
        expertise: dto.expertise,
        hourlyRate: dto.hourlyRate,
        isFree: dto.isFree,
        isActive: dto.isActive,
        availability: dto.availability,
      },
    });
  }

  async getMyTutorProfile(userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        sessions: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
          include: {
            student: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        _count: { select: { sessions: true, reviews: true } },
      },
    });

    if (!profile) {
      return null;
    }

    return profile;
  }

  async searchTutors(query: TutorQueryDto, page = 1, limit = 20) {
    const where: any = {
      isActive: true,
    };

    if (query.subject) {
      where.expertise = { has: query.subject };
    }

    if (query.university) {
      where.university = query.university;
    }

    if (query.freeOnly) {
      where.isFree = true;
    }

    if (query.maxRate) {
      where.OR = [
        { isFree: true },
        { hourlyRate: { lte: query.maxRate } },
      ];
    }

    let orderBy: any = { rating: 'desc' };
    if (query.sortBy === 'sessions') {
      orderBy = { totalSessions: 'desc' };
    } else if (query.sortBy === 'rate') {
      orderBy = { hourlyRate: 'asc' };
    }

    const tutors = await this.prisma.tutorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
            userXP: { select: { level: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.tutorProfile.count({ where });

    return {
      tutors: tutors.map((t) => ({
        id: t.id,
        userId: t.userId,
        name: t.user.profile
          ? `${t.user.profile.firstName} ${t.user.profile.lastName}`
          : 'Tutor',
        level: t.user.userXP?.level || 1,
        bio: t.bio,
        expertise: t.expertise,
        university: t.university,
        career: t.career,
        hourlyRate: t.hourlyRate,
        currency: t.currency,
        isFree: t.isFree,
        rating: t.rating,
        totalSessions: t.totalSessions,
        reviewCount: t._count.reviews,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTutorProfile(tutorId: string) {
    const profile = await this.prisma.tutorProfile.findFirst({
      where: { id: tutorId },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, university: true } },
            userXP: { select: { level: true, totalXP: true } },
          },
        },
        reviews: {
          where: { isAnonymous: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            student: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        _count: { select: { sessions: true, reviews: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Tutor not found');
    }

    return profile;
  }

  // Sessions
  async bookSession(userId: string, dto: BookSessionDto) {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: dto.tutorId, isActive: true },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    if (tutor.userId === userId) {
      throw new BadRequestException('Cannot book session with yourself');
    }

    // Check for conflicts
    const scheduledAt = new Date(dto.scheduledAt);
    const endTime = new Date(scheduledAt.getTime() + dto.duration * 60000);

    const conflict = await this.prisma.tutoringSession.findFirst({
      where: {
        tutorId: dto.tutorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: {
          lt: endTime,
        },
        AND: {
          scheduledAt: {
            gte: new Date(scheduledAt.getTime() - dto.duration * 60000),
          },
        },
      },
    });

    if (conflict) {
      throw new BadRequestException('Tutor is not available at this time');
    }

    return this.prisma.tutoringSession.create({
      data: {
        tutorId: dto.tutorId,
        studentId: userId,
        subject: dto.subject,
        topic: dto.topic,
        description: dto.description,
        scheduledAt,
        duration: dto.duration,
        isOnline: dto.isOnline ?? true,
        location: dto.location,
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
  }

  async getMySessionsAsStudent(userId: string) {
    return this.prisma.tutoringSession.findMany({
      where: { studentId: userId },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getMySessionsAsTutor(userId: string) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      return [];
    }

    return this.prisma.tutoringSession.findMany({
      where: { tutorId: tutorProfile.id },
      include: {
        student: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateSessionStatus(
    userId: string,
    sessionId: string,
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
    reason?: string,
  ) {
    const session = await this.prisma.tutoringSession.findFirst({
      where: { id: sessionId },
      include: { tutor: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const isTutor = session.tutor.userId === userId;
    const isStudent = session.studentId === userId;

    if (!isTutor && !isStudent) {
      throw new ForbiddenException('Access denied');
    }

    // Only tutor can confirm
    if (status === 'CONFIRMED' && !isTutor) {
      throw new ForbiddenException('Only tutor can confirm sessions');
    }

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();

      // Update tutor stats
      await this.prisma.tutorProfile.update({
        where: { id: session.tutorId },
        data: {
          totalSessions: { increment: 1 },
          totalHours: { increment: session.duration / 60 },
        },
      });
    }

    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = reason;
    }

    return this.prisma.tutoringSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  }

  async updateSession(userId: string, sessionId: string, dto: UpdateSessionDto) {
    const session = await this.prisma.tutoringSession.findFirst({
      where: { id: sessionId },
      include: { tutor: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const isTutor = session.tutor.userId === userId;
    const isStudent = session.studentId === userId;

    if (!isTutor && !isStudent) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.tutoringSession.update({
      where: { id: sessionId },
      data: {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        duration: dto.duration,
        meetingUrl: dto.meetingUrl,
        tutorNotes: isTutor ? dto.tutorNotes : undefined,
        studentNotes: isStudent ? dto.studentNotes : undefined,
      },
    });
  }

  // Reviews
  async createReview(userId: string, tutorId: string, dto: CreateReviewDto) {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    // Check if user had a completed session with this tutor
    const completedSession = await this.prisma.tutoringSession.findFirst({
      where: {
        tutorId,
        studentId: userId,
        status: 'COMPLETED',
      },
    });

    if (!completedSession) {
      throw new BadRequestException('You can only review tutors after completing a session');
    }

    // Check for existing review
    const existingReview = await this.prisma.tutorReview.findFirst({
      where: { tutorId, studentId: userId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this tutor');
    }

    const review = await this.prisma.tutorReview.create({
      data: {
        tutorId,
        studentId: userId,
        rating: dto.rating,
        comment: dto.comment,
        isAnonymous: dto.isAnonymous ?? false,
      },
    });

    // Update tutor rating
    const reviews = await this.prisma.tutorReview.findMany({
      where: { tutorId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.tutorProfile.update({
      where: { id: tutorId },
      data: { rating: avgRating },
    });

    return review;
  }

  // Get available subjects
  async getAvailableSubjects() {
    const tutors = await this.prisma.tutorProfile.findMany({
      where: { isActive: true },
      select: { expertise: true },
    });

    const subjects = new Set<string>();
    tutors.forEach((t) => t.expertise.forEach((s) => subjects.add(s)));

    return Array.from(subjects).sort();
  }
}

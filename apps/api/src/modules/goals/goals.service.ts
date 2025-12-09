import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateGoalDto,
  UpdateGoalDto,
  AddProgressDto,
  GoalQueryDto,
  GoalStatus,
  GoalType,
} from './dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    // Validate subject if provided
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.studyGoal.create({
      data: {
        userId,
        subjectId: dto.subjectId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        targetValue: dto.targetValue,
        unit: dto.unit,
        periodType: dto.periodType || 'WEEKLY',
        startDate,
        endDate,
        reminderEnabled: dto.reminderEnabled ?? true,
        reminderTime: dto.reminderTime,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        progress: { orderBy: { date: 'desc' }, take: 5 },
      },
    });
  }

  async findAll(userId: string, query: GoalQueryDto) {
    const where: any = { userId };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.periodType) where.periodType = query.periodType;

    const goals = await this.prisma.studyGoal.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, color: true } },
        progress: { orderBy: { date: 'desc' }, take: 10 },
      },
      orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
    });

    return goals.map((goal) => ({
      ...goal,
      progressPercentage: Math.min(100, (goal.currentValue / goal.targetValue) * 100),
      daysRemaining: Math.max(0, Math.ceil((goal.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    }));
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.studyGoal.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        progress: { orderBy: { date: 'desc' } },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return {
      ...goal,
      progressPercentage: Math.min(100, (goal.currentValue / goal.targetValue) * 100),
      daysRemaining: Math.max(0, Math.ceil((goal.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    };
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.studyGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Auto-complete if currentValue reaches targetValue
    let status = dto.status;
    if (dto.currentValue !== undefined && dto.currentValue >= goal.targetValue) {
      status = GoalStatus.COMPLETED;
    }

    return this.prisma.studyGoal.update({
      where: { id },
      data: {
        ...dto,
        status,
        completedAt: status === GoalStatus.COMPLETED ? new Date() : undefined,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        progress: { orderBy: { date: 'desc' }, take: 5 },
      },
    });
  }

  async addProgress(userId: string, id: string, dto: AddProgressDto) {
    const goal = await this.prisma.studyGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot add progress to a non-active goal');
    }

    // Create progress record
    await this.prisma.goalProgress.create({
      data: {
        goalId: id,
        value: dto.value,
        notes: dto.notes,
      },
    });

    // Update goal current value
    const newValue = goal.currentValue + dto.value;
    const isCompleted = newValue >= goal.targetValue;

    const updatedGoal = await this.prisma.studyGoal.update({
      where: { id },
      data: {
        currentValue: newValue,
        status: isCompleted ? 'COMPLETED' : 'ACTIVE',
        completedAt: isCompleted ? new Date() : null,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        progress: { orderBy: { date: 'desc' }, take: 10 },
      },
    });

    return {
      ...updatedGoal,
      progressPercentage: Math.min(100, (updatedGoal.currentValue / updatedGoal.targetValue) * 100),
      isCompleted,
    };
  }

  async delete(userId: string, id: string) {
    const goal = await this.prisma.studyGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    await this.prisma.studyGoal.delete({ where: { id } });
    return { success: true };
  }

  async getActiveGoals(userId: string) {
    const goals = await this.prisma.studyGoal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    return goals.map((goal) => ({
      ...goal,
      progressPercentage: Math.min(100, (goal.currentValue / goal.targetValue) * 100),
      daysRemaining: Math.ceil((goal.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getSuggestedGoals(userId: string) {
    // Get user's study patterns
    const [studySessions, flashcardReviews, quizAttempts] = await Promise.all([
      this.prisma.studySession.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.prisma.flashcardReview.count({
        where: { flashcard: { deck: { userId } } },
      }),
      this.prisma.quizAttempt.count({
        where: { quiz: { userId } },
      }),
    ]);

    const suggestions = [];

    // Suggest based on activity
    if (studySessions < 10) {
      suggestions.push({
        type: GoalType.POMODOROS,
        title: 'Complete 5 study sessions this week',
        targetValue: 5,
        unit: 'COUNT',
        reason: 'Build a consistent study habit',
      });
    }

    if (flashcardReviews < 50) {
      suggestions.push({
        type: GoalType.FLASHCARDS_REVIEW,
        title: 'Review 20 flashcards daily',
        targetValue: 20,
        unit: 'COUNT',
        reason: 'Improve retention with spaced repetition',
      });
    }

    suggestions.push({
      type: GoalType.STUDY_HOURS,
      title: 'Study 10 hours this week',
      targetValue: 10,
      unit: 'HOURS',
      reason: 'Maintain steady progress',
    });

    return suggestions;
  }

  // Auto-update goals based on activities
  async trackActivity(userId: string, type: GoalType, value: number) {
    // Find active goals matching the activity type
    const activeGoals = await this.prisma.studyGoal.findMany({
      where: {
        userId,
        type,
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    for (const goal of activeGoals) {
      await this.addProgress(userId, goal.id, { value });
    }
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateWellnessLogDto,
  UpdateWellnessLogDto,
  UpdateBreakReminderDto,
  WellnessQueryDto,
  WellnessStatsQueryDto,
} from './dto';
import { WellnessCategory, WellnessTrigger } from '@prisma/client';

@Injectable()
export class WellnessService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // WELLNESS LOGS CRUD
  // ============================================

  async createLog(userId: string, dto: CreateWellnessLogDto) {
    const logDate = dto.date ? new Date(dto.date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    // Check if log already exists for this date
    const existingLog = await this.prisma.wellnessLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    if (existingLog) {
      throw new ConflictException(
        'A wellness log already exists for this date. Use PATCH to update it.',
      );
    }

    return this.prisma.wellnessLog.create({
      data: {
        userId,
        date: logDate,
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        moodScore: dto.moodScore,
        stressLevel: dto.stressLevel,
        energyLevel: dto.energyLevel,
        exerciseMinutes: dto.exerciseMinutes,
        meditationMinutes: dto.meditationMinutes,
        breaksCount: dto.breaksCount,
        notes: dto.notes,
        gratitude: dto.gratitude || [],
      },
    });
  }

  async findAllLogs(userId: string, query: WellnessQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.days) {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - query.days);
      startDate.setHours(0, 0, 0, 0);
    } else {
      if (query.startDate) {
        startDate = new Date(query.startDate);
        startDate.setHours(0, 0, 0, 0);
      }
      if (query.endDate) {
        endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.wellnessLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wellnessLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findLogById(userId: string, id: string) {
    const log = await this.prisma.wellnessLog.findFirst({
      where: { id, userId },
    });

    if (!log) {
      throw new NotFoundException('Wellness log not found');
    }

    return log;
  }

  async findLogByDate(userId: string, date: string) {
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const log = await this.prisma.wellnessLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    if (!log) {
      throw new NotFoundException('No wellness log found for this date');
    }

    return log;
  }

  async updateLog(userId: string, id: string, dto: UpdateWellnessLogDto) {
    const log = await this.findLogById(userId, id);

    return this.prisma.wellnessLog.update({
      where: { id: log.id },
      data: {
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        moodScore: dto.moodScore,
        stressLevel: dto.stressLevel,
        energyLevel: dto.energyLevel,
        exerciseMinutes: dto.exerciseMinutes,
        meditationMinutes: dto.meditationMinutes,
        breaksCount: dto.breaksCount,
        notes: dto.notes,
        gratitude: dto.gratitude,
      },
    });
  }

  async deleteLog(userId: string, id: string) {
    const log = await this.findLogById(userId, id);

    await this.prisma.wellnessLog.delete({
      where: { id: log.id },
    });

    return { message: 'Wellness log deleted successfully' };
  }

  // ============================================
  // BREAK REMINDERS
  // ============================================

  async getBreakReminder(userId: string) {
    let reminder = await this.prisma.breakReminder.findUnique({
      where: { userId },
    });

    // Create default if doesn't exist
    if (!reminder) {
      reminder = await this.prisma.breakReminder.create({
        data: {
          userId,
          isEnabled: true,
          intervalMinutes: 52,
          breakMinutes: 17,
          startTime: '08:00',
          endTime: '22:00',
          activeDays: [1, 2, 3, 4, 5],
          soundEnabled: true,
          notificationEnabled: true,
        },
      });
    }

    return reminder;
  }

  async updateBreakReminder(userId: string, dto: UpdateBreakReminderDto) {
    // Ensure reminder exists
    await this.getBreakReminder(userId);

    return this.prisma.breakReminder.update({
      where: { userId },
      data: {
        isEnabled: dto.isEnabled,
        intervalMinutes: dto.intervalMinutes,
        breakMinutes: dto.breakMinutes,
        startTime: dto.startTime,
        endTime: dto.endTime,
        activeDays: dto.activeDays,
        soundEnabled: dto.soundEnabled,
        notificationEnabled: dto.notificationEnabled,
      },
    });
  }

  // ============================================
  // WELLNESS TIPS
  // ============================================

  async getTips(userId: string) {
    // Get user's recent wellness data to determine relevant tips
    const recentLog = await this.prisma.wellnessLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const triggers: WellnessTrigger[] = [WellnessTrigger.RANDOM, WellnessTrigger.DAILY];

    // Add relevant triggers based on user data
    if (recentLog) {
      if (recentLog.stressLevel && recentLog.stressLevel >= 4) {
        triggers.push(WellnessTrigger.HIGH_STRESS);
      }
      if (recentLog.sleepHours && recentLog.sleepHours < 6) {
        triggers.push(WellnessTrigger.LOW_SLEEP);
      }
    }

    // Check for long study sessions
    const recentSession = await this.prisma.studySession.findFirst({
      where: {
        userId,
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        actualMinutes: { gte: 120 },
      },
    });

    if (recentSession) {
      triggers.push(WellnessTrigger.LONG_SESSION);
    }

    // Get tips matching triggers
    const tips = await this.prisma.wellnessTip.findMany({
      where: {
        isActive: true,
        triggerType: { in: triggers },
      },
      take: 5,
    });

    // If not enough tips, fill with random ones
    if (tips.length < 3) {
      const moreTips = await this.prisma.wellnessTip.findMany({
        where: {
          isActive: true,
          id: { notIn: tips.map((t) => t.id) },
        },
        take: 5 - tips.length,
      });
      tips.push(...moreTips);
    }

    // Shuffle tips for variety
    return tips.sort(() => Math.random() - 0.5);
  }

  async getTipsByCategory(category: WellnessCategory) {
    return this.prisma.wellnessTip.findMany({
      where: {
        isActive: true,
        category,
      },
    });
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(userId: string, query: WellnessStatsQueryDto) {
    const days = query.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logs = await this.prisma.wellnessLog.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    if (logs.length === 0) {
      return {
        period: { days, startDate, endDate: new Date() },
        totalLogs: 0,
        averages: null,
        trends: null,
        totals: null,
        insights: [],
      };
    }

    // Calculate averages
    const validSleepHours = logs.filter((l) => l.sleepHours !== null);
    const validSleepQuality = logs.filter((l) => l.sleepQuality !== null);
    const validMoodScore = logs.filter((l) => l.moodScore !== null);
    const validStressLevel = logs.filter((l) => l.stressLevel !== null);
    const validEnergyLevel = logs.filter((l) => l.energyLevel !== null);

    const averages = {
      sleepHours:
        validSleepHours.length > 0
          ? validSleepHours.reduce((sum, l) => sum + (l.sleepHours || 0), 0) /
            validSleepHours.length
          : null,
      sleepQuality:
        validSleepQuality.length > 0
          ? validSleepQuality.reduce((sum, l) => sum + (l.sleepQuality || 0), 0) /
            validSleepQuality.length
          : null,
      moodScore:
        validMoodScore.length > 0
          ? validMoodScore.reduce((sum, l) => sum + (l.moodScore || 0), 0) /
            validMoodScore.length
          : null,
      stressLevel:
        validStressLevel.length > 0
          ? validStressLevel.reduce((sum, l) => sum + (l.stressLevel || 0), 0) /
            validStressLevel.length
          : null,
      energyLevel:
        validEnergyLevel.length > 0
          ? validEnergyLevel.reduce((sum, l) => sum + (l.energyLevel || 0), 0) /
            validEnergyLevel.length
          : null,
    };

    // Calculate totals
    const totals = {
      exerciseMinutes: logs.reduce((sum, l) => sum + (l.exerciseMinutes || 0), 0),
      meditationMinutes: logs.reduce((sum, l) => sum + (l.meditationMinutes || 0), 0),
      breaksCount: logs.reduce((sum, l) => sum + (l.breaksCount || 0), 0),
    };

    // Calculate trends (compare first half vs second half of period)
    const midPoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midPoint);
    const secondHalf = logs.slice(midPoint);

    const calculateAvg = (arr: typeof logs, field: keyof typeof logs[0]) => {
      const valid = arr.filter((l) => l[field] !== null);
      if (valid.length === 0) return null;
      return valid.reduce((sum, l) => sum + (Number(l[field]) || 0), 0) / valid.length;
    };

    const trends = {
      moodScore: {
        firstHalf: calculateAvg(firstHalf, 'moodScore'),
        secondHalf: calculateAvg(secondHalf, 'moodScore'),
        direction: this.getTrendDirection(
          calculateAvg(firstHalf, 'moodScore'),
          calculateAvg(secondHalf, 'moodScore'),
        ),
      },
      stressLevel: {
        firstHalf: calculateAvg(firstHalf, 'stressLevel'),
        secondHalf: calculateAvg(secondHalf, 'stressLevel'),
        direction: this.getTrendDirection(
          calculateAvg(firstHalf, 'stressLevel'),
          calculateAvg(secondHalf, 'stressLevel'),
          true, // Lower is better for stress
        ),
      },
      sleepHours: {
        firstHalf: calculateAvg(firstHalf, 'sleepHours'),
        secondHalf: calculateAvg(secondHalf, 'sleepHours'),
        direction: this.getTrendDirection(
          calculateAvg(firstHalf, 'sleepHours'),
          calculateAvg(secondHalf, 'sleepHours'),
        ),
      },
    };

    // Generate insights
    const insights = this.generateInsights(averages, trends, totals, days);

    // Daily breakdown for charts
    const dailyData = logs.map((log) => ({
      date: log.date,
      moodScore: log.moodScore,
      stressLevel: log.stressLevel,
      sleepHours: log.sleepHours,
      energyLevel: log.energyLevel,
    }));

    return {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      totalLogs: logs.length,
      completionRate: Math.round((logs.length / days) * 100),
      averages,
      trends,
      totals,
      insights,
      dailyData,
    };
  }

  private getTrendDirection(
    first: number | null,
    second: number | null,
    lowerIsBetter = false,
  ): 'improving' | 'declining' | 'stable' | 'insufficient_data' {
    if (first === null || second === null) return 'insufficient_data';

    const diff = second - first;
    const threshold = 0.2; // 0.2 point difference considered significant

    if (Math.abs(diff) < threshold) return 'stable';
    if (lowerIsBetter) {
      return diff < 0 ? 'improving' : 'declining';
    }
    return diff > 0 ? 'improving' : 'declining';
  }

  private generateInsights(
    averages: Record<string, number | null>,
    trends: Record<string, any>,
    totals: Record<string, number>,
    days: number,
  ): string[] {
    const insights: string[] = [];

    // Sleep insights
    if (averages.sleepHours !== null) {
      if (averages.sleepHours < 6) {
        insights.push(
          'Your average sleep is below recommended levels. Consider establishing a consistent bedtime routine.',
        );
      } else if (averages.sleepHours >= 7 && averages.sleepHours <= 9) {
        insights.push(
          'Great job maintaining healthy sleep hours! Keep up the good sleep hygiene.',
        );
      }
    }

    // Stress insights
    if (averages.stressLevel !== null) {
      if (averages.stressLevel >= 4) {
        insights.push(
          'Your stress levels have been elevated. Consider incorporating more breaks and relaxation techniques.',
        );
      }
      if (trends.stressLevel?.direction === 'improving') {
        insights.push(
          'Your stress levels are trending down - your wellness habits are paying off!',
        );
      }
    }

    // Exercise insights
    const avgDailyExercise = totals.exerciseMinutes / days;
    if (avgDailyExercise >= 30) {
      insights.push(
        `Excellent! You're averaging ${Math.round(avgDailyExercise)} minutes of exercise daily.`,
      );
    } else if (avgDailyExercise < 15) {
      insights.push(
        'Try to incorporate more physical activity. Even a short walk can boost your mood and focus.',
      );
    }

    // Meditation insights
    if (totals.meditationMinutes > 0) {
      const avgDailyMeditation = totals.meditationMinutes / days;
      if (avgDailyMeditation >= 10) {
        insights.push(
          'Your regular meditation practice is helping with stress management.',
        );
      }
    }

    // Mood trends
    if (trends.moodScore?.direction === 'improving') {
      insights.push('Your mood has been improving - keep doing what works for you!');
    } else if (trends.moodScore?.direction === 'declining') {
      insights.push(
        'Your mood has been trending down. Consider reaching out to friends or taking some self-care time.',
      );
    }

    return insights.slice(0, 5); // Limit to 5 insights
  }

  // ============================================
  // STREAK
  // ============================================

  async getStreak(userId: string) {
    const logs = await this.prisma.wellnessLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (logs.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastLogDate: null,
        totalLogs: 0,
      };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const firstLogDate = new Date(logs[0].date);
    firstLogDate.setHours(0, 0, 0, 0);

    // Check if the most recent log is today or yesterday
    if (firstLogDate.getTime() === today.getTime() || firstLogDate.getTime() === yesterday.getTime()) {
      currentStreak = 1;
      let expectedDate = new Date(firstLogDate);
      expectedDate.setDate(expectedDate.getDate() - 1);

      for (let i = 1; i < logs.length; i++) {
        const logDate = new Date(logs[i].date);
        logDate.setHours(0, 0, 0, 0);

        if (logDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    const sortedDates = logs.map((l) => {
      const d = new Date(l.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }).sort((a, b) => a - b);

    for (let i = 1; i < sortedDates.length; i++) {
      const diffDays = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastLogDate: logs[0].date,
      totalLogs: logs.length,
      isLoggedToday: firstLogDate.getTime() === today.getTime(),
    };
  }

  // ============================================
  // TODAY'S LOG (HELPER)
  // ============================================

  async getTodayLog(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.wellnessLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
  }

  async logOrUpdateToday(userId: string, dto: CreateWellnessLogDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await this.prisma.wellnessLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (existingLog) {
      return this.prisma.wellnessLog.update({
        where: { id: existingLog.id },
        data: {
          sleepHours: dto.sleepHours ?? existingLog.sleepHours,
          sleepQuality: dto.sleepQuality ?? existingLog.sleepQuality,
          moodScore: dto.moodScore ?? existingLog.moodScore,
          stressLevel: dto.stressLevel ?? existingLog.stressLevel,
          energyLevel: dto.energyLevel ?? existingLog.energyLevel,
          exerciseMinutes: dto.exerciseMinutes ?? existingLog.exerciseMinutes,
          meditationMinutes: dto.meditationMinutes ?? existingLog.meditationMinutes,
          breaksCount: dto.breaksCount ?? existingLog.breaksCount,
          notes: dto.notes ?? existingLog.notes,
          gratitude: dto.gratitude ?? existingLog.gratitude,
        },
      });
    }

    return this.prisma.wellnessLog.create({
      data: {
        userId,
        date: today,
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        moodScore: dto.moodScore,
        stressLevel: dto.stressLevel,
        energyLevel: dto.energyLevel,
        exerciseMinutes: dto.exerciseMinutes,
        meditationMinutes: dto.meditationMinutes,
        breaksCount: dto.breaksCount,
        notes: dto.notes,
        gratitude: dto.gratitude || [],
      },
    });
  }
}

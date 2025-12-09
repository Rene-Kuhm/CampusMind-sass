import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface DateRange {
  start: Date;
  end: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      todayStats,
      weekStats,
      streakData,
      upcomingTasks,
      dueFlashcards,
    ] = await Promise.all([
      this.getTodayStats(userId, today),
      this.getWeekStats(userId, weekAgo, today),
      this.getStreakData(userId),
      this.getUpcomingDeadlines(userId),
      this.getDueFlashcardsCount(userId),
    ]);

    return {
      today: todayStats,
      week: weekStats,
      streak: streakData,
      upcoming: upcomingTasks,
      dueFlashcards,
    };
  }

  private async getTodayStats(userId: string, today: Date) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [studySessions, flashcardReviews, tasksCompleted, quizzesTaken] =
      await Promise.all([
        this.prisma.studySession.aggregate({
          where: {
            userId,
            startedAt: { gte: today, lt: tomorrow },
            status: 'COMPLETED',
          },
          _sum: { actualMinutes: true },
          _count: true,
        }),
        this.prisma.flashcardReview.count({
          where: {
            flashcard: { deck: { userId } },
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        this.prisma.task.count({
          where: {
            userId,
            completedAt: { gte: today, lt: tomorrow },
          },
        }),
        this.prisma.quizAttempt.count({
          where: {
            quiz: { userId },
            completedAt: { gte: today, lt: tomorrow },
          },
        }),
      ]);

    return {
      studyMinutes: studySessions._sum.actualMinutes || 0,
      pomodorosCompleted: studySessions._count,
      flashcardsReviewed: flashcardReviews,
      tasksCompleted,
      quizzesTaken,
    };
  }

  private async getWeekStats(userId: string, weekAgo: Date, today: Date) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [studySessions, flashcardReviews, quizAttempts, tasksCompleted] =
      await Promise.all([
        this.prisma.studySession.aggregate({
          where: {
            userId,
            startedAt: { gte: weekAgo, lt: tomorrow },
            status: 'COMPLETED',
          },
          _sum: { actualMinutes: true },
          _count: true,
        }),
        this.prisma.flashcardReview.findMany({
          where: {
            flashcard: { deck: { userId } },
            createdAt: { gte: weekAgo, lt: tomorrow },
          },
          select: { quality: true },
        }),
        this.prisma.quizAttempt.aggregate({
          where: {
            quiz: { userId },
            completedAt: { gte: weekAgo, lt: tomorrow },
          },
          _avg: { percentage: true },
          _count: true,
        }),
        this.prisma.task.count({
          where: {
            userId,
            completedAt: { gte: weekAgo, lt: tomorrow },
          },
        }),
      ]);

    const correctFlashcards = flashcardReviews.filter((r) => r.quality >= 3).length;

    return {
      totalStudyMinutes: studySessions._sum.actualMinutes || 0,
      totalStudyHours: Math.round((studySessions._sum.actualMinutes || 0) / 60 * 10) / 10,
      pomodorosCompleted: studySessions._count,
      flashcardsReviewed: flashcardReviews.length,
      flashcardAccuracy: flashcardReviews.length > 0
        ? Math.round((correctFlashcards / flashcardReviews.length) * 100)
        : 0,
      quizzesTaken: quizAttempts._count,
      quizAvgScore: quizAttempts._avg.percentage
        ? Math.round(quizAttempts._avg.percentage)
        : 0,
      tasksCompleted,
    };
  }

  private async getStreakData(userId: string) {
    // Get or create user analytics record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user studied today
    const todaySession = await this.prisma.studySession.findFirst({
      where: {
        userId,
        startedAt: { gte: today },
        status: 'COMPLETED',
      },
    });

    // Get historical data for streak calculation
    const recentAnalytics = await this.prisma.userAnalytics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 365,
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streak
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayData = recentAnalytics.find(
        (a) => a.date.toISOString().split('T')[0] === dateStr
      );

      if (dayData && dayData.totalStudyMinutes > 0) {
        tempStreak++;
        if (i === 0 || currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else if (i === 0 && todaySession) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (i === 0) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    return {
      current: currentStreak,
      longest: Math.max(longestStreak, currentStreak),
      studiedToday: !!todaySession,
    };
  }

  private async getUpcomingDeadlines(userId: string) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [tasks, events] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lte: nextWeek },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: {
          subject: { select: { name: true, color: true } },
        },
      }),
      this.prisma.studyEvent.findMany({
        where: {
          userId,
          type: { in: ['EXAM', 'DEADLINE'] },
          startTime: { gte: new Date(), lte: nextWeek },
          isCompleted: false,
        },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
    ]);

    return { tasks, events };
  }

  private async getDueFlashcardsCount(userId: string) {
    return this.prisma.flashcard.count({
      where: {
        deck: { userId },
        nextReviewDate: { lte: new Date() },
      },
    });
  }

  async getStudyTimeChart(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: startDate },
        status: 'COMPLETED',
      },
      select: {
        startedAt: true,
        actualMinutes: true,
      },
    });

    // Group by date
    const chartData: { date: string; minutes: number }[] = [];
    const dataMap = new Map<string, number>();

    sessions.forEach((session) => {
      const dateKey = session.startedAt.toISOString().split('T')[0];
      const current = dataMap.get(dateKey) || 0;
      dataMap.set(dateKey, current + (session.actualMinutes || 0));
    });

    // Fill in all dates
    const currentDate = new Date(startDate);
    const today = new Date();
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      chartData.push({
        date: dateKey,
        minutes: dataMap.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return chartData;
  }

  async getSubjectDistribution(userId: string) {
    const sessions = await this.prisma.studySession.groupBy({
      by: ['subjectId'],
      where: {
        userId,
        status: 'COMPLETED',
        subjectId: { not: null },
      },
      _sum: { actualMinutes: true },
    });

    const subjectIds = sessions
      .map((s) => s.subjectId)
      .filter((id): id is string => id !== null);

    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true, color: true },
    });

    return sessions.map((session) => {
      const subject = subjects.find((s) => s.id === session.subjectId);
      return {
        subjectId: session.subjectId,
        subjectName: subject?.name || 'Unknown',
        color: subject?.color || '#6366f1',
        totalMinutes: session._sum.actualMinutes || 0,
      };
    });
  }

  async getFlashcardStats(userId: string) {
    const [totalCards, dueCards, reviewsToday, recentReviews] = await Promise.all([
      this.prisma.flashcard.count({
        where: { deck: { userId } },
      }),
      this.prisma.flashcard.count({
        where: {
          deck: { userId },
          nextReviewDate: { lte: new Date() },
        },
      }),
      this.prisma.flashcardReview.count({
        where: {
          flashcard: { deck: { userId } },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.flashcardReview.findMany({
        where: { flashcard: { deck: { userId } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { quality: true },
      }),
    ]);

    const correctReviews = recentReviews.filter((r) => r.quality >= 3).length;
    const accuracy = recentReviews.length > 0
      ? Math.round((correctReviews / recentReviews.length) * 100)
      : 0;

    return {
      totalCards,
      dueCards,
      reviewedToday: reviewsToday,
      recentAccuracy: accuracy,
    };
  }

  async getQuizStats(userId: string) {
    const [totalQuizzes, attempts, recentAttempts] = await Promise.all([
      this.prisma.quiz.count({ where: { userId } }),
      this.prisma.quizAttempt.aggregate({
        where: { quiz: { userId } },
        _count: true,
        _avg: { percentage: true },
      }),
      this.prisma.quizAttempt.findMany({
        where: { quiz: { userId } },
        orderBy: { completedAt: 'desc' },
        take: 10,
        include: {
          quiz: { select: { title: true } },
        },
      }),
    ]);

    return {
      totalQuizzes,
      totalAttempts: attempts._count,
      averageScore: attempts._avg.percentage
        ? Math.round(attempts._avg.percentage)
        : 0,
      recentAttempts: recentAttempts.map((a) => ({
        quizTitle: a.quiz.title,
        score: a.percentage,
        passed: a.passed,
        date: a.completedAt,
      })),
    };
  }

  async getProgressPrediction(userId: string, subjectId?: string) {
    // Get historical grades
    const grades = await this.prisma.grade.findMany({
      where: {
        subject: { userId },
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { date: 'asc' },
    });

    if (grades.length < 2) {
      return { prediction: null, trend: 'insufficient_data' };
    }

    // Simple linear regression for prediction
    const scores = grades.map((g) => (g.score / g.maxScore) * 100);
    const n = scores.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + i * score, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextPrediction = Math.min(100, Math.max(0, slope * n + intercept));
    const trend = slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'stable';

    return {
      prediction: Math.round(nextPrediction),
      trend,
      currentAverage: Math.round(sumY / n),
      grades: grades.map((g) => ({
        name: g.name,
        score: (g.score / g.maxScore) * 100,
        date: g.date,
      })),
    };
  }

  // Record daily analytics
  async recordDailyAnalytics(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.getTodayStats(userId, today);
    const streakData = await this.getStreakData(userId);

    await this.prisma.userAnalytics.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      update: {
        totalStudyMinutes: stats.studyMinutes,
        pomodorosCompleted: stats.pomodorosCompleted,
        flashcardsReviewed: stats.flashcardsReviewed,
        tasksCompleted: stats.tasksCompleted,
        quizzesCompleted: stats.quizzesTaken,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
      },
      create: {
        userId,
        date: today,
        totalStudyMinutes: stats.studyMinutes,
        pomodorosCompleted: stats.pomodorosCompleted,
        flashcardsReviewed: stats.flashcardsReviewed,
        tasksCompleted: stats.tasksCompleted,
        quizzesCompleted: stats.quizzesTaken,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
      },
    });
  }
}

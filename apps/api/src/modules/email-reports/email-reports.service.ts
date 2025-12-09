import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface ReportData {
  studyTime: { total: number; daily: { date: string; minutes: number }[] };
  flashcards: { reviewed: number; correct: number; accuracy: number };
  quizzes: { completed: number; avgScore: number };
  tasks: { completed: number; pending: number; overdue: number };
  goals: { active: number; completed: number; progress: number };
  streak: { current: number; longest: number };
  upcoming: any[];
}

@Injectable()
export class EmailReportsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getOrCreateConfig(userId: string) {
    let config = await this.prisma.emailReportConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      config = await this.prisma.emailReportConfig.create({
        data: { userId },
      });
    }

    return config;
  }

  async updateConfig(
    userId: string,
    data: {
      isEnabled?: boolean;
      frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      dayOfWeek?: number;
      dayOfMonth?: number;
      timeOfDay?: string;
      timezone?: string;
      includeStudyTime?: boolean;
      includeFlashcards?: boolean;
      includeQuizzes?: boolean;
      includeTasks?: boolean;
      includeGoals?: boolean;
      includeUpcoming?: boolean;
    },
  ) {
    return this.prisma.emailReportConfig.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async generateReport(userId: string, periodDays = 7): Promise<ReportData> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const [
      studySessions,
      flashcardReviews,
      quizAttempts,
      tasks,
      goals,
      userXP,
      upcomingEvents,
    ] = await Promise.all([
      // Study sessions
      this.prisma.studySession.findMany({
        where: {
          userId,
          startedAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
      }),

      // Flashcard reviews
      this.prisma.flashcardReview.findMany({
        where: {
          flashcard: { deck: { userId } },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      // Quiz attempts
      this.prisma.quizAttempt.findMany({
        where: {
          quiz: { userId },
          completedAt: { gte: startDate, lte: endDate },
        },
      }),

      // Tasks
      this.prisma.task.findMany({
        where: { userId },
      }),

      // Goals
      this.prisma.studyGoal.findMany({
        where: {
          userId,
          OR: [
            { status: 'ACTIVE' },
            { completedAt: { gte: startDate, lte: endDate } },
          ],
        },
      }),

      // User XP for streak
      this.prisma.userXP.findUnique({
        where: { userId },
      }),

      // Upcoming events
      this.prisma.studyEvent.findMany({
        where: {
          userId,
          startTime: { gte: endDate },
          type: { in: ['EXAM', 'DEADLINE'] },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
    ]);

    // Process study time by day
    const dailyStudy = new Map<string, number>();
    studySessions.forEach((session) => {
      const dateKey = session.startedAt.toISOString().split('T')[0];
      const current = dailyStudy.get(dateKey) || 0;
      dailyStudy.set(dateKey, current + (session.actualMinutes || 0));
    });

    const daily = Array.from(dailyStudy.entries())
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalStudyMinutes = studySessions.reduce(
      (sum, s) => sum + (s.actualMinutes || 0),
      0,
    );

    // Flashcard stats
    const correctReviews = flashcardReviews.filter((r) => r.quality >= 3).length;
    const flashcardAccuracy =
      flashcardReviews.length > 0
        ? Math.round((correctReviews / flashcardReviews.length) * 100)
        : 0;

    // Quiz stats
    const quizAvgScore =
      quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length,
          )
        : 0;

    // Task stats
    const now = new Date();
    const completedTasks = tasks.filter(
      (t) =>
        t.status === 'COMPLETED' &&
        t.completedAt &&
        t.completedAt >= startDate &&
        t.completedAt <= endDate,
    ).length;
    const pendingTasks = tasks.filter(
      (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS',
    ).length;
    const overdueTasks = tasks.filter(
      (t) =>
        (t.status === 'PENDING' || t.status === 'IN_PROGRESS') &&
        t.dueDate &&
        t.dueDate < now,
    ).length;

    // Goals stats
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE').length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const goalsProgress =
      goals.length > 0
        ? Math.round(
            goals.reduce(
              (sum, g) => sum + Math.min(100, (g.currentValue / g.targetValue) * 100),
              0,
            ) / goals.length,
          )
        : 0;

    return {
      studyTime: {
        total: totalStudyMinutes,
        daily,
      },
      flashcards: {
        reviewed: flashcardReviews.length,
        correct: correctReviews,
        accuracy: flashcardAccuracy,
      },
      quizzes: {
        completed: quizAttempts.length,
        avgScore: quizAvgScore,
      },
      tasks: {
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      goals: {
        active: activeGoals,
        completed: completedGoals,
        progress: goalsProgress,
      },
      streak: {
        current: userXP?.currentStreak || 0,
        longest: userXP?.longestStreak || 0,
      },
      upcoming: upcomingEvents.map((e) => ({
        title: e.title,
        date: e.startTime,
        type: e.type,
      })),
    };
  }

  async sendReport(userId: string) {
    const [user, config, report] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      this.getOrCreateConfig(userId),
      this.generateReport(userId),
    ]);

    if (!user || !config.isEnabled) {
      return { success: false, reason: 'Disabled or user not found' };
    }

    // Generate email HTML
    const html = this.generateEmailHTML(
      user.profile?.firstName || 'Estudiante',
      report,
      config,
    );

    // Send email using notification service
    // Note: This should integrate with the existing email service
    const emailService = this.config.get('EMAIL_SERVICE');
    if (emailService) {
      // await this.emailService.send(user.email, 'Tu reporte semanal de CampusMind', html);
    }

    // Update last sent
    await this.prisma.emailReportConfig.update({
      where: { userId },
      data: { lastSentAt: new Date() },
    });

    return { success: true, report };
  }

  private generateEmailHTML(
    name: string,
    report: ReportData,
    config: any,
  ): string {
    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    let sections = '';

    if (config.includeStudyTime) {
      sections += `
        <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #6366f1;">📚 Tiempo de Estudio</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 0;">
            ${formatTime(report.studyTime.total)}
          </p>
          <p style="color: #666; margin: 8px 0 0 0;">esta semana</p>
        </div>
      `;
    }

    if (config.includeFlashcards) {
      sections += `
        <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #10b981;">🧠 Flashcards</h3>
          <p><strong>${report.flashcards.reviewed}</strong> revisadas</p>
          <p><strong>${report.flashcards.accuracy}%</strong> precisión</p>
        </div>
      `;
    }

    if (config.includeQuizzes) {
      sections += `
        <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #f59e0b;">📝 Quizzes</h3>
          <p><strong>${report.quizzes.completed}</strong> completados</p>
          <p><strong>${report.quizzes.avgScore}%</strong> promedio</p>
        </div>
      `;
    }

    if (config.includeTasks) {
      sections += `
        <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #3b82f6;">✅ Tareas</h3>
          <p><strong>${report.tasks.completed}</strong> completadas</p>
          <p><strong>${report.tasks.pending}</strong> pendientes</p>
          ${report.tasks.overdue > 0 ? `<p style="color: #ef4444;"><strong>${report.tasks.overdue}</strong> vencidas</p>` : ''}
        </div>
      `;
    }

    if (config.includeGoals) {
      sections += `
        <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #8b5cf6;">🎯 Metas</h3>
          <p><strong>${report.goals.active}</strong> activas</p>
          <p><strong>${report.goals.progress}%</strong> progreso promedio</p>
        </div>
      `;
    }

    sections += `
      <div style="margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 8px; color: white;">
        <h3 style="margin: 0 0 12px 0;">🔥 Racha</h3>
        <p style="font-size: 24px; font-weight: bold; margin: 0;">
          ${report.streak.current} días
        </p>
      </div>
    `;

    if (config.includeUpcoming && report.upcoming.length > 0) {
      const upcomingList = report.upcoming
        .map(
          (e) =>
            `<li>${e.title} - ${new Date(e.date).toLocaleDateString('es')}</li>`,
        )
        .join('');

      sections += `
        <div style="margin-bottom: 24px; padding: 16px; background: #fef3cd; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #856404;">📅 Próximos Eventos</h3>
          <ul style="margin: 0; padding-left: 20px;">${upcomingList}</ul>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6366f1; margin: 0;">CampusMind</h1>
          <p style="color: #666;">Tu reporte semanal de estudio</p>
        </div>

        <p style="font-size: 18px;">¡Hola ${name}! 👋</p>
        <p>Aquí está tu resumen de la semana:</p>

        ${sections}

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; font-size: 14px;">
            Sigue así, ¡cada día cuenta! 💪
          </p>
          <a href="${this.config.get('APP_URL')}/app/dashboard"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Ir a CampusMind
          </a>
        </div>

        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
          <a href="${this.config.get('APP_URL')}/app/settings/notifications">Configurar reportes</a>
        </p>
      </body>
      </html>
    `;
  }

  async previewReport(userId: string) {
    const [config, report] = await Promise.all([
      this.getOrCreateConfig(userId),
      this.generateReport(userId),
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    return {
      report,
      html: this.generateEmailHTML(
        user?.profile?.firstName || 'Estudiante',
        report,
        config,
      ),
    };
  }
}

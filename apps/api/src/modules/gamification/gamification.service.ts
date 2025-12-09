import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// XP rewards configuration
const XP_REWARDS = {
  STUDY_SESSION: 10,
  STUDY_SESSION_LONG: 25, // > 45 min
  FLASHCARD_REVIEW: 1,
  FLASHCARD_CORRECT: 2,
  QUIZ_COMPLETE: 15,
  QUIZ_PERFECT: 50,
  GOAL_COMPLETE: 30,
  DAILY_LOGIN: 5,
  STREAK_BONUS_7: 50,
  STREAK_BONUS_30: 200,
  HELP_OTHERS: 10, // Forum answers
};

// Level thresholds
const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Novato' },
  { level: 2, xpRequired: 100, title: 'Aprendiz' },
  { level: 3, xpRequired: 300, title: 'Estudiante' },
  { level: 4, xpRequired: 600, title: 'Estudioso' },
  { level: 5, xpRequired: 1000, title: 'Dedicado' },
  { level: 6, xpRequired: 1500, title: 'Avanzado' },
  { level: 7, xpRequired: 2200, title: 'Experto' },
  { level: 8, xpRequired: 3000, title: 'Maestro' },
  { level: 9, xpRequired: 4000, title: 'Gran Maestro' },
  { level: 10, xpRequired: 5500, title: 'Leyenda' },
  { level: 11, xpRequired: 7500, title: 'Iluminado' },
  { level: 12, xpRequired: 10000, title: 'Sabio' },
];

// Default achievements
const DEFAULT_ACHIEVEMENTS = [
  {
    name: 'first_session',
    title: 'Primer Paso',
    description: 'Completa tu primera sesión de estudio',
    icon: '🎯',
    category: 'STUDY_TIME',
    requirement: 'study_sessions',
    targetValue: 1,
    xpReward: 20,
    pointsReward: 10,
    rarity: 'COMMON',
  },
  {
    name: 'study_hours_10',
    title: 'Estudiante Dedicado',
    description: 'Acumula 10 horas de estudio',
    icon: '📚',
    category: 'STUDY_TIME',
    requirement: 'total_study_hours',
    targetValue: 10,
    xpReward: 100,
    pointsReward: 50,
    rarity: 'UNCOMMON',
  },
  {
    name: 'study_hours_50',
    title: 'Maratonista',
    description: 'Acumula 50 horas de estudio',
    icon: '🏃',
    category: 'STUDY_TIME',
    requirement: 'total_study_hours',
    targetValue: 50,
    xpReward: 300,
    pointsReward: 150,
    rarity: 'RARE',
  },
  {
    name: 'flashcards_100',
    title: 'Memorión',
    description: 'Revisa 100 flashcards',
    icon: '🧠',
    category: 'FLASHCARDS',
    requirement: 'total_flashcards',
    targetValue: 100,
    xpReward: 50,
    pointsReward: 25,
    rarity: 'COMMON',
  },
  {
    name: 'flashcards_1000',
    title: 'Memoria de Elefante',
    description: 'Revisa 1000 flashcards',
    icon: '🐘',
    category: 'FLASHCARDS',
    requirement: 'total_flashcards',
    targetValue: 1000,
    xpReward: 200,
    pointsReward: 100,
    rarity: 'RARE',
  },
  {
    name: 'quiz_perfect_1',
    title: 'Perfeccionista',
    description: 'Obtén 100% en un quiz',
    icon: '💯',
    category: 'QUIZZES',
    requirement: 'perfect_quizzes',
    targetValue: 1,
    xpReward: 50,
    pointsReward: 25,
    rarity: 'UNCOMMON',
  },
  {
    name: 'quiz_perfect_10',
    title: 'Quiz Master',
    description: 'Obtén 100% en 10 quizzes',
    icon: '🏆',
    category: 'QUIZZES',
    requirement: 'perfect_quizzes',
    targetValue: 10,
    xpReward: 300,
    pointsReward: 150,
    rarity: 'EPIC',
  },
  {
    name: 'streak_7',
    title: 'Constante',
    description: 'Mantén una racha de 7 días',
    icon: '🔥',
    category: 'STREAK',
    requirement: 'current_streak',
    targetValue: 7,
    xpReward: 100,
    pointsReward: 50,
    rarity: 'UNCOMMON',
  },
  {
    name: 'streak_30',
    title: 'Imparable',
    description: 'Mantén una racha de 30 días',
    icon: '⚡',
    category: 'STREAK',
    requirement: 'current_streak',
    targetValue: 30,
    xpReward: 500,
    pointsReward: 250,
    rarity: 'EPIC',
  },
  {
    name: 'streak_100',
    title: 'Leyenda',
    description: 'Mantén una racha de 100 días',
    icon: '👑',
    category: 'STREAK',
    requirement: 'current_streak',
    targetValue: 100,
    xpReward: 1500,
    pointsReward: 750,
    rarity: 'LEGENDARY',
  },
];

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  // Initialize achievements in database
  async initAchievements() {
    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      await this.prisma.achievement.upsert({
        where: { name: achievement.name },
        update: {},
        create: achievement as any,
      });
    }
  }

  async getOrCreateUserXP(userId: string) {
    let userXP = await this.prisma.userXP.findUnique({
      where: { userId },
    });

    if (!userXP) {
      userXP = await this.prisma.userXP.create({
        data: { userId },
      });
    }

    return userXP;
  }

  async getUserProfile(userId: string) {
    const userXP = await this.getOrCreateUserXP(userId);
    const currentLevel = this.getLevelInfo(userXP.totalXP);
    const nextLevel = LEVELS[currentLevel.level] || LEVELS[LEVELS.length - 1];

    const achievements = await this.prisma.userAchievement.findMany({
      where: { userId, isCompleted: true },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });

    return {
      ...userXP,
      levelInfo: currentLevel,
      nextLevelXP: nextLevel.xpRequired,
      xpToNextLevel: Math.max(0, nextLevel.xpRequired - userXP.totalXP),
      achievements: achievements.map((a) => ({
        ...a.achievement,
        unlockedAt: a.unlockedAt,
      })),
    };
  }

  private getLevelInfo(totalXP: number) {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
      if (totalXP >= level.xpRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  }

  async awardXP(
    userId: string,
    type: keyof typeof XP_REWARDS,
    description: string,
    metadata?: any,
  ) {
    const amount = XP_REWARDS[type];

    // Create transaction record
    await this.prisma.xPTransaction.create({
      data: {
        userId,
        amount,
        type: type as any,
        description,
        metadata,
      },
    });

    // Update user XP
    const userXP = await this.prisma.userXP.upsert({
      where: { userId },
      update: {
        totalXP: { increment: amount },
        points: { increment: Math.floor(amount / 2) },
        lastActivityDate: new Date(),
      },
      create: {
        userId,
        totalXP: amount,
        points: Math.floor(amount / 2),
        lastActivityDate: new Date(),
      },
    });

    // Check for level up
    const newLevel = this.getLevelInfo(userXP.totalXP);
    const oldLevel = this.getLevelInfo(userXP.totalXP - amount);

    const leveledUp = newLevel.level > oldLevel.level;

    // Update level in database
    if (leveledUp) {
      await this.prisma.userXP.update({
        where: { userId },
        data: { level: newLevel.level },
      });
    }

    return {
      xpAwarded: amount,
      totalXP: userXP.totalXP,
      level: newLevel.level,
      levelTitle: newLevel.title,
      leveledUp,
    };
  }

  async recordStudySession(userId: string, minutes: number) {
    const type = minutes >= 45 ? 'STUDY_SESSION_LONG' : 'STUDY_SESSION';
    const result = await this.awardXP(userId, type, `Sesión de estudio de ${minutes} min`);

    // Update stats
    await this.prisma.userXP.update({
      where: { userId },
      data: {
        totalStudyHours: { increment: Math.floor(minutes / 60) },
      },
    });

    await this.checkAchievements(userId);
    return result;
  }

  async recordFlashcardReview(userId: string, correct: boolean) {
    const type = correct ? 'FLASHCARD_CORRECT' : 'FLASHCARD_REVIEW';
    const result = await this.awardXP(userId, type, 'Revisión de flashcard');

    await this.prisma.userXP.update({
      where: { userId },
      data: {
        totalFlashcards: { increment: 1 },
      },
    });

    await this.checkAchievements(userId);
    return result;
  }

  async recordQuizComplete(userId: string, score: number, isPerfect: boolean) {
    const type = isPerfect ? 'QUIZ_PERFECT' : 'QUIZ_COMPLETE';
    const result = await this.awardXP(userId, type, `Quiz completado: ${score}%`);

    await this.prisma.userXP.update({
      where: { userId },
      data: {
        totalQuizzes: { increment: 1 },
        perfectQuizzes: isPerfect ? { increment: 1 } : undefined,
      },
    });

    await this.checkAchievements(userId);
    return result;
  }

  async updateStreak(userId: string) {
    const userXP = await this.getOrCreateUserXP(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = userXP.lastActivityDate;
    let newStreak = userXP.currentStreak;

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak = userXP.currentStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If diffDays === 0, same day, don't change streak
    } else {
      newStreak = 1;
    }

    const longestStreak = Math.max(userXP.longestStreak, newStreak);

    await this.prisma.userXP.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: new Date(),
      },
    });

    // Award streak bonuses
    if (newStreak === 7) {
      await this.awardXP(userId, 'STREAK_BONUS_7', 'Racha de 7 días');
    } else if (newStreak === 30) {
      await this.awardXP(userId, 'STREAK_BONUS_30', 'Racha de 30 días');
    }

    await this.checkAchievements(userId);

    return { currentStreak: newStreak, longestStreak };
  }

  async checkAchievements(userId: string) {
    const userXP = await this.getOrCreateUserXP(userId);
    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const unlockedIds = new Set(
      userAchievements.filter((a) => a.isCompleted).map((a) => a.achievementId)
    );

    const newUnlocks = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let currentValue = 0;
      switch (achievement.requirement) {
        case 'study_sessions':
          currentValue = await this.prisma.studySession.count({
            where: { userId, status: 'COMPLETED' },
          });
          break;
        case 'total_study_hours':
          currentValue = userXP.totalStudyHours;
          break;
        case 'total_flashcards':
          currentValue = userXP.totalFlashcards;
          break;
        case 'total_quizzes':
          currentValue = userXP.totalQuizzes;
          break;
        case 'perfect_quizzes':
          currentValue = userXP.perfectQuizzes;
          break;
        case 'current_streak':
          currentValue = userXP.currentStreak;
          break;
      }

      const isCompleted = currentValue >= achievement.targetValue;

      await this.prisma.userAchievement.upsert({
        where: {
          userId_achievementId: { userId, achievementId: achievement.id },
        },
        update: {
          progress: currentValue,
          isCompleted,
          unlockedAt: isCompleted ? new Date() : undefined,
        },
        create: {
          userId,
          achievementId: achievement.id,
          progress: currentValue,
          isCompleted,
          unlockedAt: isCompleted ? new Date() : undefined,
        },
      });

      if (isCompleted && !unlockedIds.has(achievement.id)) {
        newUnlocks.push(achievement);
        // Award XP for achievement
        await this.awardXP(userId, 'ACHIEVEMENT' as any, `Logro: ${achievement.title}`);
      }
    }

    return newUnlocks;
  }

  async getLeaderboard(type: 'xp' | 'points' | 'streak' = 'points', limit = 50) {
    const orderBy =
      type === 'xp'
        ? { totalXP: 'desc' as const }
        : type === 'streak'
        ? { currentStreak: 'desc' as const }
        : { points: 'desc' as const };

    const users = await this.prisma.userXP.findMany({
      orderBy,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, university: true },
            },
          },
        },
      },
    });

    return users.map((u, index) => ({
      rank: index + 1,
      userId: u.userId,
      name: u.user.profile
        ? `${u.user.profile.firstName} ${u.user.profile.lastName}`
        : 'Usuario',
      university: u.user.profile?.university,
      level: u.level,
      totalXP: u.totalXP,
      points: u.points,
      currentStreak: u.currentStreak,
    }));
  }

  async getUserRank(userId: string) {
    const userXP = await this.getOrCreateUserXP(userId);

    const rank = await this.prisma.userXP.count({
      where: { points: { gt: userXP.points } },
    });

    return { rank: rank + 1, points: userXP.points };
  }

  async getAllAchievements(userId: string) {
    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { targetValue: 'asc' }],
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const userProgress = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua])
    );

    return achievements.map((a) => {
      const progress = userProgress.get(a.id);
      return {
        ...a,
        progress: progress?.progress || 0,
        isCompleted: progress?.isCompleted || false,
        unlockedAt: progress?.unlockedAt,
      };
    });
  }
}

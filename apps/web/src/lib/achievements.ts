// Achievements/Badges System

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'streak' | 'mastery' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  requirement: {
    type: string;
    value: number;
  };
  unlockedAt?: Date;
  progress?: number;
}

export interface UserAchievements {
  unlocked: Achievement[];
  inProgress: Achievement[];
  totalXpEarned: number;
}

const STORAGE_KEY = 'campusmind-achievements';

// All available achievements
export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // Study achievements
  {
    id: 'first-flashcard',
    name: 'Primera Tarjeta',
    description: 'Revisa tu primera flashcard',
    icon: 'brain',
    category: 'study',
    rarity: 'common',
    xpReward: 10,
    requirement: { type: 'flashcards_reviewed', value: 1 },
  },
  {
    id: 'flashcard-novice',
    name: 'Novato de Flashcards',
    description: 'Revisa 50 flashcards',
    icon: 'brain',
    category: 'study',
    rarity: 'common',
    xpReward: 50,
    requirement: { type: 'flashcards_reviewed', value: 50 },
  },
  {
    id: 'flashcard-adept',
    name: 'Adepto de Flashcards',
    description: 'Revisa 250 flashcards',
    icon: 'brain',
    category: 'study',
    rarity: 'uncommon',
    xpReward: 150,
    requirement: { type: 'flashcards_reviewed', value: 250 },
  },
  {
    id: 'flashcard-master',
    name: 'Maestro de Flashcards',
    description: 'Revisa 1000 flashcards',
    icon: 'brain',
    category: 'study',
    rarity: 'rare',
    xpReward: 500,
    requirement: { type: 'flashcards_reviewed', value: 1000 },
  },
  {
    id: 'flashcard-legend',
    name: 'Leyenda de Flashcards',
    description: 'Revisa 5000 flashcards',
    icon: 'brain',
    category: 'study',
    rarity: 'legendary',
    xpReward: 2000,
    requirement: { type: 'flashcards_reviewed', value: 5000 },
  },
  {
    id: 'first-quiz',
    name: 'Primer Quiz',
    description: 'Completa tu primer quiz',
    icon: 'clipboard-check',
    category: 'study',
    rarity: 'common',
    xpReward: 15,
    requirement: { type: 'quizzes_completed', value: 1 },
  },
  {
    id: 'quiz-perfectionist',
    name: 'Perfeccionista',
    description: 'Obtén 100% en 5 quizzes',
    icon: 'star',
    category: 'mastery',
    rarity: 'rare',
    xpReward: 300,
    requirement: { type: 'perfect_quizzes', value: 5 },
  },
  {
    id: 'study-hour',
    name: 'Una Hora de Estudio',
    description: 'Estudia por 1 hora en total',
    icon: 'clock',
    category: 'study',
    rarity: 'common',
    xpReward: 25,
    requirement: { type: 'study_minutes', value: 60 },
  },
  {
    id: 'study-10-hours',
    name: 'Estudiante Dedicado',
    description: 'Estudia por 10 horas en total',
    icon: 'clock',
    category: 'study',
    rarity: 'uncommon',
    xpReward: 200,
    requirement: { type: 'study_minutes', value: 600 },
  },
  {
    id: 'study-100-hours',
    name: 'Erudito',
    description: 'Estudia por 100 horas en total',
    icon: 'clock',
    category: 'study',
    rarity: 'epic',
    xpReward: 1000,
    requirement: { type: 'study_minutes', value: 6000 },
  },

  // Streak achievements
  {
    id: 'streak-3',
    name: 'Racha de 3 días',
    description: 'Mantén una racha de 3 días',
    icon: 'flame',
    category: 'streak',
    rarity: 'common',
    xpReward: 30,
    requirement: { type: 'streak_days', value: 3 },
  },
  {
    id: 'streak-7',
    name: 'Semana Perfecta',
    description: 'Mantén una racha de 7 días',
    icon: 'flame',
    category: 'streak',
    rarity: 'uncommon',
    xpReward: 100,
    requirement: { type: 'streak_days', value: 7 },
  },
  {
    id: 'streak-30',
    name: 'Mes Imparable',
    description: 'Mantén una racha de 30 días',
    icon: 'flame',
    category: 'streak',
    rarity: 'rare',
    xpReward: 500,
    requirement: { type: 'streak_days', value: 30 },
  },
  {
    id: 'streak-100',
    name: 'Centenario',
    description: 'Mantén una racha de 100 días',
    icon: 'flame',
    category: 'streak',
    rarity: 'epic',
    xpReward: 2000,
    requirement: { type: 'streak_days', value: 100 },
  },
  {
    id: 'streak-365',
    name: 'Un Año Sin Parar',
    description: 'Mantén una racha de 365 días',
    icon: 'flame',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 10000,
    requirement: { type: 'streak_days', value: 365 },
  },

  // Social achievements
  {
    id: 'first-share',
    name: 'Generoso',
    description: 'Comparte tu primer recurso',
    icon: 'share',
    category: 'social',
    rarity: 'common',
    xpReward: 20,
    requirement: { type: 'resources_shared', value: 1 },
  },
  {
    id: 'join-group',
    name: 'Miembro del Club',
    description: 'Únete a tu primer grupo de estudio',
    icon: 'users',
    category: 'social',
    rarity: 'common',
    xpReward: 25,
    requirement: { type: 'groups_joined', value: 1 },
  },
  {
    id: 'create-group',
    name: 'Líder Nato',
    description: 'Crea tu primer grupo de estudio',
    icon: 'users-plus',
    category: 'social',
    rarity: 'uncommon',
    xpReward: 75,
    requirement: { type: 'groups_created', value: 1 },
  },
  {
    id: 'helper',
    name: 'Ayudante',
    description: 'Envía 50 mensajes en grupos',
    icon: 'message-circle',
    category: 'social',
    rarity: 'uncommon',
    xpReward: 100,
    requirement: { type: 'group_messages', value: 50 },
  },

  // Mastery achievements
  {
    id: 'subject-master',
    name: 'Experto en Materia',
    description: 'Domina todas las flashcards de una materia',
    icon: 'award',
    category: 'mastery',
    rarity: 'rare',
    xpReward: 400,
    requirement: { type: 'subjects_mastered', value: 1 },
  },
  {
    id: 'polymath',
    name: 'Polímata',
    description: 'Domina 5 materias diferentes',
    icon: 'graduation-cap',
    category: 'mastery',
    rarity: 'epic',
    xpReward: 1500,
    requirement: { type: 'subjects_mastered', value: 5 },
  },

  // Special achievements
  {
    id: 'early-bird',
    name: 'Madrugador',
    description: 'Estudia antes de las 6 AM',
    icon: 'sunrise',
    category: 'special',
    rarity: 'uncommon',
    xpReward: 50,
    requirement: { type: 'early_study', value: 1 },
  },
  {
    id: 'night-owl',
    name: 'Búho Nocturno',
    description: 'Estudia después de medianoche',
    icon: 'moon',
    category: 'special',
    rarity: 'uncommon',
    xpReward: 50,
    requirement: { type: 'late_study', value: 1 },
  },
  {
    id: 'weekend-warrior',
    name: 'Guerrero de Fin de Semana',
    description: 'Estudia 5 horas en un fin de semana',
    icon: 'calendar',
    category: 'special',
    rarity: 'rare',
    xpReward: 200,
    requirement: { type: 'weekend_study_hours', value: 5 },
  },
  {
    id: 'first-steps',
    name: 'Primeros Pasos',
    description: 'Completa el tutorial de onboarding',
    icon: 'sparkles',
    category: 'special',
    rarity: 'common',
    xpReward: 25,
    requirement: { type: 'onboarding_complete', value: 1 },
  },
];

// Rarity colors
export const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-emerald-500',
  rare: 'from-blue-400 to-indigo-500',
  epic: 'from-purple-400 to-violet-500',
  legendary: 'from-amber-400 to-orange-500',
};

export const RARITY_LABELS: Record<Achievement['rarity'], string> = {
  common: 'Común',
  uncommon: 'Poco común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};

export const CATEGORY_LABELS: Record<Achievement['category'], string> = {
  study: 'Estudio',
  social: 'Social',
  streak: 'Racha',
  mastery: 'Maestría',
  special: 'Especial',
};

// Get user achievements
export function getUserAchievements(): UserAchievements {
  if (typeof window === 'undefined') {
    return { unlocked: [], inProgress: [], totalXpEarned: 0 };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return {
        ...data,
        unlocked: data.unlocked.map((a: Achievement) => ({
          ...a,
          unlockedAt: new Date(a.unlockedAt!),
        })),
      };
    } catch {
      // Initialize with some demo achievements
    }
  }

  // Demo: Pre-unlock some achievements
  const demoUnlocked = ALL_ACHIEVEMENTS.filter(a =>
    ['first-flashcard', 'first-quiz', 'streak-3', 'first-steps'].includes(a.id)
  ).map(a => ({
    ...a,
    unlockedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));

  const demoInProgress = ALL_ACHIEVEMENTS.filter(a =>
    ['flashcard-novice', 'streak-7', 'study-hour'].includes(a.id)
  ).map(a => ({
    ...a,
    progress: Math.floor(Math.random() * a.requirement.value * 0.8),
  }));

  const result = {
    unlocked: demoUnlocked,
    inProgress: demoInProgress,
    totalXpEarned: demoUnlocked.reduce((sum, a) => sum + a.xpReward, 0),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  return result;
}

// Unlock achievement
export function unlockAchievement(achievementId: string): Achievement | null {
  const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;

  const userAchievements = getUserAchievements();

  // Already unlocked
  if (userAchievements.unlocked.some(a => a.id === achievementId)) {
    return null;
  }

  const unlockedAchievement: Achievement = {
    ...achievement,
    unlockedAt: new Date(),
  };

  userAchievements.unlocked.push(unlockedAchievement);
  userAchievements.inProgress = userAchievements.inProgress.filter(a => a.id !== achievementId);
  userAchievements.totalXpEarned += achievement.xpReward;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(userAchievements));

  return unlockedAchievement;
}

// Update progress
export function updateAchievementProgress(
  type: string,
  value: number
): Achievement[] {
  const userAchievements = getUserAchievements();
  const newlyUnlocked: Achievement[] = [];

  ALL_ACHIEVEMENTS.forEach(achievement => {
    if (achievement.requirement.type !== type) return;
    if (userAchievements.unlocked.some(a => a.id === achievement.id)) return;

    if (value >= achievement.requirement.value) {
      const unlocked = unlockAchievement(achievement.id);
      if (unlocked) newlyUnlocked.push(unlocked);
    } else {
      // Update progress
      const existing = userAchievements.inProgress.find(a => a.id === achievement.id);
      if (existing) {
        existing.progress = value;
      } else {
        userAchievements.inProgress.push({
          ...achievement,
          progress: value,
        });
      }
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(userAchievements));
  return newlyUnlocked;
}

// Get achievement by ID
export function getAchievement(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category);
}

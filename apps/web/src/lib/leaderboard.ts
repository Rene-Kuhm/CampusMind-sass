// Leaderboard Library - Gamification system
// In production, this would connect to the backend API

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  streak: number;
  studyHours: number;
  flashcardsReviewed: number;
  quizzesPassed: number;
  achievements: number;
  change: 'up' | 'down' | 'same';
  changeAmount?: number;
}

export interface UserStats {
  rank: number;
  totalUsers: number;
  percentile: number;
  xpToNextRank: number;
  weeklyXp: number;
  monthlyXp: number;
}

export type TimeFilter = 'today' | 'week' | 'month' | 'allTime';
export type CategoryFilter = 'overall' | 'flashcards' | 'quizzes' | 'studyTime' | 'streak';

const STORAGE_KEY = 'campusmind-leaderboard';

// Generate sample leaderboard data
function generateSampleLeaderboard(): LeaderboardUser[] {
  const names = [
    'María García', 'Carlos López', 'Ana Martínez', 'Pedro Sánchez',
    'Laura Fernández', 'Diego Rodríguez', 'Carmen Silva', 'José Hernández',
    'Isabel Torres', 'Miguel Ángel', 'Sofía Ruiz', 'Alejandro Moreno',
    'Paula Castro', 'Fernando Díaz', 'Lucía González', 'Tú',
    'Roberto Álvarez', 'Elena Vargas', 'Andrés Romero', 'Valentina Molina',
  ];

  const users: LeaderboardUser[] = names.map((name, index) => {
    const isCurrentUser = name === 'Tú';
    const baseXp = 10000 - (index * 400) + Math.floor(Math.random() * 200);

    return {
      id: isCurrentUser ? 'current-user' : `user-${index}`,
      rank: index + 1,
      name,
      level: Math.floor(baseXp / 1000) + 1,
      xp: baseXp,
      streak: Math.max(1, 30 - index + Math.floor(Math.random() * 5)),
      studyHours: Math.floor(100 - (index * 4) + Math.random() * 20),
      flashcardsReviewed: Math.floor(500 - (index * 20) + Math.random() * 100),
      quizzesPassed: Math.floor(50 - (index * 2) + Math.random() * 10),
      achievements: Math.max(1, 20 - index + Math.floor(Math.random() * 3)),
      change: index < 5 ? 'up' : index < 10 ? 'same' : 'down',
      changeAmount: index < 5 ? Math.floor(Math.random() * 3) + 1 : index >= 10 ? Math.floor(Math.random() * 2) + 1 : undefined,
    };
  });

  // Sort by XP
  users.sort((a, b) => b.xp - a.xp);

  // Update ranks
  users.forEach((user, index) => {
    user.rank = index + 1;
  });

  return users;
}

// Get leaderboard data
export function getLeaderboard(
  timeFilter: TimeFilter = 'week',
  categoryFilter: CategoryFilter = 'overall'
): LeaderboardUser[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  let users: LeaderboardUser[];

  if (!stored) {
    users = generateSampleLeaderboard();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } else {
    try {
      users = JSON.parse(stored);
    } catch {
      users = generateSampleLeaderboard();
    }
  }

  // In real app, filter by time and category
  // For demo, we just shuffle slightly based on filters
  if (categoryFilter !== 'overall') {
    users = [...users].sort((a, b) => {
      switch (categoryFilter) {
        case 'flashcards':
          return b.flashcardsReviewed - a.flashcardsReviewed;
        case 'quizzes':
          return b.quizzesPassed - a.quizzesPassed;
        case 'studyTime':
          return b.studyHours - a.studyHours;
        case 'streak':
          return b.streak - a.streak;
        default:
          return b.xp - a.xp;
      }
    });

    // Update ranks after sorting
    users.forEach((user, index) => {
      user.rank = index + 1;
    });
  }

  return users;
}

// Get current user stats
export function getCurrentUserStats(): UserStats {
  const users = getLeaderboard();
  const currentUser = users.find(u => u.id === 'current-user');

  if (!currentUser) {
    return {
      rank: 50,
      totalUsers: 100,
      percentile: 50,
      xpToNextRank: 100,
      weeklyXp: 250,
      monthlyXp: 1000,
    };
  }

  const rank = currentUser.rank;
  const totalUsers = users.length;
  const percentile = Math.round(((totalUsers - rank) / totalUsers) * 100);
  const nextUser = users[rank - 2]; // User above
  const xpToNextRank = nextUser ? nextUser.xp - currentUser.xp : 0;

  return {
    rank,
    totalUsers,
    percentile,
    xpToNextRank,
    weeklyXp: Math.floor(currentUser.xp * 0.15),
    monthlyXp: Math.floor(currentUser.xp * 0.6),
  };
}

// Get top 3 users
export function getTopUsers(categoryFilter: CategoryFilter = 'overall'): LeaderboardUser[] {
  return getLeaderboard('week', categoryFilter).slice(0, 3);
}

// Level thresholds
export function getXpForLevel(level: number): number {
  return level * 1000;
}

export function getLevelProgress(xp: number): { level: number; progress: number; xpInLevel: number; xpForNext: number } {
  const level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpForNext = 1000;
  const progress = (xpInLevel / xpForNext) * 100;

  return { level, progress, xpInLevel, xpForNext };
}

// Level titles
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Novato',
  2: 'Aprendiz',
  3: 'Estudiante',
  4: 'Dedicado',
  5: 'Avanzado',
  6: 'Experto',
  7: 'Maestro',
  8: 'Sabio',
  9: 'Leyenda',
  10: 'Erudito',
};

export function getLevelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10];
  return LEVEL_TITLES[level] || LEVEL_TITLES[1];
}

// Category labels
export const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  overall: 'General',
  flashcards: 'Flashcards',
  quizzes: 'Quizzes',
  studyTime: 'Tiempo de estudio',
  streak: 'Racha',
};

// Time filter labels
export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  allTime: 'Todo el tiempo',
};

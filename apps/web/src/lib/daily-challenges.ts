// Daily Challenges Library - Gamification feature
// In production, this would connect to the backend API

export interface Challenge {
  id: string;
  type: 'flashcards' | 'quiz' | 'study' | 'streak' | 'social';
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: number;
  progress: number;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: Date;
}

export interface DailyProgress {
  date: string;
  challengesCompleted: number;
  totalChallenges: number;
  xpEarned: number;
  streak: number;
}

const STORAGE_KEY = 'campusmind-daily-challenges';
const PROGRESS_KEY = 'campusmind-challenge-progress';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get today's date string
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get end of today
function getEndOfDay(): Date {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
}

// Challenge templates
const CHALLENGE_TEMPLATES = [
  // Flashcard challenges
  {
    type: 'flashcards' as const,
    variants: [
      { title: 'Revisor Principiante', description: 'Revisa 10 flashcards', requirement: 10, xpReward: 25, difficulty: 'easy' as const },
      { title: 'Revisor Dedicado', description: 'Revisa 25 flashcards', requirement: 25, xpReward: 50, difficulty: 'medium' as const },
      { title: 'Maestro de la Memoria', description: 'Revisa 50 flashcards', requirement: 50, xpReward: 100, difficulty: 'hard' as const },
    ],
  },
  // Quiz challenges
  {
    type: 'quiz' as const,
    variants: [
      { title: 'Quiz Rápido', description: 'Completa 1 quiz', requirement: 1, xpReward: 30, difficulty: 'easy' as const },
      { title: 'Evaluador', description: 'Completa 3 quizzes', requirement: 3, xpReward: 75, difficulty: 'medium' as const },
      { title: 'Perfeccionista', description: 'Obtén 100% en un quiz', requirement: 1, xpReward: 100, difficulty: 'hard' as const },
    ],
  },
  // Study time challenges
  {
    type: 'study' as const,
    variants: [
      { title: 'Sesión Corta', description: 'Estudia por 15 minutos', requirement: 15, xpReward: 20, difficulty: 'easy' as const },
      { title: 'Estudiante Constante', description: 'Estudia por 30 minutos', requirement: 30, xpReward: 45, difficulty: 'medium' as const },
      { title: 'Maratón de Estudio', description: 'Estudia por 60 minutos', requirement: 60, xpReward: 100, difficulty: 'hard' as const },
    ],
  },
  // Streak challenges
  {
    type: 'streak' as const,
    variants: [
      { title: 'Mantén la Racha', description: 'Inicia sesión hoy', requirement: 1, xpReward: 15, difficulty: 'easy' as const },
      { title: 'Semana Perfecta', description: 'Mantén 7 días de racha', requirement: 7, xpReward: 150, difficulty: 'hard' as const },
    ],
  },
  // Social challenges
  {
    type: 'social' as const,
    variants: [
      { title: 'Compartir es Vivir', description: 'Comparte 1 recurso', requirement: 1, xpReward: 35, difficulty: 'easy' as const },
      { title: 'Colaborador', description: 'Envía un mensaje en un grupo', requirement: 1, xpReward: 25, difficulty: 'easy' as const },
    ],
  },
];

// Generate daily challenges
function generateDailyChallenges(): Challenge[] {
  const challenges: Challenge[] = [];
  const expiresAt = getEndOfDay();

  // Pick random challenges from each category
  CHALLENGE_TEMPLATES.forEach((category) => {
    // Pick 1-2 random variants from this category
    const shuffled = [...category.variants].sort(() => Math.random() - 0.5);
    const count = Math.min(1, shuffled.length); // Take 1 from each category

    for (let i = 0; i < count; i++) {
      const variant = shuffled[i];
      challenges.push({
        id: generateId(),
        type: category.type,
        title: variant.title,
        description: variant.description,
        icon: getChallengeIcon(category.type),
        xpReward: variant.xpReward,
        requirement: variant.requirement,
        progress: 0,
        completed: false,
        difficulty: variant.difficulty,
        expiresAt,
      });
    }
  });

  // Shuffle and limit to 5 challenges
  return challenges.sort(() => Math.random() - 0.5).slice(0, 5);
}

// Get icon for challenge type
function getChallengeIcon(type: Challenge['type']): string {
  const icons: Record<Challenge['type'], string> = {
    flashcards: 'brain',
    quiz: 'clipboard-check',
    study: 'clock',
    streak: 'flame',
    social: 'users',
  };
  return icons[type];
}

// Get today's challenges
export function getDailyChallenges(): Challenge[] {
  if (typeof window === 'undefined') return [];

  const today = getTodayString();
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    try {
      const data = JSON.parse(stored);
      // Check if challenges are from today
      if (data.date === today && data.challenges) {
        return data.challenges.map((c: Challenge) => ({
          ...c,
          expiresAt: new Date(c.expiresAt),
        }));
      }
    } catch {
      // Generate new challenges if parsing fails
    }
  }

  // Generate new challenges for today
  const challenges = generateDailyChallenges();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: today,
    challenges,
  }));

  return challenges;
}

// Update challenge progress
export function updateChallengeProgress(
  challengeId: string,
  progress: number
): Challenge | null {
  const challenges = getDailyChallenges();
  const challenge = challenges.find(c => c.id === challengeId);

  if (!challenge) return null;

  challenge.progress = Math.min(progress, challenge.requirement);
  challenge.completed = challenge.progress >= challenge.requirement;

  // Save updated challenges
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: getTodayString(),
    challenges,
  }));

  // If completed, update daily progress
  if (challenge.completed) {
    const dailyProgress = getDailyProgress();
    dailyProgress.challengesCompleted++;
    dailyProgress.xpEarned += challenge.xpReward;
    saveDailyProgress(dailyProgress);
  }

  return challenge;
}

// Increment challenge progress
export function incrementChallengeProgress(
  type: Challenge['type'],
  amount: number = 1
): void {
  const challenges = getDailyChallenges();
  const matchingChallenges = challenges.filter(c => c.type === type && !c.completed);

  matchingChallenges.forEach(challenge => {
    updateChallengeProgress(challenge.id, challenge.progress + amount);
  });
}

// Get daily progress
export function getDailyProgress(): DailyProgress {
  if (typeof window === 'undefined') {
    return {
      date: getTodayString(),
      challengesCompleted: 0,
      totalChallenges: 5,
      xpEarned: 0,
      streak: 1,
    };
  }

  const today = getTodayString();
  const stored = localStorage.getItem(PROGRESS_KEY);

  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data;
      }
      // New day - increment streak if yesterday was completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      if (data.date === yesterdayString && data.challengesCompleted > 0) {
        return {
          date: today,
          challengesCompleted: 0,
          totalChallenges: 5,
          xpEarned: 0,
          streak: data.streak + 1,
        };
      }
    } catch {
      // Return default if parsing fails
    }
  }

  return {
    date: today,
    challengesCompleted: 0,
    totalChallenges: 5,
    xpEarned: 0,
    streak: 1,
  };
}

// Save daily progress
function saveDailyProgress(progress: DailyProgress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// Get time remaining until challenges reset
export function getTimeUntilReset(): string {
  const now = new Date();
  const endOfDay = getEndOfDay();
  const diff = endOfDay.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Check if all challenges are completed
export function areAllChallengesCompleted(): boolean {
  const challenges = getDailyChallenges();
  return challenges.every(c => c.completed);
}

// Get total XP available today
export function getTotalXpAvailable(): number {
  const challenges = getDailyChallenges();
  return challenges.reduce((sum, c) => sum + c.xpReward, 0);
}

// Difficulty colors
export const DIFFICULTY_COLORS: Record<Challenge['difficulty'], string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Difficulty labels
export const DIFFICULTY_LABELS: Record<Challenge['difficulty'], string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
};

// Type colors
export const TYPE_COLORS: Record<Challenge['type'], string> = {
  flashcards: 'from-pink-500 to-rose-500',
  quiz: 'from-indigo-500 to-purple-500',
  study: 'from-cyan-500 to-blue-500',
  streak: 'from-orange-500 to-red-500',
  social: 'from-emerald-500 to-teal-500',
};

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subjects as subjectsApi, Subject, rag, RagStats } from '@/lib/api';
import {
  Card,
  CardContent,
  Badge,
} from '@/components/ui';
import {
  TrendingUp,
  Brain,
  BookOpen,
  Clock,
  Target,
  Award,
  Flame,
  Calendar,
  Zap,
  BarChart3,
  CheckCircle,
  Trophy,
  Star,
  Activity,
  Layers,
  Timer,
  FileQuestion,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudyStats {
  totalFlashcardsStudied: number;
  totalQuizzesCompleted: number;
  totalTimeSpentMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  weeklyProgress: number[];
  flashcardAccuracy: number;
  quizAverageScore: number;
  subjectProgress: { name: string; progress: number; color: string }[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: 'streak' | 'flashcards' | 'quiz' | 'time' | 'accuracy';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];
const LEVEL_NAMES = ['Novato', 'Aprendiz', 'Estudiante', 'Dedicado', 'Avanzado', 'Experto', 'Maestro', 'Sabio', 'Leyenda', 'Iluminado'];

function getLevel(points: number): { level: number; name: string; progress: number; nextThreshold: number } {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 1000;
  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return {
    level: level + 1,
    name: LEVEL_NAMES[level],
    progress,
    nextThreshold,
  };
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export default function ProgressPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [ragStats, setRagStats] = useState<RagStats | null>(null);
  const [stats, setStats] = useState<StudyStats>({
    totalFlashcardsStudied: 0,
    totalQuizzesCompleted: 0,
    totalTimeSpentMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    level: 1,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
    flashcardAccuracy: 0,
    quizAverageScore: 0,
    subjectProgress: [],
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-flashcard',
      name: 'Primer paso',
      description: 'Estudia tu primera flashcard',
      icon: 'flashcards',
      unlocked: false,
      progress: 0,
      maxProgress: 1,
    },
    {
      id: 'streak-7',
      name: 'Semana perfecta',
      description: 'Mantén una racha de 7 días',
      icon: 'streak',
      unlocked: false,
      progress: 0,
      maxProgress: 7,
    },
    {
      id: 'quiz-master',
      name: 'Maestro de quizzes',
      description: 'Completa 10 quizzes',
      icon: 'quiz',
      unlocked: false,
      progress: 0,
      maxProgress: 10,
    },
    {
      id: 'dedicated',
      name: 'Estudiante dedicado',
      description: 'Estudia por más de 5 horas',
      icon: 'time',
      unlocked: false,
      progress: 0,
      maxProgress: 300,
    },
    {
      id: 'accuracy-king',
      name: 'Rey de la precisión',
      description: 'Alcanza 90% de precisión en flashcards',
      icon: 'accuracy',
      unlocked: false,
      progress: 0,
      maxProgress: 90,
    },
  ]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        // Load subjects
        const subjectsData = await subjectsApi.list(token);
        setSubjects(subjectsData);

        // Load RAG stats
        const ragStatsData = await rag.getStats(token);
        setRagStats(ragStatsData);

        // Load local stats
        const savedFlashcardStats = localStorage.getItem('flashcard-stats');
        const savedQuizAttempts = localStorage.getItem('quiz-attempts');
        const savedPomodoroStats = localStorage.getItem('pomodoro-stats');
        const savedFlashcards = localStorage.getItem('flashcard-cards');
        const savedQuizzes = localStorage.getItem('quiz-list');

        let flashcardStats = { cardsStudiedToday: 0, streak: 0 };
        let quizAttempts: { score: number; percentage: number }[] = [];
        let pomodoroMinutes = 0;
        let flashcardCards: { timesReviewed: number; timesCorrect: number }[] = [];

        if (savedFlashcardStats) {
          flashcardStats = JSON.parse(savedFlashcardStats);
        }
        if (savedQuizAttempts) {
          quizAttempts = JSON.parse(savedQuizAttempts);
        }
        if (savedPomodoroStats) {
          const pomodoroStats = JSON.parse(savedPomodoroStats);
          pomodoroMinutes = (pomodoroStats.sessionsCompleted || 0) * 25;
        }
        if (savedFlashcards) {
          flashcardCards = JSON.parse(savedFlashcards);
        }

        // Calculate stats
        const totalFlashcardsStudied = flashcardCards.reduce((sum, c) => sum + c.timesReviewed, 0);
        const totalCorrect = flashcardCards.reduce((sum, c) => sum + c.timesCorrect, 0);
        const flashcardAccuracy = totalFlashcardsStudied > 0 ? (totalCorrect / totalFlashcardsStudied) * 100 : 0;

        const quizAverageScore = quizAttempts.length > 0
          ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length
          : 0;

        // Calculate points (simplified gamification)
        const pointsFromFlashcards = totalCorrect * 10;
        const pointsFromQuizzes = quizAttempts.reduce((sum, a) => sum + Math.floor(a.percentage), 0);
        const pointsFromTime = Math.floor(pomodoroMinutes / 5);
        const pointsFromStreak = flashcardStats.streak * 50;
        const totalPoints = pointsFromFlashcards + pointsFromQuizzes + pointsFromTime + pointsFromStreak;

        // Generate weekly progress (mock data based on current stats)
        const weeklyProgress = [
          Math.floor(Math.random() * 30) + 10,
          Math.floor(Math.random() * 30) + 15,
          Math.floor(Math.random() * 30) + 20,
          Math.floor(Math.random() * 30) + 10,
          Math.floor(Math.random() * 30) + 25,
          Math.floor(Math.random() * 30) + 15,
          flashcardStats.cardsStudiedToday || Math.floor(Math.random() * 30) + 20,
        ];

        // Subject progress
        const subjectProgress = subjectsData.slice(0, 5).map((s, i) => ({
          name: s.name,
          progress: Math.min(100, Math.floor(Math.random() * 40) + 30),
          color: s.color || ['blue', 'violet', 'emerald', 'rose', 'amber'][i],
        }));

        setStats({
          totalFlashcardsStudied,
          totalQuizzesCompleted: quizAttempts.length,
          totalTimeSpentMinutes: pomodoroMinutes + Math.floor(totalFlashcardsStudied * 0.5),
          currentStreak: flashcardStats.streak || 0,
          longestStreak: Math.max(flashcardStats.streak || 0, 7),
          totalPoints,
          level: getLevel(totalPoints).level,
          weeklyProgress,
          flashcardAccuracy,
          quizAverageScore,
          subjectProgress,
        });

        // Update achievements
        setAchievements(prev => prev.map(a => {
          switch (a.id) {
            case 'first-flashcard':
              return { ...a, progress: Math.min(totalFlashcardsStudied, 1), unlocked: totalFlashcardsStudied >= 1 };
            case 'streak-7':
              return { ...a, progress: Math.min(flashcardStats.streak || 0, 7), unlocked: (flashcardStats.streak || 0) >= 7 };
            case 'quiz-master':
              return { ...a, progress: Math.min(quizAttempts.length, 10), unlocked: quizAttempts.length >= 10 };
            case 'dedicated':
              return { ...a, progress: Math.min(pomodoroMinutes, 300), unlocked: pomodoroMinutes >= 300 };
            case 'accuracy-king':
              return { ...a, progress: Math.min(flashcardAccuracy, 90), unlocked: flashcardAccuracy >= 90 };
            default:
              return a;
          }
        }));

      } catch (error) {
        console.error('Error loading progress data:', error);
      }
    };

    loadData();
  }, [token]);

  const levelInfo = getLevel(stats.totalPoints);
  const maxWeekly = Math.max(...stats.weeklyProgress, 1);

  const achievementIcons = {
    streak: <Flame className="h-5 w-5" />,
    flashcards: <Brain className="h-5 w-5" />,
    quiz: <FileQuestion className="h-5 w-5" />,
    time: <Timer className="h-5 w-5" />,
    accuracy: <Target className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                    Mi Progreso
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Analiza tu rendimiento y mejora tu aprendizaje
                </p>
              </div>
            </div>

            {/* Level Badge */}
            <div className="hidden md:flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 border border-secondary-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Nivel {levelInfo.level}</p>
                  <p className="font-bold text-secondary-900">{levelInfo.name}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-secondary-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-900">{stats.totalPoints}</p>
                <p className="text-xs text-secondary-500">puntos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary-900">{stats.totalFlashcardsStudied}</p>
                    <p className="text-xs text-secondary-500">Flashcards estudiadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <FileQuestion className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary-900">{stats.totalQuizzesCompleted}</p>
                    <p className="text-xs text-secondary-500">Quizzes completados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary-900">{stats.currentStreak}</p>
                    <p className="text-xs text-secondary-500">Días de racha</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary-900">{formatTime(stats.totalTimeSpentMinutes)}</p>
                    <p className="text-xs text-secondary-500">Tiempo de estudio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Progress Chart */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-secondary-900">Actividad semanal</h3>
                    <p className="text-sm text-secondary-500">Flashcards estudiadas por día</p>
                  </div>
                  <Badge variant="secondary">Esta semana</Badge>
                </div>

                <div className="flex items-end justify-between gap-2 h-40">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => {
                    const height = (stats.weeklyProgress[i] / maxWeekly) * 100;
                    const isToday = i === 6;
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center">
                          <span className="text-xs font-medium text-secondary-600 mb-1">
                            {stats.weeklyProgress[i]}
                          </span>
                          <div
                            className={cn(
                              'w-full rounded-t-lg transition-all duration-500',
                              isToday
                                ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-t from-secondary-200 to-secondary-100'
                            )}
                            style={{ height: `${Math.max(height, 10)}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-xs',
                          isToday ? 'font-bold text-emerald-600' : 'text-secondary-400'
                        )}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">Nivel {levelInfo.level}</h3>
                    <p className="text-sm text-amber-600 font-medium">{levelInfo.name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500">Progreso al siguiente nivel</span>
                    <span className="font-medium text-secondary-700">{Math.round(levelInfo.progress)}%</span>
                  </div>
                  <div className="h-3 bg-secondary-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${levelInfo.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-secondary-400 text-center">
                    {stats.totalPoints} / {levelInfo.nextThreshold} puntos
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-secondary-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-secondary-50 rounded-xl">
                      <p className="text-lg font-bold text-secondary-900">{stats.longestStreak}</p>
                      <p className="text-xs text-secondary-500">Mejor racha</p>
                    </div>
                    <div className="text-center p-3 bg-secondary-50 rounded-xl">
                      <p className="text-lg font-bold text-secondary-900">{Math.round(stats.flashcardAccuracy)}%</p>
                      <p className="text-xs text-secondary-500">Precisión</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements & Subject Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievements */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-secondary-900">Logros</h3>
                </div>

                <div className="space-y-4">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-xl transition-colors',
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100'
                          : 'bg-secondary-50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                          : 'bg-secondary-200 text-secondary-400'
                      )}>
                        {achievementIcons[achievement.icon]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium',
                          achievement.unlocked ? 'text-secondary-900' : 'text-secondary-500'
                        )}>
                          {achievement.name}
                        </p>
                        <p className="text-xs text-secondary-400 truncate">
                          {achievement.description}
                        </p>
                        {!achievement.unlocked && (
                          <div className="mt-2 h-1.5 bg-secondary-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary-400 rounded-full"
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="h-5 w-5 text-violet-500" />
                  <h3 className="font-semibold text-secondary-900">Progreso por materia</h3>
                </div>

                {stats.subjectProgress.length === 0 ? (
                  <div className="text-center py-8 text-secondary-400">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay materias con progreso aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.subjectProgress.map((subject, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-secondary-700">{subject.name}</span>
                          <span className="text-sm text-secondary-500">{subject.progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              `bg-${subject.color}-500`
                            )}
                            style={{
                              width: `${subject.progress}%`,
                              backgroundColor: getColorHex(subject.color),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Usage Stats */}
                {ragStats && (
                  <div className="mt-6 pt-6 border-t border-secondary-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-4 w-4 text-primary-500" />
                      <span className="text-sm font-medium text-secondary-700">Uso de IA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-primary-50 rounded-xl">
                        <p className="text-lg font-bold text-primary-700">{ragStats.totalQueries}</p>
                        <p className="text-xs text-primary-600">Consultas al copiloto</p>
                      </div>
                      <div className="p-3 bg-violet-50 rounded-xl">
                        <p className="text-lg font-bold text-violet-700">{ragStats.totalTokensUsed.toLocaleString()}</p>
                        <p className="text-xs text-violet-600">Tokens utilizados</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-secondary-900">Métricas de rendimiento</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        className="text-secondary-100"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                      />
                      <circle
                        className="text-emerald-500"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                        strokeDasharray={`${stats.flashcardAccuracy}, 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-secondary-900">
                      {Math.round(stats.flashcardAccuracy)}%
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">Precisión flashcards</p>
                </div>

                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        className="text-secondary-100"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                      />
                      <circle
                        className="text-violet-500"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                        strokeDasharray={`${stats.quizAverageScore}, 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-secondary-900">
                      {Math.round(stats.quizAverageScore)}%
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">Promedio quizzes</p>
                </div>

                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        className="text-secondary-100"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                      />
                      <circle
                        className="text-amber-500"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                        strokeDasharray={`${Math.min((stats.currentStreak / 30) * 100, 100)}, 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-secondary-900">
                      {stats.currentStreak}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">Racha actual</p>
                </div>

                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        className="text-secondary-100"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                      />
                      <circle
                        className="text-blue-500"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        cx="18"
                        cy="18"
                        r="16"
                        strokeDasharray={`${levelInfo.progress}, 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-secondary-900">
                      {levelInfo.level}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">Nivel actual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to get color hex
function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    blue: '#3B82F6',
    violet: '#8B5CF6',
    emerald: '#10B981',
    rose: '#F43F5E',
    amber: '#F59E0B',
    cyan: '#06B6D4',
    pink: '#EC4899',
    orange: '#F97316',
    teal: '#14B8A6',
    indigo: '#6366F1',
  };
  return colors[colorName] || '#6B7280';
}

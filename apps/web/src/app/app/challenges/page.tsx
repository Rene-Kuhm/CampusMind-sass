'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import api, { GamificationProfile } from '@/lib/api';
import {
  Flame,
  Clock,
  Brain,
  ClipboardCheck,
  Users,
  Trophy,
  Zap,
  Gift,
  Check,
  Timer,
  Star,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Challenge,
  getDailyChallenges,
  getDailyProgress,
  updateChallengeProgress,
  getTimeUntilReset,
  areAllChallengesCompleted,
  getTotalXpAvailable,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  TYPE_COLORS,
} from '@/lib/daily-challenges';

const CHALLENGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  'clipboard-check': ClipboardCheck,
  clock: Clock,
  flame: Flame,
  users: Users,
};

export default function DailyChallengesPage() {
  const { token } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [localProgress, setLocalProgress] = useState(getDailyProgress());
  const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [allCompleted, setAllCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load gamification profile from API
  const loadGamificationData = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await api.gamificationApi.getProfile(token);
      setGamificationProfile(profile);
      // Update streak on load
      await api.gamificationApi.updateStreak(token);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setChallenges(getDailyChallenges());
      setLocalProgress(getDailyProgress());
      setTimeUntilReset(getTimeUntilReset());
      setAllCompleted(areAllChallengesCompleted());
      await loadGamificationData();
      setIsLoading(false);
    };

    loadData();

    // Update timer every minute
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 60000);

    return () => clearInterval(interval);
  }, [loadGamificationData]);

  // Complete a challenge (demo mode)
  const handleCompleteChallenge = async (challenge: Challenge) => {
    if (challenge.completed) return;

    const updated = updateChallengeProgress(challenge.id, challenge.requirement);
    if (updated) {
      setChallenges(getDailyChallenges());
      setLocalProgress(getDailyProgress());
      setAllCompleted(areAllChallengesCompleted());

      // Check for new achievements
      if (token) {
        try {
          await api.gamificationApi.checkAchievements(token);
          // Reload profile to get updated XP
          const profile = await api.gamificationApi.getProfile(token);
          setGamificationProfile(profile);
        } catch (error) {
          console.error('Error checking achievements:', error);
        }
      }
    }
  };

  const totalXp = getTotalXpAvailable();
  const completedCount = challenges.filter(c => c.completed).length;
  const currentStreak = gamificationProfile?.currentStreak || localProgress.streak;
  const totalXpEarned = gamificationProfile?.totalXP || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Retos Diarios
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400">
              Completa retos para ganar XP y mantener tu racha
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl">
            <Timer className="h-5 w-5 text-secondary-500" />
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Se reinicia en {timeUntilReset}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Daily Progress */}
        <div className="bg-white dark:bg-secondary-900 rounded-2xl p-6 border border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900 dark:text-white">Progreso de Hoy</h3>
            <span className="text-2xl font-bold text-primary-500">
              {completedCount}/{challenges.length}
            </span>
          </div>
          <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full transition-all"
              style={{ width: `${(completedCount / challenges.length) * 100}%` }}
            />
          </div>
          {allCompleted && (
            <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">Todos completados!</span>
            </div>
          )}
        </div>

        {/* XP Earned */}
        <div className="bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-6 w-6 text-amber-300" />
            <h3 className="font-semibold">XP Total</h3>
          </div>
          <p className="text-4xl font-bold">{totalXpEarned.toLocaleString()}</p>
          <p className="text-sm text-white/70 mt-1">
            +{localProgress.xpEarned} XP hoy de {totalXp} disponibles
          </p>
        </div>

        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="h-6 w-6 text-amber-300" />
            <h3 className="font-semibold">Racha de Retos</h3>
          </div>
          <p className="text-4xl font-bold">{currentStreak} dias</p>
          <p className="text-sm text-white/70 mt-1">
            {gamificationProfile?.longestStreak
              ? `Mejor racha: ${gamificationProfile.longestStreak} dias`
              : 'Sigue asi!'}
          </p>
        </div>
      </div>

      {/* All Completed Celebration */}
      {allCompleted && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-amber-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200">
                Felicidades!
              </h2>
              <p className="text-amber-700 dark:text-amber-300">
                Has completado todos los retos de hoy. Vuelve manana para nuevos desafios!
              </p>
            </div>
            <div className="ml-auto">
              <Gift className="h-12 w-12 text-amber-500 animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Challenge Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white">
          Retos de Hoy
        </h2>

        {challenges.map((challenge) => {
          const Icon = CHALLENGE_ICONS[challenge.icon] || Zap;
          const progressPercent = (challenge.progress / challenge.requirement) * 100;

          return (
            <div
              key={challenge.id}
              className={cn(
                'bg-white dark:bg-secondary-900 rounded-2xl p-6 border transition-all',
                challenge.completed
                  ? 'border-green-500 dark:border-green-600'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-500'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                  challenge.completed
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : `bg-gradient-to-br ${TYPE_COLORS[challenge.type]}`
                )}>
                  {challenge.completed ? (
                    <Check className="h-7 w-7 text-green-600 dark:text-green-400" />
                  ) : (
                    <Icon className="h-7 w-7 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={cn(
                        'font-semibold',
                        challenge.completed
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-secondary-900 dark:text-white'
                      )}>
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        {challenge.description}
                      </p>
                    </div>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      DIFFICULTY_COLORS[challenge.difficulty]
                    )}>
                      {DIFFICULTY_LABELS[challenge.difficulty]}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-secondary-500 dark:text-secondary-400">
                        Progreso: {challenge.progress}/{challenge.requirement}
                      </span>
                      <span className={cn(
                        'font-bold flex items-center gap-1',
                        challenge.completed ? 'text-green-500' : 'text-primary-500'
                      )}>
                        <Zap className="h-4 w-4" />
                        +{challenge.xpReward} XP
                      </span>
                    </div>
                    <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          challenge.completed
                            ? 'bg-green-500'
                            : `bg-gradient-to-r ${TYPE_COLORS[challenge.type]}`
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Demo Complete Button */}
                  {!challenge.completed && (
                    <button
                      onClick={() => handleCompleteChallenge(challenge)}
                      className="mt-4 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Completar (Demo)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* XP Info */}
      <div className="mt-8 bg-secondary-50 dark:bg-secondary-800 rounded-2xl p-6">
        <h3 className="font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Como funcionan los retos
        </h3>
        <ul className="space-y-3 text-sm text-secondary-600 dark:text-secondary-400">
          <li className="flex items-start gap-2">
            <span className="text-primary-500">-</span>
            Cada dia recibes 5 nuevos retos para completar
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">-</span>
            Los retos se reinician a medianoche
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">-</span>
            Completa retos para ganar XP y subir en el ranking
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">-</span>
            Manten tu racha completando al menos un reto cada dia
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">-</span>
            Los retos dificiles dan mas XP pero requieren mas esfuerzo
          </li>
        </ul>
      </div>
    </div>
  );
}

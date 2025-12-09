'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import api, { LeaderboardEntry, GamificationProfile, UserRank } from '@/lib/api';
import {
  Trophy,
  Medal,
  Flame,
  Clock,
  Brain,
  ClipboardCheck,
  Minus,
  Crown,
  Zap,
  Star,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type LeaderboardType = 'xp' | 'points' | 'streak';

const TYPE_LABELS: Record<LeaderboardType, string> = {
  xp: 'XP Total',
  points: 'Puntos',
  streak: 'Racha',
};

function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

function getLevelProgress(xp: number): { current: number; next: number; progress: number } {
  const level = getLevelFromXP(xp);
  const currentLevelXP = (level - 1) * 1000;
  const nextLevelXP = level * 1000;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return { current: currentLevelXP, next: nextLevelXP, progress };
}

function getLevelTitle(level: number): string {
  if (level >= 50) return 'Leyenda';
  if (level >= 40) return 'Gran Maestro';
  if (level >= 30) return 'Maestro';
  if (level >= 20) return 'Experto';
  if (level >= 10) return 'Avanzado';
  if (level >= 5) return 'Intermedio';
  return 'Principiante';
}

export default function LeaderboardPage() {
  const { token, user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('points');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [leaderboardData, profileData, rankData] = await Promise.all([
        api.gamificationApi.getLeaderboard(token, leaderboardType, 50),
        api.gamificationApi.getProfile(token),
        api.gamificationApi.getUserRank(token),
      ]);
      setLeaderboard(leaderboardData);
      setProfile(profileData);
      setUserRank(rankData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, leaderboardType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topUsers = leaderboard.slice(0, 3);
  const currentUserLevel = profile ? getLevelFromXP(profile.totalXP) : 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Tabla de Clasificacion
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          Compite con otros estudiantes y sube de nivel
        </p>
      </div>

      {/* Your Stats Card */}
      {profile && userRank && (
        <div className="bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-3xl font-bold">#{userRank.rank}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-900" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </h2>
                <p className="text-white/80">
                  Nivel {currentUserLevel} - {getLevelTitle(currentUserLevel)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="font-medium">{profile.currentStreak} dias de racha</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{profile.totalXP.toLocaleString()}</p>
                <p className="text-xs text-white/70">XP Total</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{userRank.percentile}%</p>
                <p className="text-xs text-white/70">Percentil</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{profile.totalPoints}</p>
                <p className="text-xs text-white/70">Puntos</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{profile.achievements?.length || 0}</p>
                <p className="text-xs text-white/70">Logros</p>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso al nivel {currentUserLevel + 1}</span>
              <span>{profile.xpToNextLevel} XP restantes</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${getLevelProgress(profile.totalXP).progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Podium - Top 3 */}
      {topUsers.length >= 3 && (
        <div className="flex justify-center items-end gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl font-bold text-white">
                {topUsers[1]?.user?.profile?.firstName?.[0] || '2'}
              </span>
            </div>
            <div className="bg-white dark:bg-secondary-800 rounded-t-xl px-6 py-8 text-center border border-secondary-200 dark:border-secondary-700 shadow-lg">
              <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-bold text-secondary-900 dark:text-white truncate max-w-[100px]">
                {topUsers[1]?.user?.profile?.firstName || 'Usuario'}
              </p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {topUsers[1]?.value?.toLocaleString()} {leaderboardType === 'streak' ? 'dias' : 'pts'}
              </p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-8">
            <div className="relative">
              <Crown className="h-8 w-8 text-amber-400 absolute -top-8 left-1/2 -translate-x-1/2" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center mb-2 shadow-xl ring-4 ring-amber-200 dark:ring-amber-900">
                <span className="text-3xl font-bold text-white">
                  {topUsers[0]?.user?.profile?.firstName?.[0] || '1'}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-t-xl px-8 py-10 text-center border border-amber-200 dark:border-amber-700 shadow-xl">
              <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-secondary-900 dark:text-white truncate max-w-[120px]">
                {topUsers[0]?.user?.profile?.firstName || 'Usuario'}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {topUsers[0]?.value?.toLocaleString()} {leaderboardType === 'streak' ? 'dias' : 'pts'}
              </p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl font-bold text-white">
                {topUsers[2]?.user?.profile?.firstName?.[0] || '3'}
              </span>
            </div>
            <div className="bg-white dark:bg-secondary-800 rounded-t-xl px-6 py-8 text-center border border-secondary-200 dark:border-secondary-700 shadow-lg">
              <Medal className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <p className="font-bold text-secondary-900 dark:text-white truncate max-w-[100px]">
                {topUsers[2]?.user?.profile?.firstName || 'Usuario'}
              </p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {topUsers[2]?.value?.toLocaleString()} {leaderboardType === 'streak' ? 'dias' : 'pts'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(TYPE_LABELS) as LeaderboardType[]).map((type) => (
          <button
            key={type}
            onClick={() => setLeaderboardType(type)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
              leaderboardType === type
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700'
            )}
          >
            {type === 'xp' && <Zap className="h-4 w-4" />}
            {type === 'points' && <Star className="h-4 w-4" />}
            {type === 'streak' && <Flame className="h-4 w-4" />}
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-lg overflow-hidden border border-secondary-200 dark:border-secondary-700">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 text-sm font-semibold text-secondary-500 dark:text-secondary-400">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Usuario</div>
          <div className="col-span-3 text-center">Valor</div>
          <div className="col-span-3 text-center">Nivel</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
          {leaderboard.length === 0 ? (
            <div className="px-6 py-12 text-center text-secondary-500">
              No hay datos en el leaderboard todavia
            </div>
          ) : (
            leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === user?.id;
              const entryLevel = getLevelFromXP(entry.value * (leaderboardType === 'xp' ? 1 : 10));

              return (
                <div
                  key={entry.userId}
                  className={cn(
                    'grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors',
                    isCurrentUser
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  )}
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    <span className={cn(
                      'font-bold text-lg',
                      entry.rank === 1 && 'text-amber-500',
                      entry.rank === 2 && 'text-gray-400',
                      entry.rank === 3 && 'text-orange-400',
                      entry.rank > 3 && 'text-secondary-500 dark:text-secondary-400'
                    )}>
                      {entry.rank}
                    </span>
                  </div>

                  {/* User */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white',
                      entry.rank === 1 && 'bg-gradient-to-br from-amber-300 to-amber-500',
                      entry.rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400',
                      entry.rank === 3 && 'bg-gradient-to-br from-orange-300 to-orange-500',
                      entry.rank > 3 && 'bg-gradient-to-br from-primary-500 to-violet-500'
                    )}>
                      {entry.user?.profile?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className={cn(
                        'font-medium',
                        isCurrentUser ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-900 dark:text-white'
                      )}>
                        {entry.user?.profile?.firstName} {entry.user?.profile?.lastName}
                        {isCurrentUser && <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">Tu</span>}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        {getLevelTitle(entryLevel)}
                      </p>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="col-span-3 text-center">
                    <span className="font-bold text-secondary-900 dark:text-white">
                      {entry.value.toLocaleString()}
                    </span>
                    <span className="text-secondary-400 text-sm ml-1">
                      {leaderboardType === 'streak' ? 'dias' : leaderboardType === 'xp' ? 'XP' : 'pts'}
                    </span>
                  </div>

                  {/* Level */}
                  <div className="col-span-3 text-center">
                    <span className="font-bold text-secondary-900 dark:text-white">
                      Nivel {entryLevel}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* How to earn XP */}
      <div className="mt-8 bg-white dark:bg-secondary-900 rounded-2xl p-6 border border-secondary-200 dark:border-secondary-700">
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">
          Como ganar XP
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: 'Revisar flashcard', xp: '+5 XP', color: 'from-pink-500 to-rose-500' },
            { icon: ClipboardCheck, label: 'Completar quiz', xp: '+50 XP', color: 'from-indigo-500 to-purple-500' },
            { icon: Clock, label: '30 min de estudio', xp: '+25 XP', color: 'from-cyan-500 to-blue-500' },
            { icon: Flame, label: 'Mantener racha', xp: '+10 XP/dia', color: 'from-orange-500 to-red-500' },
          ].map(({ icon: Icon, label, xp, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-white">
                  {label}
                </p>
                <p className="text-sm text-primary-500 font-bold">{xp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

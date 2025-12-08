'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Flame,
  Clock,
  Brain,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Zap,
  Star,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LeaderboardUser,
  UserStats,
  TimeFilter,
  CategoryFilter,
  getLeaderboard,
  getCurrentUserStats,
  getTopUsers,
  getLevelProgress,
  getLevelTitle,
  CATEGORY_LABELS,
  TIME_FILTER_LABELS,
} from '@/lib/leaderboard';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('overall');
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    setUsers(getLeaderboard(timeFilter, categoryFilter));
    setUserStats(getCurrentUserStats());
    setTopUsers(getTopUsers(categoryFilter));
  }, [timeFilter, categoryFilter]);

  const currentUser = users.find(u => u.id === 'current-user');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Tabla de Clasificación
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          Compite con otros estudiantes y sube de nivel
        </p>
      </div>

      {/* Your Stats Card */}
      {userStats && currentUser && (
        <div className="bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-3xl font-bold">#{userStats.rank}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-900" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                <p className="text-white/80">
                  Nivel {currentUser.level} • {getLevelTitle(currentUser.level)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="font-medium">{currentUser.streak} días de racha</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{currentUser.xp.toLocaleString()}</p>
                <p className="text-xs text-white/70">XP Total</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{userStats.percentile}%</p>
                <p className="text-xs text-white/70">Percentil</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{currentUser.studyHours}h</p>
                <p className="text-xs text-white/70">Estudiadas</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{currentUser.achievements}</p>
                <p className="text-xs text-white/70">Logros</p>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso al nivel {currentUser.level + 1}</span>
              <span>{userStats.xpToNextRank} XP para subir de puesto</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${getLevelProgress(currentUser.xp).progress}%` }}
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
              <span className="text-2xl font-bold text-white">{topUsers[1].name[0]}</span>
            </div>
            <div className="bg-white dark:bg-secondary-800 rounded-t-xl px-6 py-8 text-center border border-secondary-200 dark:border-secondary-700 shadow-lg">
              <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-bold text-secondary-900 dark:text-white truncate max-w-[100px]">
                {topUsers[1].name}
              </p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {topUsers[1].xp.toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-8">
            <div className="relative">
              <Crown className="h-8 w-8 text-amber-400 absolute -top-8 left-1/2 -translate-x-1/2" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center mb-2 shadow-xl ring-4 ring-amber-200 dark:ring-amber-900">
                <span className="text-3xl font-bold text-white">{topUsers[0].name[0]}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-t-xl px-8 py-10 text-center border border-amber-200 dark:border-amber-700 shadow-xl">
              <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-secondary-900 dark:text-white truncate max-w-[120px]">
                {topUsers[0].name}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {topUsers[0].xp.toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl font-bold text-white">{topUsers[2].name[0]}</span>
            </div>
            <div className="bg-white dark:bg-secondary-800 rounded-t-xl px-6 py-8 text-center border border-secondary-200 dark:border-secondary-700 shadow-lg">
              <Medal className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <p className="font-bold text-secondary-900 dark:text-white truncate max-w-[100px]">
                {topUsers[2].name}
              </p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {topUsers[2].xp.toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Time Filter */}
        <div className="flex gap-2">
          {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                timeFilter === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              )}
            >
              {TIME_FILTER_LABELS[filter]}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setCategoryFilter(filter)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
                categoryFilter === filter
                  ? 'bg-violet-500 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              )}
            >
              {filter === 'flashcards' && <Brain className="h-4 w-4" />}
              {filter === 'quizzes' && <ClipboardCheck className="h-4 w-4" />}
              {filter === 'studyTime' && <Clock className="h-4 w-4" />}
              {filter === 'streak' && <Flame className="h-4 w-4" />}
              {filter === 'overall' && <Zap className="h-4 w-4" />}
              {CATEGORY_LABELS[filter]}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-lg overflow-hidden border border-secondary-200 dark:border-secondary-700">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 text-sm font-semibold text-secondary-500 dark:text-secondary-400">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Usuario</div>
          <div className="col-span-2 text-center">Nivel</div>
          <div className="col-span-2 text-center">XP</div>
          <div className="col-span-2 text-center">Racha</div>
          <div className="col-span-1 text-center">Cambio</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
          {users.map((user) => {
            const isCurrentUser = user.id === 'current-user';
            const levelProgress = getLevelProgress(user.xp);

            return (
              <div
                key={user.id}
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
                    user.rank === 1 && 'text-amber-500',
                    user.rank === 2 && 'text-gray-400',
                    user.rank === 3 && 'text-orange-400',
                    user.rank > 3 && 'text-secondary-500 dark:text-secondary-400'
                  )}>
                    {user.rank}
                  </span>
                </div>

                {/* User */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white',
                    user.rank === 1 && 'bg-gradient-to-br from-amber-300 to-amber-500',
                    user.rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400',
                    user.rank === 3 && 'bg-gradient-to-br from-orange-300 to-orange-500',
                    user.rank > 3 && 'bg-gradient-to-br from-primary-500 to-violet-500'
                  )}>
                    {user.name[0]}
                  </div>
                  <div>
                    <p className={cn(
                      'font-medium',
                      isCurrentUser ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-900 dark:text-white'
                    )}>
                      {user.name}
                      {isCurrentUser && <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">Tú</span>}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {getLevelTitle(user.level)}
                    </p>
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-2 text-center">
                  <div className="inline-flex items-center gap-2">
                    <span className="font-bold text-secondary-900 dark:text-white">
                      {user.level}
                    </span>
                    <div className="w-16 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${levelProgress.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* XP */}
                <div className="col-span-2 text-center">
                  <span className="font-bold text-secondary-900 dark:text-white">
                    {user.xp.toLocaleString()}
                  </span>
                  <span className="text-secondary-400 text-sm ml-1">XP</span>
                </div>

                {/* Streak */}
                <div className="col-span-2 text-center">
                  <div className="inline-flex items-center gap-1">
                    <Flame className={cn(
                      'h-5 w-5',
                      user.streak >= 7 ? 'text-orange-500' : 'text-secondary-400'
                    )} />
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {user.streak}
                    </span>
                  </div>
                </div>

                {/* Change */}
                <div className="col-span-1 text-center">
                  {user.change === 'up' && (
                    <div className="inline-flex items-center text-green-500">
                      <ChevronUp className="h-5 w-5" />
                      <span className="text-sm">{user.changeAmount}</span>
                    </div>
                  )}
                  {user.change === 'down' && (
                    <div className="inline-flex items-center text-red-500">
                      <ChevronDown className="h-5 w-5" />
                      <span className="text-sm">{user.changeAmount}</span>
                    </div>
                  )}
                  {user.change === 'same' && (
                    <Minus className="h-5 w-5 text-secondary-400 mx-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to earn XP */}
      <div className="mt-8 bg-white dark:bg-secondary-900 rounded-2xl p-6 border border-secondary-200 dark:border-secondary-700">
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">
          Cómo ganar XP
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: 'Revisar flashcard', xp: '+5 XP', color: 'from-pink-500 to-rose-500' },
            { icon: ClipboardCheck, label: 'Completar quiz', xp: '+50 XP', color: 'from-indigo-500 to-purple-500' },
            { icon: Clock, label: '30 min de estudio', xp: '+25 XP', color: 'from-cyan-500 to-blue-500' },
            { icon: Flame, label: 'Mantener racha', xp: '+10 XP/día', color: 'from-orange-500 to-red-500' },
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

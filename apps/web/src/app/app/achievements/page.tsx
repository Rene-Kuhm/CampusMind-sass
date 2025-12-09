'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import api, { Achievement as ApiAchievement, UserAchievement, GamificationProfile } from '@/lib/api';
import {
  Trophy,
  Star,
  Flame,
  Users,
  BookOpen,
  Sparkles,
  Lock,
  CheckCircle,
  Clock,
  Award,
  GraduationCap,
  Brain,
  Share,
  MessageCircle,
  Moon,
  Sunrise,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  Achievement as LocalAchievement,
  UserAchievements,
  getUserAchievements,
  ALL_ACHIEVEMENTS,
  RARITY_COLORS,
  RARITY_LABELS,
  CATEGORY_LABELS,
} from '@/lib/achievements';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  'clipboard-check': BookOpen,
  star: Star,
  clock: Clock,
  flame: Flame,
  share: Share,
  users: Users,
  'users-plus': Users,
  'message-circle': MessageCircle,
  award: Award,
  'graduation-cap': GraduationCap,
  sunrise: Sunrise,
  moon: Moon,
  calendar: Calendar,
  sparkles: Sparkles,
};

export default function AchievementsPage() {
  const { token } = useAuth();
  const [userAchievements, setUserAchievements] = useState<UserAchievements>({
    unlocked: [],
    inProgress: [],
    totalXpEarned: 0,
  });
  const [apiAchievements, setApiAchievements] = useState<{ all: ApiAchievement[]; unlocked: UserAchievement[] } | null>(null);
  const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  // Load gamification data from API
  const loadGamificationData = useCallback(async () => {
    if (!token) return;
    try {
      const [profile, achievements] = await Promise.all([
        api.gamificationApi.getProfile(token),
        api.gamificationApi.getAllAchievements(token),
      ]);
      setGamificationProfile(profile);
      setApiAchievements(achievements);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Load local achievements as fallback
      setUserAchievements(getUserAchievements());
      // Load API achievements
      await loadGamificationData();
      setIsLoading(false);
    };
    loadData();
  }, [loadGamificationData]);

  const categories = ['all', 'study', 'streak', 'social', 'mastery', 'special'] as const;
  const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

  // Use API data if available, otherwise fallback to local
  const unlockedIds = apiAchievements
    ? new Set(apiAchievements.unlocked.map(a => a.achievementId))
    : new Set(userAchievements.unlocked.map(a => a.id));
  const inProgressMap = new Map(userAchievements.inProgress.map(a => [a.id, a]));

  const filteredAchievements = ALL_ACHIEVEMENTS.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;
    if (selectedRarity !== 'all' && achievement.rarity !== selectedRarity) return false;
    return true;
  });

  // Use API counts if available
  const totalAchievements = apiAchievements ? apiAchievements.all.length : ALL_ACHIEVEMENTS.length;
  const unlockedCount = apiAchievements ? apiAchievements.unlocked.length : userAchievements.unlocked.length;
  const completionPercentage = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  // Use API XP data if available
  const totalXpEarned = gamificationProfile?.totalXP || userAchievements.totalXpEarned;
  const totalPossibleXp = apiAchievements
    ? apiAchievements.all.reduce((sum, a) => sum + a.xpReward, 0)
    : ALL_ACHIEVEMENTS.reduce((sum, a) => sum + a.xpReward, 0);

  const getAchievementStatus = (id: string): 'unlocked' | 'in_progress' | 'locked' => {
    if (unlockedIds.has(id)) return 'unlocked';
    if (inProgressMap.has(id)) return 'in_progress';
    return 'locked';
  };

  const getProgress = (id: string): number => {
    const inProgress = inProgressMap.get(id);
    return inProgress?.progress || 0;
  };

  const renderIcon = (iconName: string, className: string) => {
    const IconComponent = ICON_MAP[iconName] || Trophy;
    return <IconComponent className={className} />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            Logros
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Desbloquea logros completando retos y gana XP extra
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Desbloqueados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unlockedCount}/{totalAchievements}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completionPercentage}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">XP Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalXpEarned.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">XP Disponible</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.max(0, totalPossibleXp - totalXpEarned).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progreso General
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {unlockedCount} de {totalAchievements} logros
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rareza
            </label>
            <div className="flex flex-wrap gap-2">
              {rarities.map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRarity === rarity
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {rarity === 'all' ? 'Todas' : RARITY_LABELS[rarity as keyof typeof RARITY_LABELS]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => {
            const status = getAchievementStatus(achievement.id);
            const progress = getProgress(achievement.id);
            const progressPercentage = Math.min(100, (progress / achievement.requirement.value) * 100);
            const unlockedAchievement = userAchievements.unlocked.find(a => a.id === achievement.id);

            return (
              <div
                key={achievement.id}
                className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm transition-all duration-300 ${
                  status === 'locked' ? 'opacity-60' : ''
                } ${status === 'unlocked' ? 'ring-2 ring-amber-400' : ''}`}
              >
                {/* Rarity Badge */}
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${RARITY_COLORS[achievement.rarity]} text-white`}>
                  {RARITY_LABELS[achievement.rarity]}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  status === 'unlocked'
                    ? `bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}`
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {status === 'locked' ? (
                    <Lock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  ) : (
                    renderIcon(achievement.icon, 'h-8 w-8 text-white')
                  )}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {achievement.description}
                </p>

                {/* XP Reward */}
                <div className="flex items-center gap-2 text-sm text-amber-500 mb-4">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">+{achievement.xpReward} XP</span>
                </div>

                {/* Status */}
                {status === 'unlocked' && unlockedAchievement?.unlockedAt && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <span>Desbloqueado el {new Date(unlockedAchievement.unlockedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {status === 'in_progress' && (
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progreso</span>
                      <span>{progress} / {achievement.requirement.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {status === 'locked' && (
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Bloqueado
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay logros con estos filtros
            </p>
          </div>
        )}

        {/* Recently Unlocked Section */}
        {userAchievements.unlocked.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Logros Recientes
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {userAchievements.unlocked
                .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
                .slice(0, 5)
                .map(achievement => (
                  <div
                    key={achievement.id}
                    className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 border-amber-400"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}`}>
                      {renderIcon(achievement.icon, 'h-6 w-6 text-white')}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(achievement.unlockedAt!).toLocaleDateString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

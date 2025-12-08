'use client';

import { useState, useRef } from 'react';
import {
  User,
  Camera,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Trophy,
  Flame,
  Clock,
  Brain,
  BookOpen,
  Edit2,
  Check,
  X,
  Upload,
  Shield,
  Bell,
  Eye,
  Moon,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  university: string;
  major: string;
  semester: string;
  bio: string;
  avatar: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: user?.profile?.firstName || 'Usuario',
    lastName: user?.profile?.lastName || '',
    email: user?.email || 'usuario@email.com',
    phone: '+52 555 123 4567',
    location: 'Ciudad de México, México',
    university: 'Universidad Nacional',
    major: 'Ingeniería en Sistemas',
    semester: '6to Semestre',
    bio: 'Estudiante apasionado por la tecnología y el aprendizaje continuo.',
    avatar: '',
  });

  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);

  // Stats data
  const stats = {
    level: 7,
    xp: 6500,
    streak: 15,
    studyHours: 120,
    flashcardsReviewed: 450,
    quizzesCompleted: 25,
    achievements: 12,
    rank: 16,
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfile(prev => ({ ...prev, avatar: result }));
        setEditedProfile(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // In production, save to API
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Mi Perfil
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          Administra tu información personal y preferencias
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-lg overflow-hidden border border-secondary-200 dark:border-secondary-700 mb-8">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-primary-500 via-violet-500 to-purple-500" />

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative">
              <div
                onClick={handleAvatarClick}
                className="w-24 h-24 rounded-2xl bg-white dark:bg-secondary-800 border-4 border-white dark:border-secondary-900 shadow-lg overflow-hidden cursor-pointer group"
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {profile.firstName[0]}{profile.lastName?.[0] || ''}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Name & Level */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-primary-500 font-medium">
                  <Trophy className="h-4 w-4" />
                  Nivel {stats.level}
                </span>
                <span className="flex items-center gap-1 text-orange-500 font-medium">
                  <Flame className="h-4 w-4" />
                  {stats.streak} días
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 font-medium hover:bg-secondary-200 dark:hover:bg-secondary-700 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Guardar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar perfil
                </button>
              )}
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Progreso al nivel {stats.level + 1}
              </span>
              <span className="text-sm text-secondary-500">
                {stats.xp} / {(stats.level + 1) * 1000} XP
              </span>
            </div>
            <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full"
                style={{ width: `${(stats.xp % 1000) / 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-secondary-900 rounded-2xl p-6 border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              Información Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  Nombre
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.firstName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {profile.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  Apellido
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.lastName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {profile.lastName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <p className="font-medium text-secondary-900 dark:text-white">
                  {profile.email}
                </p>
              </div>

              <div>
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {profile.phone}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Ubicación
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.location}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {profile.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white dark:bg-secondary-900 rounded-2xl p-6 border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary-500" />
              Información Académica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  Universidad
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.university}
                    onChange={(e) => setEditedProfile({ ...editedProfile, university: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {profile.university}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  Carrera
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.major}
                    onChange={(e) => setEditedProfile({ ...editedProfile, major: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {profile.major}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  Semestre
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.semester}
                    onChange={(e) => setEditedProfile({ ...editedProfile, semester: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {profile.semester}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              ) : (
                <p className="text-secondary-700 dark:text-secondary-300">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Quick Actions */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white dark:bg-secondary-900 rounded-2xl p-6 border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Estadísticas
            </h3>

            <div className="space-y-4">
              {[
                { icon: Clock, label: 'Horas de estudio', value: `${stats.studyHours}h`, color: 'text-cyan-500' },
                { icon: Brain, label: 'Flashcards revisadas', value: stats.flashcardsReviewed, color: 'text-pink-500' },
                { icon: BookOpen, label: 'Quizzes completados', value: stats.quizzesCompleted, color: 'text-purple-500' },
                { icon: Trophy, label: 'Logros desbloqueados', value: stats.achievements, color: 'text-amber-500' },
                { icon: Calendar, label: 'Ranking global', value: `#${stats.rank}`, color: 'text-green-500' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5', color)} />
                    <span className="text-secondary-600 dark:text-secondary-400">{label}</span>
                  </div>
                  <span className="font-bold text-secondary-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Settings */}
          <div className="bg-white dark:bg-secondary-900 rounded-2xl p-6 border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Ajustes Rápidos
            </h3>

            <div className="space-y-3">
              {[
                { icon: Bell, label: 'Notificaciones', href: '/app/settings#notifications' },
                { icon: Shield, label: 'Seguridad', href: '/app/settings#security' },
                { icon: Eye, label: 'Privacidad', href: '/app/settings#privacy' },
                { icon: Moon, label: 'Apariencia', href: '/app/settings#appearance' },
                { icon: Globe, label: 'Idioma', href: '/app/settings#language' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                >
                  <Icon className="h-5 w-5 text-secondary-400" />
                  <span className="text-secondary-700 dark:text-secondary-300">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

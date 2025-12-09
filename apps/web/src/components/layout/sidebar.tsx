'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Brain,
  CreditCard,
  Zap,
  Library,
  Timer,
  GitBranch,
  ClipboardCheck,
  BarChart3,
  StickyNote,
  Users,
  Trophy,
  Target,
  CheckSquare,
  Bell,
  Briefcase,
  PenTool,
  Braces,
  GraduationCap as Grades,
  Mic,
  Heart,
  TrendingUp,
  FileText,
  Upload,
  Award,
  MessageCircle,
  ScanLine,
  Video,
  CalendarDays,
  BookMarked,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    exact: true,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Materias',
    href: '/app/subjects',
    icon: BookOpen,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Copiloto IA',
    href: '/app/copilot',
    icon: Sparkles,
    gradient: 'from-primary-500 to-violet-500',
    badge: 'IA',
  },
  {
    name: 'Buscar',
    href: '/app/search',
    icon: Search,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Biblioteca',
    href: '/app/library',
    icon: Library,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Calendario',
    href: '/app/calendar',
    icon: Calendar,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    name: 'Tareas',
    href: '/app/tasks',
    icon: CheckSquare,
    gradient: 'from-teal-500 to-emerald-500',
  },
  {
    name: 'Notas',
    href: '/app/notes',
    icon: StickyNote,
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    name: 'Flashcards',
    href: '/app/flashcards',
    icon: Brain,
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Mapas Mentales',
    href: '/app/mindmaps',
    icon: GitBranch,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Temporizador',
    href: '/app/timer',
    icon: Timer,
    gradient: 'from-rose-500 to-orange-500',
  },
  {
    name: 'Quiz',
    href: '/app/quiz',
    icon: ClipboardCheck,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Mi Progreso',
    href: '/app/progress',
    icon: BarChart3,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Analíticas',
    href: '/app/analytics',
    icon: TrendingUp,
    gradient: 'from-blue-500 to-purple-500',
    badge: 'Nuevo',
  },
  {
    name: 'Metas',
    href: '/app/goals',
    icon: Target,
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    name: 'Grupos',
    href: '/app/groups',
    icon: Users,
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    name: 'Social',
    href: '/app/social',
    icon: Users,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Clasificación',
    href: '/app/leaderboard',
    icon: Trophy,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Retos Diarios',
    href: '/app/challenges',
    icon: Target,
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    name: 'Calificaciones',
    href: '/app/grades',
    icon: Grades,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Grabaciones',
    href: '/app/recordings',
    icon: Mic,
    gradient: 'from-red-500 to-rose-500',
  },
  {
    name: 'Bienestar',
    href: '/app/wellness',
    icon: Heart,
    gradient: 'from-pink-500 to-red-500',
  },
  {
    name: 'Carrera',
    href: '/app/career',
    icon: Briefcase,
    gradient: 'from-slate-500 to-gray-600',
  },
  {
    name: 'Herramientas',
    href: '/app/tools',
    icon: Braces,
    gradient: 'from-gray-500 to-slate-500',
  },
  {
    name: 'Escritura',
    href: '/app/writing',
    icon: PenTool,
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'Notificaciones',
    href: '/app/notifications',
    icon: Bell,
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    name: 'Logros',
    href: '/app/achievements',
    icon: Award,
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    name: 'Foros',
    href: '/app/forums',
    icon: MessageCircle,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Comunidad',
    href: '/app/community',
    icon: Users,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    name: 'OCR Scanner',
    href: '/app/ocr',
    icon: ScanLine,
    gradient: 'from-teal-500 to-cyan-500',
    badge: 'IA',
  },
  {
    name: 'Transcripción',
    href: '/app/transcription',
    icon: Mic,
    gradient: 'from-red-500 to-pink-500',
    badge: 'IA',
  },
  {
    name: 'Resumen Video',
    href: '/app/video-summary',
    icon: Video,
    gradient: 'from-purple-500 to-indigo-500',
    badge: 'IA',
  },
  {
    name: 'Plan de Estudio',
    href: '/app/study-plans',
    icon: CalendarDays,
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    name: 'LMS',
    href: '/app/lms',
    icon: GraduationCap,
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    name: 'Bibliografía',
    href: '/app/bibliography',
    icon: BookMarked,
    gradient: 'from-amber-600 to-orange-600',
  },
  {
    name: 'Tutorías',
    href: '/app/tutoring',
    icon: HelpCircle,
    gradient: 'from-green-500 to-teal-500',
  },
  {
    name: 'Importar Datos',
    href: '/app/import',
    icon: Upload,
    gradient: 'from-gray-500 to-slate-600',
  },
];

const secondaryNavigation = [
  {
    name: 'Mi Perfil',
    href: '/app/profile',
    icon: Users,
  },
  {
    name: 'Configuración',
    href: '/app/settings',
    icon: Settings,
  },
  {
    name: 'Suscripción',
    href: '/app/billing',
    icon: CreditCard,
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact || href === '/app') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-out',
        'bg-white/80 backdrop-blur-xl border-r border-secondary-200/50',
        'shadow-[4px_0_24px_-2px_rgba(0,0,0,0.05)]',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-secondary-200/50">
          <Link href="/app" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow duration-300">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-primary-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-xl font-bold text-secondary-900 tracking-tight">
                  Campus<span className="gradient-text">Mind</span>
                </span>
                <p className="text-xs text-secondary-400 -mt-0.5">Tu campus inteligente</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
            }}
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              'text-secondary-400 hover:text-secondary-600',
              'hover:bg-secondary-100 active:scale-95',
              isCollapsed && 'mx-auto'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <div className="px-3">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3 px-3">
                Principal
              </p>
            )}
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                      isActive(item.href, item.exact)
                        ? 'bg-gradient-to-r from-primary-50 to-violet-50 text-primary-700 shadow-sm'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        isActive(item.href, item.exact)
                          ? `bg-gradient-to-br ${item.gradient} text-white shadow-md`
                          : 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-primary-500 to-violet-500 text-white shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 px-3">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3 px-3">
                Cuenta
              </p>
            )}
            <ul className="space-y-1">
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-secondary-100 text-secondary-900'
                        : 'text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="p-2 rounded-lg bg-secondary-100 text-secondary-500 group-hover:bg-secondary-200 transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Pro Upgrade Card */}
        {!isCollapsed && (
          <div className="px-4 mb-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-violet-500 p-4 shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-300" />
                  <span className="text-sm font-semibold text-white">Upgrade a Pro</span>
                </div>
                <p className="text-xs text-white/80 mb-3">
                  Desbloquea todas las funciones de IA y recursos ilimitados.
                </p>
                <Link href="/app/billing">
                  <button className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors backdrop-blur-sm">
                    Ver planes
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* User Section */}
        <div className="p-4 border-t border-secondary-200/50 bg-secondary-50/50">
          {!isCollapsed && user?.profile && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-semibold shadow-md">
                {user.profile.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary-900 truncate">
                  {user.profile.firstName} {user.profile.lastName}
                </p>
                <p className="text-xs text-secondary-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200',
              'text-secondary-500 hover:bg-red-50 hover:text-red-600',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Cerrar sesión' : undefined}
          >
            <div className="p-2 rounded-lg bg-secondary-100 group-hover:bg-red-100 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            {!isCollapsed && <span className="font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

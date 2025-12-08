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
  },
  {
    name: 'Materias',
    href: '/app/subjects',
    icon: BookOpen,
  },
  {
    name: 'Copiloto',
    href: '/app/copilot',
    icon: MessageSquare,
  },
  {
    name: 'Buscar',
    href: '/app/search',
    icon: Search,
  },
];

const secondaryNavigation = [
  {
    name: 'Configuración',
    href: '/app/settings',
    icon: Settings,
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
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-secondary-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200">
          <Link href="/app" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary-600 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-xl font-bold text-secondary-900">
                CampusMind
              </span>
            )}
          </Link>
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              onClose?.();
            }}
            className="p-1 rounded-lg hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <ul className="space-y-1 px-2">
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-secondary-200">
          {!isCollapsed && user?.profile && (
            <div className="mb-3 px-2">
              <p className="font-medium text-secondary-900 truncate">
                {user.profile.firstName} {user.profile.lastName}
              </p>
              <p className="text-sm text-secondary-500 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-secondary-600 hover:bg-red-50 hover:text-red-600 transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

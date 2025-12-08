'use client';

import { useState } from 'react';
import { Search, User, Menu, Settings, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { getInitials, cn } from '../../lib/utils';
import Link from 'next/link';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { ThemeToggleCompact } from '../theme/ThemeToggle';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-secondary-900/70 backdrop-blur-xl border-b border-secondary-200/50 dark:border-secondary-700/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:text-secondary-500 dark:hover:text-secondary-300 dark:hover:bg-secondary-800 transition-all duration-200 active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          {title && (
            <h1 className="text-lg font-semibold text-secondary-900 dark:text-white tracking-tight">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400 dark:text-secondary-500 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar..."
            className={cn(
              'w-72 pl-11 pr-4 py-2.5 rounded-xl',
              'bg-secondary-50/80 dark:bg-secondary-800/80 border-2 border-transparent',
              'text-sm text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 dark:placeholder:text-secondary-500',
              'focus:outline-none focus:bg-white dark:focus:bg-secondary-800 focus:border-primary-200 dark:focus:border-primary-700 focus:ring-4 focus:ring-primary-500/10',
              'transition-all duration-200'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 text-secondary-300 dark:text-secondary-600">
            <kbd className="px-1.5 py-0.5 text-xs bg-secondary-100 dark:bg-secondary-700 rounded font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-secondary-100 dark:bg-secondary-700 rounded font-mono">K</kbd>
          </div>
        </div>

        {/* AI Assistant Quick Access */}
        <Link href="/app/copilot">
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 active:scale-95">
            <Sparkles className="h-4 w-4" />
            <span className="hidden lg:inline">Copiloto IA</span>
          </button>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggleCompact />

        {/* Notifications */}
        <NotificationPanel />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all duration-200 active:scale-98"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-medium text-sm shadow-md">
              {user?.profile ? (
                getInitials(`${user.profile.firstName} ${user.profile.lastName}`)
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <ChevronDown className={cn(
              'h-4 w-4 text-secondary-400 transition-transform duration-200',
              showUserMenu && 'rotate-180'
            )} />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-secondary-800 rounded-2xl shadow-premium-xl border border-secondary-200/50 dark:border-secondary-700/50 overflow-hidden z-50 animate-scale-in">
                {/* User Info */}
                <div className="p-4 bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-900/30 dark:to-violet-900/30 border-b border-secondary-100 dark:border-secondary-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-semibold shadow-lg">
                      {user?.profile?.firstName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary-900 dark:text-white truncate">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    href="/app/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 hover:text-secondary-900 dark:hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">Configuración</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-secondary-600 dark:text-secondary-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

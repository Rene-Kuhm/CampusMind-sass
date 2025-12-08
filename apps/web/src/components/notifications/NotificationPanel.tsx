'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Trophy,
  Clock,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Notification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  checkStudyReminders,
  notifyDailyTip,
} from '@/lib/notifications';

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Ahora';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString('es-ES');
}

const iconsByType = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  achievement: Trophy,
  reminder: Clock,
};

const colorsByType = {
  info: 'text-blue-500 bg-blue-50',
  success: 'text-emerald-500 bg-emerald-50',
  warning: 'text-amber-500 bg-amber-50',
  achievement: 'text-purple-500 bg-purple-50',
  reminder: 'text-rose-500 bg-rose-50',
};

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  useEffect(() => {
    const loadNotifications = () => {
      const notifs = getNotifications();
      setNotifications(notifs);
      setUnreadCount(getUnreadCount());
    };

    loadNotifications();

    // Check for study reminders on mount
    const reminders = checkStudyReminders();
    if (reminders.length > 0) {
      loadNotifications();
    }

    // Show daily tip
    notifyDailyTip();
    loadNotifications();

    // Refresh periodically
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setNotifications(getNotifications());
    setUnreadCount(0);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-xl transition-all duration-200',
          'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100',
          isOpen && 'bg-secondary-100 text-secondary-700'
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-rose-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[70vh] bg-white rounded-2xl shadow-xl border border-secondary-200/50 overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-secondary-100">
              <h3 className="font-semibold text-secondary-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Marcar todo
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-secondary-400">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-secondary-100">
                  {notifications.map((notification) => {
                    const Icon = iconsByType[notification.type];
                    const colorClass = colorsByType[notification.type];

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 transition-colors hover:bg-secondary-50 relative group',
                          !notification.read && 'bg-primary-50/30'
                        )}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                              colorClass
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  'text-sm font-medium text-secondary-900',
                                  !notification.read && 'font-semibold'
                                )}
                              >
                                {notification.title}
                              </p>
                              <span className="text-xs text-secondary-400 flex-shrink-0">
                                {formatTimeAgo(new Date(notification.timestamp))}
                              </span>
                            </div>
                            <p className="text-sm text-secondary-500 mt-0.5">
                              {notification.message}
                            </p>
                            {notification.action && (
                              <Link
                                href={notification.action.href}
                                onClick={() => {
                                  handleMarkAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mt-2"
                              >
                                {notification.action.label}
                                <span className="ml-1">→</span>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Actions (visible on hover) */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                              title="Marcar como leída"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

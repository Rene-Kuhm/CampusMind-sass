'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  Layers,
  Flame,
  Target,
  X,
  Check,
  Settings,
  ChevronRight,
} from 'lucide-react';
import {
  StudyReminder,
  getUnreadReminders,
  getPendingReminders,
  markReminderAsRead,
  dismissReminder,
  dismissAllReminders,
  formatReminderTime,
  getReminderIcon,
  sortReminders,
  generateDemoReminders,
} from '@/lib/study-reminders';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  layers: Layers,
  flame: Flame,
  target: Target,
  bell: Bell,
};

export default function ReminderDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState<StudyReminder[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate demo reminders on first load
    generateDemoReminders();
    loadReminders();

    // Refresh every minute
    const interval = setInterval(loadReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadReminders = () => {
    const pending = sortReminders(getPendingReminders());
    setReminders(pending);
  };

  const handleMarkAsRead = (id: string) => {
    markReminderAsRead(id);
    loadReminders();
  };

  const handleDismiss = (id: string) => {
    dismissReminder(id);
    loadReminders();
  };

  const handleDismissAll = () => {
    dismissAllReminders();
    loadReminders();
  };

  const unreadCount = reminders.filter(r => !r.read).length;

  const renderIcon = (iconName: string, className: string) => {
    const IconComponent = ICON_MAP[iconName] || Bell;
    return <IconComponent className={className} />;
  };

  const getReminderColor = (type: StudyReminder['type']) => {
    switch (type) {
      case 'streak_warning':
        return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
      case 'due_cards':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'daily':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'goal_reminder':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Recordatorios
            </h3>
            <div className="flex items-center gap-2">
              {reminders.length > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Descartar todo
                </button>
              )}
              <a
                href="/app/settings#reminders"
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Settings className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Reminders List */}
          <div className="max-h-96 overflow-y-auto">
            {reminders.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No tienes recordatorios pendientes
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !reminder.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 ${getReminderColor(reminder.type)}`}>
                        {renderIcon(getReminderIcon(reminder.type), 'h-4 w-4')}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            !reminder.read
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {reminder.title}
                          </h4>
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {formatReminderTime(reminder.scheduledFor)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {reminder.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          {reminder.type === 'due_cards' && reminder.data?.subjectName && (
                            <a
                              href={`/app/subjects`}
                              className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                            >
                              Estudiar ahora
                              <ChevronRight className="h-3 w-3" />
                            </a>
                          )}
                          {!reminder.read && (
                            <button
                              onClick={() => handleMarkAsRead(reminder.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Marcar leído
                            </button>
                          )}
                          <button
                            onClick={() => handleDismiss(reminder.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Descartar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {reminders.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <a
                href="/app/settings#reminders"
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center justify-center gap-1"
              >
                Configurar recordatorios
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

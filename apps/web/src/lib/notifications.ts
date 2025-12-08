// Notification types and utilities

export type NotificationType = 'info' | 'success' | 'warning' | 'achievement' | 'reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
  icon?: string;
}

// Store key
const STORAGE_KEY = 'campusmind-notifications';

// Get all notifications
export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const notifications = JSON.parse(saved);
    return notifications.map((n: Notification) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch {
    return [];
  }
}

// Save notifications
function saveNotifications(notifications: Notification[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

// Add a new notification
export function addNotification(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Notification {
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date(),
    read: false,
  };

  const notifications = getNotifications();
  // Keep only last 50 notifications
  const updated = [newNotification, ...notifications].slice(0, 50);
  saveNotifications(updated);

  return newNotification;
}

// Mark notification as read
export function markAsRead(id: string): void {
  const notifications = getNotifications();
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
}

// Mark all as read
export function markAllAsRead(): void {
  const notifications = getNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

// Delete notification
export function deleteNotification(id: string): void {
  const notifications = getNotifications();
  const updated = notifications.filter((n) => n.id !== id);
  saveNotifications(updated);
}

// Clear all notifications
export function clearAllNotifications(): void {
  saveNotifications([]);
}

// Get unread count
export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter((n) => !n.read).length;
}

// Check and generate study reminders
export function checkStudyReminders(): Notification[] {
  const newNotifications: Notification[] = [];

  // Check flashcards due for review
  try {
    const flashcardsStr = localStorage.getItem('flashcard-cards');
    if (flashcardsStr) {
      const flashcards = JSON.parse(flashcardsStr);
      const today = new Date().toISOString().split('T')[0];
      const dueCount = flashcards.filter(
        (c: { nextReview: string }) => c.nextReview <= today
      ).length;

      if (dueCount > 0) {
        newNotifications.push({
          id: `due-${Date.now()}`,
          type: 'reminder',
          title: 'Flashcards pendientes',
          message: `Tienes ${dueCount} tarjetas para repasar hoy`,
          timestamp: new Date(),
          read: false,
          action: {
            label: 'Estudiar ahora',
            href: '/app/flashcards',
          },
        });
      }
    }
  } catch (e) {
    console.error('Error checking flashcard reminders:', e);
  }

  // Check streak
  try {
    const statsStr = localStorage.getItem('flashcard-stats');
    if (statsStr) {
      const stats = JSON.parse(statsStr);
      const lastStudyDate = stats.lastStudyDate;
      const today = new Date().toISOString().split('T')[0];

      if (lastStudyDate !== today && stats.streak > 0) {
        newNotifications.push({
          id: `streak-${Date.now()}`,
          type: 'warning',
          title: 'No pierdas tu racha',
          message: `Llevas ${stats.streak} días estudiando. ¡No lo pierdas hoy!`,
          timestamp: new Date(),
          read: false,
          action: {
            label: 'Estudiar',
            href: '/app/flashcards',
          },
        });
      }
    }
  } catch (e) {
    console.error('Error checking streak reminder:', e);
  }

  return newNotifications;
}

// Achievement notifications
export function notifyAchievement(name: string, description: string): void {
  addNotification({
    type: 'achievement',
    title: `Logro desbloqueado: ${name}`,
    message: description,
    action: {
      label: 'Ver logros',
      href: '/app/progress',
    },
  });
}

// Study completion notification
export function notifyStudyComplete(cardsStudied: number, accuracy: number): void {
  addNotification({
    type: 'success',
    title: 'Sesión completada',
    message: `Estudiaste ${cardsStudied} tarjetas con ${accuracy}% de precisión`,
    action: {
      label: 'Ver progreso',
      href: '/app/progress',
    },
  });
}

// Quiz completion notification
export function notifyQuizComplete(quizName: string, score: number): void {
  const type = score >= 70 ? 'success' : 'info';
  addNotification({
    type,
    title: 'Quiz completado',
    message: `Obtuviste ${score}% en "${quizName}"`,
    action: {
      label: 'Ver resultados',
      href: '/app/quiz',
    },
  });
}

// Daily tip notification
const STUDY_TIPS = [
  'Estudiar en intervalos cortos es más efectivo que sesiones largas.',
  'Repasa las flashcards difíciles antes de las fáciles.',
  'Toma descansos cada 25 minutos para mantener la concentración.',
  'Relaciona conceptos nuevos con conocimientos previos.',
  'Enseñar lo aprendido a otros refuerza tu memoria.',
  'Dormir bien mejora la consolidación de la memoria.',
  'Haz preguntas sobre el material para profundizar tu comprensión.',
  'Usa el método Pomodoro para gestionar tu tiempo de estudio.',
];

export function getDailyTip(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return STUDY_TIPS[dayOfYear % STUDY_TIPS.length];
}

export function notifyDailyTip(): void {
  const lastTipDate = localStorage.getItem('last-tip-date');
  const today = new Date().toISOString().split('T')[0];

  if (lastTipDate !== today) {
    addNotification({
      type: 'info',
      title: 'Consejo del día',
      message: getDailyTip(),
    });
    localStorage.setItem('last-tip-date', today);
  }
}

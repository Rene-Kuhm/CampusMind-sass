// Study Reminders System - SM-2 Based Notifications

export interface StudyReminder {
  id: string;
  type: 'daily' | 'due_cards' | 'streak_warning' | 'goal_reminder' | 'custom';
  title: string;
  message: string;
  scheduledFor: Date;
  createdAt: Date;
  read: boolean;
  dismissed: boolean;
  data?: {
    dueCardCount?: number;
    subjectId?: string;
    subjectName?: string;
    streakDays?: number;
  };
}

export interface ReminderSettings {
  enabled: boolean;
  dailyReminder: {
    enabled: boolean;
    time: string; // HH:mm format
  };
  dueCardsReminder: {
    enabled: boolean;
    threshold: number; // Notify when X cards are due
  };
  streakReminder: {
    enabled: boolean;
    reminderTime: string; // HH:mm
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
}

const STORAGE_KEY = 'campusmind-reminders';
const SETTINGS_KEY = 'campusmind-reminder-settings';

// Default settings
const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  dailyReminder: {
    enabled: true,
    time: '09:00',
  },
  dueCardsReminder: {
    enabled: true,
    threshold: 10,
  },
  streakReminder: {
    enabled: true,
    reminderTime: '20:00',
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
};

// Get reminder settings
export function getReminderSettings(): ReminderSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

// Save reminder settings
export function saveReminderSettings(settings: ReminderSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Get all reminders
export function getReminders(): StudyReminder[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const reminders = JSON.parse(stored);
      return reminders.map((r: StudyReminder) => ({
        ...r,
        scheduledFor: new Date(r.scheduledFor),
        createdAt: new Date(r.createdAt),
      }));
    } catch {
      return [];
    }
  }
  return [];
}

// Get unread reminders
export function getUnreadReminders(): StudyReminder[] {
  return getReminders().filter(r => !r.read && !r.dismissed);
}

// Get pending reminders (scheduled for now or past)
export function getPendingReminders(): StudyReminder[] {
  const now = new Date();
  return getReminders().filter(
    r => !r.dismissed && r.scheduledFor <= now
  );
}

// Save reminders
function saveReminders(reminders: StudyReminder[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

// Create a reminder
export function createReminder(
  type: StudyReminder['type'],
  title: string,
  message: string,
  scheduledFor: Date,
  data?: StudyReminder['data']
): StudyReminder {
  const reminder: StudyReminder = {
    id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    title,
    message,
    scheduledFor,
    createdAt: new Date(),
    read: false,
    dismissed: false,
    data,
  };

  const reminders = getReminders();
  reminders.push(reminder);
  saveReminders(reminders);

  return reminder;
}

// Mark reminder as read
export function markReminderAsRead(id: string): void {
  const reminders = getReminders();
  const reminder = reminders.find(r => r.id === id);
  if (reminder) {
    reminder.read = true;
    saveReminders(reminders);
  }
}

// Dismiss reminder
export function dismissReminder(id: string): void {
  const reminders = getReminders();
  const reminder = reminders.find(r => r.id === id);
  if (reminder) {
    reminder.dismissed = true;
    saveReminders(reminders);
  }
}

// Dismiss all reminders
export function dismissAllReminders(): void {
  const reminders = getReminders().map(r => ({ ...r, dismissed: true }));
  saveReminders(reminders);
}

// Delete old reminders (older than 7 days)
export function cleanOldReminders(): void {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const reminders = getReminders().filter(
    r => r.createdAt > sevenDaysAgo || !r.dismissed
  );
  saveReminders(reminders);
}

// Check if we're in quiet hours
export function isQuietHours(settings: ReminderSettings): boolean {
  if (!settings.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
  const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours
  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime < endMinutes;
  }

  return currentTime >= startMinutes && currentTime < endMinutes;
}

// Schedule daily reminder
export function scheduleDailyReminder(): void {
  const settings = getReminderSettings();
  if (!settings.enabled || !settings.dailyReminder.enabled) return;

  const [hours, minutes] = settings.dailyReminder.time.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  // Check if already scheduled
  const reminders = getReminders();
  const existingDaily = reminders.find(
    r => r.type === 'daily' &&
      !r.dismissed &&
      r.scheduledFor.toDateString() === scheduledTime.toDateString()
  );

  if (!existingDaily) {
    createReminder(
      'daily',
      '¡Hora de estudiar!',
      'Es momento de tu sesión de estudio diaria. Mantén tu racha activa.',
      scheduledTime
    );
  }
}

// Check for due cards and create reminder
export function checkDueCardsReminder(dueCardCount: number, subjectName?: string): void {
  const settings = getReminderSettings();
  if (!settings.enabled || !settings.dueCardsReminder.enabled) return;
  if (isQuietHours(settings)) return;

  if (dueCardCount >= settings.dueCardsReminder.threshold) {
    // Check if we already have a recent reminder
    const reminders = getReminders();
    const recentDueReminder = reminders.find(
      r => r.type === 'due_cards' &&
        !r.dismissed &&
        (Date.now() - r.createdAt.getTime()) < 6 * 60 * 60 * 1000 // 6 hours
    );

    if (!recentDueReminder) {
      createReminder(
        'due_cards',
        `${dueCardCount} tarjetas pendientes`,
        subjectName
          ? `Tienes ${dueCardCount} tarjetas por revisar en ${subjectName}`
          : `Tienes ${dueCardCount} tarjetas pendientes de revisión`,
        new Date(),
        { dueCardCount, subjectName }
      );
    }
  }
}

// Schedule streak warning
export function scheduleStreakWarning(currentStreak: number): void {
  const settings = getReminderSettings();
  if (!settings.enabled || !settings.streakReminder.enabled) return;

  const [hours, minutes] = settings.streakReminder.reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hours, minutes, 0, 0);

  // Only schedule if we haven't studied today and time hasn't passed
  if (scheduledTime <= now) return;

  // Check if already scheduled
  const reminders = getReminders();
  const existingStreakReminder = reminders.find(
    r => r.type === 'streak_warning' &&
      !r.dismissed &&
      r.scheduledFor.toDateString() === scheduledTime.toDateString()
  );

  if (!existingStreakReminder && currentStreak > 0) {
    createReminder(
      'streak_warning',
      '¡No pierdas tu racha!',
      `Llevas ${currentStreak} días seguidos estudiando. ¡No te detengas ahora!`,
      scheduledTime,
      { streakDays: currentStreak }
    );
  }
}

// Create custom reminder
export function createCustomReminder(
  title: string,
  message: string,
  scheduledFor: Date
): StudyReminder {
  return createReminder('custom', title, message, scheduledFor);
}

// Get reminder icon
export function getReminderIcon(type: StudyReminder['type']): string {
  switch (type) {
    case 'daily':
      return 'clock';
    case 'due_cards':
      return 'layers';
    case 'streak_warning':
      return 'flame';
    case 'goal_reminder':
      return 'target';
    case 'custom':
    default:
      return 'bell';
  }
}

// Format time for display
export function formatReminderTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString();
}

// Demo: Generate sample reminders
export function generateDemoReminders(): void {
  const reminders = getReminders();

  if (reminders.length === 0) {
    createReminder(
      'due_cards',
      '25 tarjetas pendientes',
      'Tienes 25 tarjetas por revisar en Anatomía',
      new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      { dueCardCount: 25, subjectName: 'Anatomía' }
    );

    createReminder(
      'streak_warning',
      '¡No pierdas tu racha!',
      'Llevas 7 días seguidos estudiando. ¡No te detengas ahora!',
      new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      { streakDays: 7 }
    );

    createReminder(
      'daily',
      '¡Hora de estudiar!',
      'Es momento de tu sesión de estudio diaria. Mantén tu racha activa.',
      new Date()
    );
  }
}

// Reminder priorities
export function getReminderPriority(reminder: StudyReminder): number {
  switch (reminder.type) {
    case 'streak_warning':
      return 1;
    case 'due_cards':
      return 2;
    case 'daily':
      return 3;
    case 'goal_reminder':
      return 4;
    case 'custom':
    default:
      return 5;
  }
}

// Sort reminders by priority and time
export function sortReminders(reminders: StudyReminder[]): StudyReminder[] {
  return [...reminders].sort((a, b) => {
    // Unread first
    if (a.read !== b.read) return a.read ? 1 : -1;
    // Then by priority
    const priorityDiff = getReminderPriority(a) - getReminderPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    // Then by time (newest first)
    return b.scheduledFor.getTime() - a.scheduledFor.getTime();
  });
}

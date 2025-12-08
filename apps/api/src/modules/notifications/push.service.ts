import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PushNotificationType =
  | 'study-reminder'
  | 'streak-warning'
  | 'achievement'
  | 'quiz-ready'
  | 'new-comment'
  | 'calendar-event'
  | 'subscription';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface SendPushOptions {
  userId: string;
  type: PushNotificationType;
  payload: PushPayload;
  ttl?: number; // Time to live in seconds
}

interface WebPushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

// In-memory storage for demo - in production, use database
const subscriptions = new Map<string, PushSubscription[]>();

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly config: WebPushConfig;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      publicKey: configService.get<string>('VAPID_PUBLIC_KEY') || '',
      privateKey: configService.get<string>('VAPID_PRIVATE_KEY') || '',
      subject: configService.get<string>('VAPID_SUBJECT') || 'mailto:admin@campusmind.com',
    };
    this.enabled = Boolean(this.config.publicKey && this.config.privateKey);

    if (!this.enabled) {
      this.logger.warn('Push notifications disabled - VAPID keys not configured');
    }
  }

  /**
   * Get VAPID public key for client subscription
   */
  getPublicKey(): string {
    return this.config.publicKey;
  }

  /**
   * Check if push notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      const userSubscriptions = subscriptions.get(userId) || [];

      // Check if already subscribed with same endpoint
      const exists = userSubscriptions.some((s) => s.endpoint === subscription.endpoint);
      if (!exists) {
        userSubscriptions.push(subscription);
        subscriptions.set(userId, userSubscriptions);
        this.logger.log(`User ${userId} subscribed to push notifications`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(userId: string, endpoint?: string): Promise<boolean> {
    try {
      if (endpoint) {
        const userSubscriptions = subscriptions.get(userId) || [];
        const filtered = userSubscriptions.filter((s) => s.endpoint !== endpoint);
        subscriptions.set(userId, filtered);
      } else {
        subscriptions.delete(userId);
      }

      this.logger.log(`User ${userId} unsubscribed from push notifications`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has active subscriptions
   */
  hasSubscription(userId: string): boolean {
    const userSubscriptions = subscriptions.get(userId);
    return Boolean(userSubscriptions && userSubscriptions.length > 0);
  }

  /**
   * Send push notification to user
   */
  async send(options: SendPushOptions): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!this.enabled) {
      this.logger.warn('Push notifications disabled');
      return { success: false, sent: 0, failed: 0 };
    }

    const userSubscriptions = subscriptions.get(options.userId);
    if (!userSubscriptions || userSubscriptions.length === 0) {
      this.logger.log(`No subscriptions found for user ${options.userId}`);
      return { success: false, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const subscription of userSubscriptions) {
      try {
        await this.sendToSubscription(subscription, options.payload, options.ttl);
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send push to ${subscription.endpoint}:`, error);
        failed++;

        // Remove invalid subscription
        if (this.isSubscriptionExpired(error)) {
          await this.unsubscribe(options.userId, subscription.endpoint);
        }
      }
    }

    return { success: sent > 0, sent, failed };
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMany(
    userIds: string[],
    type: PushNotificationType,
    payload: PushPayload
  ): Promise<{ total: number; sent: number; failed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const result = await this.send({ userId, type, payload });
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return { total: userIds.length, sent: totalSent, failed: totalFailed };
  }

  // === Convenience methods for specific notification types ===

  /**
   * Send study reminder notification
   */
  async sendStudyReminder(
    userId: string,
    data: {
      subjectName: string;
      pendingCards: number;
      studyUrl: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      userId,
      type: 'study-reminder',
      payload: {
        title: '¡Hora de estudiar!',
        body: `Tienes ${data.pendingCards} tarjetas pendientes en ${data.subjectName}`,
        icon: '/icons/study-reminder.png',
        badge: '/icons/badge.png',
        tag: 'study-reminder',
        data: {
          type: 'study-reminder',
          url: data.studyUrl,
        },
        actions: [
          { action: 'study', title: 'Estudiar ahora' },
          { action: 'snooze', title: 'Recordar después' },
        ],
        vibrate: [100, 50, 100],
      },
    });
    return result.success;
  }

  /**
   * Send streak warning notification
   */
  async sendStreakWarning(
    userId: string,
    data: {
      currentStreak: number;
      hoursRemaining: number;
      studyUrl: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      userId,
      type: 'streak-warning',
      payload: {
        title: '¡Tu racha está en riesgo!',
        body: `Solo te quedan ${data.hoursRemaining}h para mantener tu racha de ${data.currentStreak} días`,
        icon: '/icons/streak-warning.png',
        badge: '/icons/badge.png',
        tag: 'streak-warning',
        requireInteraction: true,
        data: {
          type: 'streak-warning',
          url: data.studyUrl,
        },
        actions: [
          { action: 'study', title: 'Estudiar ahora' },
        ],
        vibrate: [200, 100, 200, 100, 200],
      },
    });
    return result.success;
  }

  /**
   * Send achievement notification
   */
  async sendAchievementUnlocked(
    userId: string,
    data: {
      achievementName: string;
      achievementIcon: string;
      xpEarned: number;
      achievementsUrl: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      userId,
      type: 'achievement',
      payload: {
        title: '¡Logro desbloqueado!',
        body: `${data.achievementName} (+${data.xpEarned} XP)`,
        icon: data.achievementIcon || '/icons/achievement.png',
        badge: '/icons/badge.png',
        tag: 'achievement',
        data: {
          type: 'achievement',
          url: data.achievementsUrl,
        },
        vibrate: [100, 50, 100, 50, 100],
      },
    });
    return result.success;
  }

  /**
   * Send new comment notification
   */
  async sendNewComment(
    userId: string,
    data: {
      commenterName: string;
      resourceName: string;
      commentPreview: string;
      resourceUrl: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      userId,
      type: 'new-comment',
      payload: {
        title: `${data.commenterName} comentó`,
        body: `En "${data.resourceName}": ${data.commentPreview.substring(0, 50)}...`,
        icon: '/icons/comment.png',
        badge: '/icons/badge.png',
        tag: `comment-${Date.now()}`,
        data: {
          type: 'new-comment',
          url: data.resourceUrl,
        },
        actions: [
          { action: 'view', title: 'Ver comentario' },
          { action: 'reply', title: 'Responder' },
        ],
      },
    });
    return result.success;
  }

  /**
   * Send calendar event reminder
   */
  async sendCalendarReminder(
    userId: string,
    data: {
      eventTitle: string;
      eventTime: string;
      minutesBefore: number;
      calendarUrl: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      userId,
      type: 'calendar-event',
      payload: {
        title: 'Recordatorio de evento',
        body: `${data.eventTitle} - en ${data.minutesBefore} minutos`,
        icon: '/icons/calendar.png',
        badge: '/icons/badge.png',
        tag: 'calendar-event',
        requireInteraction: true,
        data: {
          type: 'calendar-event',
          url: data.calendarUrl,
        },
        actions: [
          { action: 'view', title: 'Ver evento' },
          { action: 'snooze', title: 'Recordar en 5 min' },
        ],
        vibrate: [100, 50, 100],
      },
    });
    return result.success;
  }

  // === Private methods ===

  /**
   * Send notification to a specific subscription
   */
  private async sendToSubscription(
    subscription: PushSubscription,
    payload: PushPayload,
    ttl: number = 60 * 60 * 24 // 24 hours default
  ): Promise<void> {
    // In production, use web-push library:
    // await webpush.sendNotification(subscription, JSON.stringify(payload), {
    //   vapidDetails: {
    //     subject: this.config.subject,
    //     publicKey: this.config.publicKey,
    //     privateKey: this.config.privateKey,
    //   },
    //   TTL: ttl,
    // });

    // Mock implementation for development
    this.logger.log(`[Push Mock] Sending to ${subscription.endpoint.substring(0, 50)}...`);
    this.logger.log(`[Push Mock] Payload: ${JSON.stringify(payload)}`);
  }

  /**
   * Check if error indicates expired subscription
   */
  private isSubscriptionExpired(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('expired') ||
        message.includes('unsubscribed') ||
        message.includes('gone') ||
        message.includes('404') ||
        message.includes('410')
      );
    }
    return false;
  }
}

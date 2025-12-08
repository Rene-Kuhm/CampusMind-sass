import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PushNotificationService } from './push.service';
import { EmailService } from './email.service';

class PushSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class UnsubscribeDto {
  endpoint: string;
}

class TestEmailDto {
  template: 'welcome' | 'study-reminder' | 'achievement-unlocked' | 'weekly-summary';
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly pushService: PushNotificationService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get VAPID public key for push subscriptions
   */
  @Get('push/vapid-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  @ApiResponse({ status: 200, description: 'VAPID public key' })
  getVapidKey() {
    return {
      publicKey: this.pushService.getPublicKey(),
      enabled: this.pushService.isEnabled(),
    };
  }

  /**
   * Subscribe to push notifications
   */
  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiResponse({ status: 200, description: 'Subscription successful' })
  async subscribePush(
    @CurrentUser() user: User,
    @Body() body: PushSubscriptionDto,
  ) {
    const success = await this.pushService.subscribe(user.id, {
      endpoint: body.endpoint,
      keys: body.keys,
    });

    return {
      success,
      message: success
        ? 'Suscrito a notificaciones push'
        : 'Error al suscribirse',
    };
  }

  /**
   * Unsubscribe from push notifications
   */
  @Post('push/unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({ status: 200, description: 'Unsubscription successful' })
  async unsubscribePush(
    @CurrentUser() user: User,
    @Body() body: UnsubscribeDto,
  ) {
    const success = await this.pushService.unsubscribe(user.id, body.endpoint);

    return {
      success,
      message: success
        ? 'Desuscrito de notificaciones push'
        : 'Error al desuscribirse',
    };
  }

  /**
   * Check push subscription status
   */
  @Get('push/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check push notification subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status' })
  getPushStatus(@CurrentUser() user: User) {
    return {
      subscribed: this.pushService.hasSubscription(user.id),
      enabled: this.pushService.isEnabled(),
    };
  }

  /**
   * Send test push notification
   */
  @Post('push/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test push notification' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async sendTestPush(@CurrentUser() user: User) {
    const result = await this.pushService.send({
      userId: user.id,
      type: 'study-reminder',
      payload: {
        title: '¡Notificación de prueba!',
        body: 'Si ves esto, las notificaciones push funcionan correctamente.',
        icon: '/icons/icon-192x192.png',
        tag: 'test',
        data: { url: '/app' },
      },
    });

    return {
      success: result.success,
      sent: result.sent,
      message: result.success
        ? 'Notificación de prueba enviada'
        : 'No tienes suscripciones activas',
    };
  }

  /**
   * Send test email
   */
  @Post('email/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test email' })
  @ApiResponse({ status: 200, description: 'Test email sent' })
  async sendTestEmail(
    @CurrentUser() user: User,
    @Body() body: TestEmailDto,
  ) {
    let success = false;

    switch (body.template) {
      case 'welcome':
        success = await this.emailService.sendWelcome(user.email, {
          name: user.email.split('@')[0],
        });
        break;

      case 'study-reminder':
        success = await this.emailService.sendStudyReminder(user.email, {
          name: user.email.split('@')[0],
          pendingCards: 15,
          subjectName: 'Matemáticas',
          studyLink: 'https://campusmind.com/app/study',
        });
        break;

      case 'achievement-unlocked':
        success = await this.emailService.sendAchievementUnlocked(user.email, {
          name: user.email.split('@')[0],
          achievementName: 'Primera Racha de 7 días',
          achievementDescription: 'Estudia 7 días consecutivos',
          xpEarned: 100,
        });
        break;

      case 'weekly-summary':
        success = await this.emailService.sendWeeklySummary(user.email, {
          name: user.email.split('@')[0],
          weekStart: 'Lun 2 Dic',
          weekEnd: 'Dom 8 Dic',
          cardsReviewed: 150,
          quizzesTaken: 5,
          correctAnswers: 87,
          xpEarned: 450,
          currentLevel: 12,
          streakDays: 14,
          topSubject: 'Física',
        });
        break;

      default:
        return { success: false, message: 'Template no válido' };
    }

    return {
      success,
      message: success
        ? `Email de ${body.template} enviado a ${user.email}`
        : 'Error al enviar email',
    };
  }

  /**
   * Get notification preferences
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'User notification preferences' })
  getPreferences(@CurrentUser() user: User) {
    // In production, fetch from database
    return {
      email: {
        studyReminders: true,
        weeklyDigest: true,
        achievements: true,
        streakWarnings: true,
        marketing: false,
      },
      push: {
        studyReminders: true,
        achievements: true,
        streakWarnings: true,
        comments: true,
        calendarEvents: true,
      },
    };
  }

  /**
   * Update notification preferences
   */
  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  updatePreferences(
    @CurrentUser() user: User,
    @Body() preferences: {
      email?: Record<string, boolean>;
      push?: Record<string, boolean>;
    },
  ) {
    // In production, save to database
    return {
      success: true,
      message: 'Preferencias actualizadas',
      preferences,
    };
  }
}

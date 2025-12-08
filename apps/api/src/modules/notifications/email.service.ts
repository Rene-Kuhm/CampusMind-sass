import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type EmailTemplate =
  | 'welcome'
  | 'password-reset'
  | 'email-verification'
  | 'study-reminder'
  | 'achievement-unlocked'
  | 'streak-warning'
  | 'weekly-summary'
  | 'quiz-results'
  | 'subscription-confirmation'
  | 'subscription-cancelled'
  | 'payment-failed';

export interface EmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'ses';
  from: string;
  fromName: string;
  replyTo?: string;
}

interface SendGridPayload {
  personalizations: Array<{
    to: Array<{ email: string }>;
    subject: string;
  }>;
  from: { email: string; name: string };
  reply_to?: { email: string };
  content: Array<{ type: string; value: string }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly config: EmailConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      provider: (configService.get<string>('EMAIL_PROVIDER') as EmailConfig['provider']) || 'smtp',
      from: configService.get<string>('EMAIL_FROM') || 'noreply@campusmind.com',
      fromName: configService.get<string>('EMAIL_FROM_NAME') || 'CampusMind',
      replyTo: configService.get<string>('EMAIL_REPLY_TO'),
    };
  }

  /**
   * Send an email using the configured provider
   */
  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const html = this.renderTemplate(options.template, options.data);

    try {
      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(options, html);
        case 'resend':
          return await this.sendWithResend(options, html);
        case 'ses':
          return await this.sendWithSES(options, html);
        case 'smtp':
        default:
          return await this.sendWithSMTP(options, html);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return { success: false };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcome(to: string, data: { name: string; verificationLink?: string }): Promise<boolean> {
    const result = await this.send({
      to,
      subject: '¡Bienvenido a CampusMind!',
      template: 'welcome',
      data,
    });
    return result.success;
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, data: { name: string; resetLink: string; expiresIn: string }): Promise<boolean> {
    const result = await this.send({
      to,
      subject: 'Restablecer tu contraseña - CampusMind',
      template: 'password-reset',
      data,
    });
    return result.success;
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(to: string, data: { name: string; verificationLink: string }): Promise<boolean> {
    const result = await this.send({
      to,
      subject: 'Verifica tu email - CampusMind',
      template: 'email-verification',
      data,
    });
    return result.success;
  }

  /**
   * Send study reminder
   */
  async sendStudyReminder(
    to: string,
    data: {
      name: string;
      pendingCards: number;
      subjectName: string;
      studyLink: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: `Tienes ${data.pendingCards} tarjetas pendientes en ${data.subjectName}`,
      template: 'study-reminder',
      data,
    });
    return result.success;
  }

  /**
   * Send achievement notification
   */
  async sendAchievementUnlocked(
    to: string,
    data: {
      name: string;
      achievementName: string;
      achievementDescription: string;
      xpEarned: number;
      achievementIcon?: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: `¡Logro desbloqueado: ${data.achievementName}!`,
      template: 'achievement-unlocked',
      data,
    });
    return result.success;
  }

  /**
   * Send streak warning
   */
  async sendStreakWarning(
    to: string,
    data: {
      name: string;
      currentStreak: number;
      hoursRemaining: number;
      studyLink: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: `¡Tu racha de ${data.currentStreak} días está en riesgo!`,
      template: 'streak-warning',
      data,
    });
    return result.success;
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(
    to: string,
    data: {
      name: string;
      weekStart: string;
      weekEnd: string;
      cardsReviewed: number;
      quizzesTaken: number;
      correctAnswers: number;
      xpEarned: number;
      currentLevel: number;
      streakDays: number;
      topSubject?: string;
    }
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: `Tu resumen semanal - CampusMind`,
      template: 'weekly-summary',
      data,
    });
    return result.success;
  }

  /**
   * Send subscription confirmation
   */
  async sendSubscriptionConfirmation(
    to: string,
    data: {
      name: string;
      planName: string;
      amount: number;
      currency: string;
      nextBillingDate: string;
      features: string[];
    }
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: `Suscripción ${data.planName} activada - CampusMind`,
      template: 'subscription-confirmation',
      data,
    });
    return result.success;
  }

  // === Private methods ===

  /**
   * Render email template
   */
  private renderTemplate(template: EmailTemplate, data: Record<string, unknown>): string {
    const templates: Record<EmailTemplate, (data: Record<string, unknown>) => string> = {
      'welcome': this.renderWelcome.bind(this),
      'password-reset': this.renderPasswordReset.bind(this),
      'email-verification': this.renderEmailVerification.bind(this),
      'study-reminder': this.renderStudyReminder.bind(this),
      'achievement-unlocked': this.renderAchievementUnlocked.bind(this),
      'streak-warning': this.renderStreakWarning.bind(this),
      'weekly-summary': this.renderWeeklySummary.bind(this),
      'quiz-results': this.renderQuizResults.bind(this),
      'subscription-confirmation': this.renderSubscriptionConfirmation.bind(this),
      'subscription-cancelled': this.renderSubscriptionCancelled.bind(this),
      'payment-failed': this.renderPaymentFailed.bind(this),
    };

    return templates[template]?.(data) || this.renderDefaultTemplate(data);
  }

  /**
   * Base email template wrapper
   */
  private wrapTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusMind</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    .highlight { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .stat { display: inline-block; text-align: center; margin: 10px 20px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CampusMind</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} CampusMind. Todos los derechos reservados.</p>
      <p><a href="https://campusmind.com/unsubscribe" style="color: #6c757d;">Cancelar suscripción</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  private renderWelcome(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>¡Hola ${data.name}!</h2>
      <p>¡Bienvenido a CampusMind, tu copiloto académico!</p>
      <p>Estamos emocionados de tenerte con nosotros. Con CampusMind podrás:</p>
      <ul>
        <li>Crear flashcards con repetición espaciada (SM-2)</li>
        <li>Tomar quizzes adaptativos</li>
        <li>Buscar recursos académicos</li>
        <li>Hacer consultas inteligentes con RAG</li>
        <li>Ganar XP y desbloquear logros</li>
      </ul>
      ${data.verificationLink ? `<a href="${data.verificationLink}" class="button">Verificar mi email</a>` : ''}
      <p>¿Listo para empezar a estudiar de forma más inteligente?</p>
      <a href="https://campusmind.com/dashboard" class="button">Ir al Dashboard</a>
    `);
  }

  private renderPasswordReset(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>Hola ${data.name}</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      <a href="${data.resetLink}" class="button">Restablecer Contraseña</a>
      <p>Este enlace expirará en ${data.expiresIn}.</p>
      <p style="color: #6c757d; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este email.</p>
    `);
  }

  private renderEmailVerification(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>Hola ${data.name}</h2>
      <p>Gracias por registrarte en CampusMind.</p>
      <p>Por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
      <a href="${data.verificationLink}" class="button">Verificar Email</a>
      <p style="color: #6c757d; font-size: 14px;">Si no creaste esta cuenta, puedes ignorar este email.</p>
    `);
  }

  private renderStudyReminder(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>¡Hora de estudiar, ${data.name}!</h2>
      <div class="highlight">
        <p><strong>${data.pendingCards} tarjetas</strong> están esperando tu repaso en <strong>${data.subjectName}</strong></p>
      </div>
      <p>Mantén tu racha y refuerza tu memoria con solo unos minutos de práctica.</p>
      <a href="${data.studyLink}" class="button">Estudiar Ahora</a>
    `);
  }

  private renderAchievementUnlocked(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>¡Felicitaciones, ${data.name}!</h2>
      <div class="highlight" style="text-align: center;">
        ${data.achievementIcon ? `<div style="font-size: 48px;">${data.achievementIcon}</div>` : ''}
        <h3 style="margin: 10px 0; color: #667eea;">${data.achievementName}</h3>
        <p style="margin: 0; color: #6c757d;">${data.achievementDescription}</p>
        <p style="margin-top: 15px;"><strong>+${data.xpEarned} XP</strong></p>
      </div>
      <p>¡Sigue así! Cada logro te acerca más a tus metas.</p>
      <a href="https://campusmind.com/achievements" class="button">Ver Mis Logros</a>
    `);
  }

  private renderStreakWarning(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>¡${data.name}, tu racha está en riesgo!</h2>
      <div class="highlight" style="text-align: center;">
        <div class="stat-value">${data.currentStreak} días</div>
        <div class="stat-label">Racha actual</div>
      </div>
      <p>Te quedan <strong>${data.hoursRemaining} horas</strong> para mantener tu racha.</p>
      <p>¡No dejes que se pierda! Solo necesitas repasar algunas tarjetas.</p>
      <a href="${data.studyLink}" class="button">Mantener Mi Racha</a>
    `);
  }

  private renderWeeklySummary(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>Tu semana en CampusMind</h2>
      <p style="color: #6c757d;">${data.weekStart} - ${data.weekEnd}</p>

      <div class="highlight">
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
          <div class="stat">
            <div class="stat-value">${data.cardsReviewed}</div>
            <div class="stat-label">Tarjetas repasadas</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.quizzesTaken}</div>
            <div class="stat-label">Quizzes completados</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.correctAnswers}%</div>
            <div class="stat-label">Respuestas correctas</div>
          </div>
        </div>
      </div>

      <p><strong>XP ganado esta semana:</strong> ${data.xpEarned}</p>
      <p><strong>Nivel actual:</strong> ${data.currentLevel}</p>
      <p><strong>Racha:</strong> ${data.streakDays} días</p>
      ${data.topSubject ? `<p><strong>Materia más estudiada:</strong> ${data.topSubject}</p>` : ''}

      <a href="https://campusmind.com/stats" class="button">Ver Estadísticas Completas</a>
    `);
  }

  private renderQuizResults(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>Resultados de tu Quiz</h2>
      <div class="highlight" style="text-align: center;">
        <div class="stat-value">${data.score}%</div>
        <div class="stat-label">Puntuación</div>
      </div>
      <p>Respondiste correctamente ${data.correctAnswers} de ${data.totalQuestions} preguntas.</p>
      <a href="${data.reviewLink}" class="button">Revisar Respuestas</a>
    `);
  }

  private renderSubscriptionConfirmation(data: Record<string, unknown>): string {
    const features = data.features as string[];
    return this.wrapTemplate(`
      <h2>¡Gracias por suscribirte, ${data.name}!</h2>
      <div class="highlight">
        <h3 style="margin-top: 0;">Plan ${data.planName}</h3>
        <p><strong>${data.amount} ${data.currency}</strong>/mes</p>
        <p>Próximo cobro: ${data.nextBillingDate}</p>
      </div>
      <p>Tu suscripción incluye:</p>
      <ul>
        ${features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <a href="https://campusmind.com/billing" class="button">Gestionar Suscripción</a>
    `);
  }

  private renderSubscriptionCancelled(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>Tu suscripción ha sido cancelada</h2>
      <p>Hola ${data.name},</p>
      <p>Tu suscripción a CampusMind ${data.planName} ha sido cancelada.</p>
      <p>Tendrás acceso hasta el <strong>${data.accessUntil}</strong>.</p>
      <p>¿Cambiaste de opinión? Puedes reactivar tu suscripción en cualquier momento.</p>
      <a href="https://campusmind.com/pricing" class="button">Ver Planes</a>
    `);
  }

  private renderPaymentFailed(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>Problema con tu pago</h2>
      <p>Hola ${data.name},</p>
      <p>No pudimos procesar tu pago para la suscripción de CampusMind.</p>
      <p>Por favor actualiza tu método de pago para continuar disfrutando de todos los beneficios.</p>
      <a href="https://campusmind.com/billing/update-payment" class="button">Actualizar Pago</a>
      <p style="color: #6c757d; font-size: 14px;">Intentaremos cobrar nuevamente en ${data.retryDate}.</p>
    `);
  }

  private renderDefaultTemplate(data: Record<string, unknown>): string {
    return this.wrapTemplate(`
      <h2>${data.title || 'Notificación de CampusMind'}</h2>
      <p>${data.message || ''}</p>
      ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">${data.actionText || 'Ver más'}</a>` : ''}
    `);
  }

  // === Provider implementations ===

  private async sendWithSMTP(options: EmailOptions, html: string): Promise<{ success: boolean; messageId?: string }> {
    // In production, use nodemailer
    this.logger.log(`[SMTP Mock] Sending email to ${options.to}: ${options.subject}`);
    return { success: true, messageId: `smtp-${Date.now()}` };
  }

  private async sendWithSendGrid(options: EmailOptions, html: string): Promise<{ success: boolean; messageId?: string }> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured');
      return { success: false };
    }

    const payload: SendGridPayload = {
      personalizations: [{ to: [{ email: options.to }], subject: options.subject }],
      from: { email: this.config.from, name: this.config.fromName },
      content: [{ type: 'text/html', value: html }],
    };

    if (this.config.replyTo) {
      payload.reply_to = { email: this.config.replyTo };
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`SendGrid error: ${error}`);
      return { success: false };
    }

    return {
      success: true,
      messageId: response.headers.get('X-Message-Id') || undefined
    };
  }

  private async sendWithResend(options: EmailOptions, html: string): Promise<{ success: boolean; messageId?: string }> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn('Resend API key not configured');
      return { success: false };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.config.fromName} <${this.config.from}>`,
        to: options.to,
        subject: options.subject,
        html,
        reply_to: this.config.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Resend error: ${error}`);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  }

  private async sendWithSES(options: EmailOptions, html: string): Promise<{ success: boolean; messageId?: string }> {
    // In production, use AWS SDK
    this.logger.log(`[SES Mock] Sending email to ${options.to}: ${options.subject}`);
    return { success: true, messageId: `ses-${Date.now()}` };
  }
}

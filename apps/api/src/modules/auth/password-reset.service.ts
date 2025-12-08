import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly resetTokenExpiryHours: number;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {
    this.resetTokenExpiryHours = this.config.get<number>('PASSWORD_RESET_EXPIRY_HOURS', 1);
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  /**
   * Solicitar restablecimiento de contraseña
   * Genera un token y envía email
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Por seguridad, siempre retornamos el mismo mensaje
    // aunque el usuario no exista
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
      };
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Calcular fecha de expiración
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + this.resetTokenExpiryHours);

    // Guardar token hasheado en la base de datos
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Enviar email con el token sin hashear
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const userName = user.profile?.firstName || 'Usuario';

    const emailSent = await this.emailService.sendPasswordReset(email, {
      name: userName,
      resetLink,
      expiresIn: `${this.resetTokenExpiryHours} hora${this.resetTokenExpiryHours > 1 ? 's' : ''}`,
    });

    if (!emailSent) {
      this.logger.error(`Failed to send password reset email to ${email}`);
    } else {
      this.logger.log(`Password reset email sent to ${email}`);
    }

    return {
      message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  /**
   * Validar token de restablecimiento
   */
  async validateResetToken(email: string, token: string): Promise<{ valid: boolean }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    return { valid: !!user };
  }

  /**
   * Restablecer contraseña con token
   */
  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'El enlace de restablecimiento es inválido o ha expirado.',
      );
    }

    // Validar nueva contraseña
    if (newPassword.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres.',
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar tokens
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    this.logger.log(`Password reset successfully for user: ${user.id}`);

    return {
      message: 'Tu contraseña ha sido restablecida exitosamente.',
    };
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Validar nueva contraseña
    if (newPassword.length < 8) {
      throw new BadRequestException(
        'La nueva contraseña debe tener al menos 8 caracteres',
      );
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed successfully for user: ${userId}`);

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente.',
    };
  }
}

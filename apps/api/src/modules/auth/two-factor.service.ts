import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  valid: boolean;
  usedBackupCode?: boolean;
}

// In-memory storage for demo - use database in production
const userSecrets = new Map<string, {
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  usedBackupCodes: string[];
}>();

@Injectable()
export class TwoFactorService {
  private readonly issuer: string;
  private readonly codeDigits = 6;
  private readonly timeStep = 30; // seconds

  constructor(private readonly configService: ConfigService) {
    this.issuer = configService.get<string>('APP_NAME') || 'CampusMind';
  }

  /**
   * Generate 2FA setup for a user
   */
  async generateSetup(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    // Generate random secret (20 bytes = 160 bits)
    const secretBuffer = crypto.randomBytes(20);
    const secret = this.base32Encode(secretBuffer);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);

    // Store secret (not yet enabled)
    userSecrets.set(userId, {
      secret,
      enabled: false,
      backupCodes,
      usedBackupCodes: [],
    });

    // Generate OTPAuth URL
    const otpauthUrl = this.generateOtpauthUrl(userEmail, secret);

    // Generate QR code data URL
    const qrCodeDataUrl = await this.generateQrCodeDataUrl(otpauthUrl);

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Enable 2FA after verification
   */
  async enable(userId: string, code: string): Promise<{ success: boolean; backupCodes: string[] }> {
    const userData = userSecrets.get(userId);

    if (!userData) {
      throw new BadRequestException('2FA no ha sido configurado. Genera una nueva configuración primero.');
    }

    if (userData.enabled) {
      throw new BadRequestException('2FA ya está habilitado');
    }

    // Verify the code before enabling
    const isValid = this.verifyTOTP(userData.secret, code);

    if (!isValid) {
      throw new BadRequestException('Código inválido. Por favor intenta de nuevo.');
    }

    // Enable 2FA
    userData.enabled = true;
    userSecrets.set(userId, userData);

    return {
      success: true,
      backupCodes: userData.backupCodes,
    };
  }

  /**
   * Disable 2FA
   */
  async disable(userId: string, code: string): Promise<boolean> {
    const userData = userSecrets.get(userId);

    if (!userData || !userData.enabled) {
      throw new BadRequestException('2FA no está habilitado');
    }

    // Verify the code before disabling
    const verification = this.verify(userId, code);

    if (!verification.valid) {
      throw new UnauthorizedException('Código inválido');
    }

    // Remove 2FA data
    userSecrets.delete(userId);

    return true;
  }

  /**
   * Verify 2FA code
   */
  verify(userId: string, code: string): TwoFactorVerification {
    const userData = userSecrets.get(userId);

    if (!userData || !userData.enabled) {
      return { valid: true }; // 2FA not enabled, pass through
    }

    // First try TOTP verification
    if (this.verifyTOTP(userData.secret, code)) {
      return { valid: true, usedBackupCode: false };
    }

    // Then try backup code
    const backupCodeIndex = userData.backupCodes.findIndex(
      (bc) => bc === code && !userData.usedBackupCodes.includes(bc)
    );

    if (backupCodeIndex !== -1) {
      // Mark backup code as used
      userData.usedBackupCodes.push(code);
      userSecrets.set(userId, userData);

      return { valid: true, usedBackupCode: true };
    }

    return { valid: false };
  }

  /**
   * Check if user has 2FA enabled
   */
  isEnabled(userId: string): boolean {
    const userData = userSecrets.get(userId);
    return userData?.enabled ?? false;
  }

  /**
   * Get remaining backup codes count
   */
  getRemainingBackupCodesCount(userId: string): number {
    const userData = userSecrets.get(userId);
    if (!userData) return 0;

    return userData.backupCodes.length - userData.usedBackupCodes.length;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    const userData = userSecrets.get(userId);

    if (!userData || !userData.enabled) {
      throw new BadRequestException('2FA no está habilitado');
    }

    // Verify current code
    if (!this.verifyTOTP(userData.secret, code)) {
      throw new UnauthorizedException('Código inválido');
    }

    // Generate new backup codes
    const newBackupCodes = this.generateBackupCodes(8);

    userData.backupCodes = newBackupCodes;
    userData.usedBackupCodes = [];
    userSecrets.set(userId, userData);

    return newBackupCodes;
  }

  /**
   * Get 2FA status for user
   */
  getStatus(userId: string): {
    enabled: boolean;
    backupCodesRemaining: number;
    lastVerified?: Date;
  } {
    const userData = userSecrets.get(userId);

    return {
      enabled: userData?.enabled ?? false,
      backupCodesRemaining: userData
        ? userData.backupCodes.length - userData.usedBackupCodes.length
        : 0,
    };
  }

  // === Private methods ===

  /**
   * Generate TOTP code for current time
   */
  private generateTOTP(secret: string, counter?: number): string {
    const time = counter ?? Math.floor(Date.now() / 1000 / this.timeStep);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(time));

    const secretBuffer = this.base32Decode(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, this.codeDigits);
    return otp.toString().padStart(this.codeDigits, '0');
  }

  /**
   * Verify TOTP code with time window
   */
  private verifyTOTP(secret: string, code: string, window: number = 1): boolean {
    const currentTime = Math.floor(Date.now() / 1000 / this.timeStep);

    // Check current time and +/- window
    for (let i = -window; i <= window; i++) {
      const expectedCode = this.generateTOTP(secret, currentTime + i);
      if (this.timingSafeCompare(code, expectedCode)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Timing-safe string comparison
   */
  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Generate OTPAuth URL for authenticator apps
   */
  private generateOtpauthUrl(email: string, secret: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: this.issuer,
      algorithm: 'SHA1',
      digits: this.codeDigits.toString(),
      period: this.timeStep.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(this.issuer)}:${encodeURIComponent(email)}?${params.toString()}`;
  }

  /**
   * Generate QR code data URL
   */
  private async generateQrCodeDataUrl(text: string): Promise<string> {
    // Simple QR code generation using Google Charts API
    // In production, use a proper QR library like 'qrcode'
    const encodedText = encodeURIComponent(text);
    return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodedText}`;

    // For production with qrcode library:
    // const QRCode = require('qrcode');
    // return QRCode.toDataURL(text);
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format: XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  /**
   * Base32 decode
   */
  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanEncoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');

    let bits = 0;
    let value = 0;
    const result: number[] = [];

    for (const char of cleanEncoded) {
      value = (value << 5) | alphabet.indexOf(char);
      bits += 5;

      if (bits >= 8) {
        result.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(result);
  }
}

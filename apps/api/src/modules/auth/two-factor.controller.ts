import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { User } from "@prisma/client";
import { TwoFactorService } from "./two-factor.service";

class VerifyCodeDto {
  code: string;
}

@ApiTags("auth")
@Controller("auth/2fa")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /**
   * Get 2FA status
   */
  @Get("status")
  @ApiOperation({ summary: "Get 2FA status for current user" })
  @ApiResponse({ status: 200, description: "2FA status retrieved" })
  getStatus(@CurrentUser() user: User) {
    return this.twoFactorService.getStatus(user.id);
  }

  /**
   * Generate 2FA setup
   */
  @Post("setup")
  @ApiOperation({ summary: "Generate 2FA setup (QR code and secret)" })
  @ApiResponse({ status: 200, description: "2FA setup generated" })
  @ApiResponse({ status: 400, description: "2FA already enabled" })
  async setup(@CurrentUser() user: User) {
    if (this.twoFactorService.isEnabled(user.id)) {
      return {
        error: "2FA ya está habilitado",
        enabled: true,
      };
    }

    const setup = await this.twoFactorService.generateSetup(
      user.id,
      user.email,
    );

    return {
      message: "Escanea el código QR con tu aplicación de autenticación",
      qrCodeUrl: setup.qrCodeDataUrl,
      secret: setup.secret,
      manualEntryKey: setup.secret,
      instructions: [
        "1. Descarga Google Authenticator o Authy en tu teléfono",
        "2. Escanea el código QR o ingresa la clave manualmente",
        "3. Ingresa el código de 6 dígitos para verificar",
      ],
    };
  }

  /**
   * Enable 2FA after verification
   */
  @Post("enable")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Enable 2FA after verifying code" })
  @ApiResponse({ status: 200, description: "2FA enabled successfully" })
  @ApiResponse({ status: 400, description: "Invalid code or setup not found" })
  async enable(@CurrentUser() user: User, @Body() body: VerifyCodeDto) {
    const result = await this.twoFactorService.enable(user.id, body.code);

    return {
      success: true,
      message: "2FA habilitado exitosamente",
      backupCodes: result.backupCodes,
      warning:
        "Guarda estos códigos de respaldo en un lugar seguro. Los necesitarás si pierdes acceso a tu aplicación de autenticación.",
    };
  }

  /**
   * Disable 2FA
   */
  @Delete("disable")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Disable 2FA" })
  @ApiResponse({ status: 200, description: "2FA disabled successfully" })
  @ApiResponse({ status: 400, description: "2FA not enabled" })
  @ApiResponse({ status: 401, description: "Invalid code" })
  async disable(@CurrentUser() user: User, @Body() body: VerifyCodeDto) {
    await this.twoFactorService.disable(user.id, body.code);

    return {
      success: true,
      message: "2FA deshabilitado exitosamente",
    };
  }

  /**
   * Verify 2FA code
   */
  @Post("verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify 2FA code" })
  @ApiResponse({ status: 200, description: "Code verified" })
  @ApiResponse({ status: 401, description: "Invalid code" })
  async verify(@CurrentUser() user: User, @Body() body: VerifyCodeDto) {
    const result = this.twoFactorService.verify(user.id, body.code);

    if (!result.valid) {
      return {
        valid: false,
        message: "Código inválido",
      };
    }

    return {
      valid: true,
      usedBackupCode: result.usedBackupCode,
      message: result.usedBackupCode
        ? "Verificado con código de respaldo"
        : "Código verificado correctamente",
    };
  }

  /**
   * Regenerate backup codes
   */
  @Post("backup-codes/regenerate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Regenerate backup codes" })
  @ApiResponse({ status: 200, description: "Backup codes regenerated" })
  @ApiResponse({ status: 400, description: "2FA not enabled" })
  @ApiResponse({ status: 401, description: "Invalid code" })
  async regenerateBackupCodes(
    @CurrentUser() user: User,
    @Body() body: VerifyCodeDto,
  ) {
    const newCodes = await this.twoFactorService.regenerateBackupCodes(
      user.id,
      body.code,
    );

    return {
      success: true,
      backupCodes: newCodes,
      message: "Nuevos códigos de respaldo generados",
      warning:
        "Los códigos anteriores han sido invalidados. Guarda estos nuevos códigos en un lugar seguro.",
    };
  }

  /**
   * Get backup codes remaining count
   */
  @Get("backup-codes/count")
  @ApiOperation({ summary: "Get remaining backup codes count" })
  @ApiResponse({ status: 200, description: "Count retrieved" })
  getBackupCodesCount(@CurrentUser() user: User) {
    const remaining = this.twoFactorService.getRemainingBackupCodesCount(
      user.id,
    );

    return {
      remaining,
      total: 8,
      warning:
        remaining <= 2
          ? "Te quedan pocos códigos de respaldo. Considera regenerarlos."
          : null,
    };
  }
}

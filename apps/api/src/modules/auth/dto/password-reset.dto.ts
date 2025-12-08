import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RequestPasswordResetDto {
  @ApiProperty({
    description: "Email del usuario",
    example: "usuario@ejemplo.com",
  })
  @IsEmail({}, { message: "El email no es válido" })
  @IsNotEmpty({ message: "El email es requerido" })
  email!: string;
}

export class ValidateResetTokenDto {
  @ApiProperty({
    description: "Email del usuario",
    example: "usuario@ejemplo.com",
  })
  @IsEmail({}, { message: "El email no es válido" })
  @IsNotEmpty({ message: "El email es requerido" })
  email!: string;

  @ApiProperty({
    description: "Token de restablecimiento enviado por email",
  })
  @IsString({ message: "El token debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El token es requerido" })
  token!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: "Email del usuario",
    example: "usuario@ejemplo.com",
  })
  @IsEmail({}, { message: "El email no es válido" })
  @IsNotEmpty({ message: "El email es requerido" })
  email!: string;

  @ApiProperty({
    description: "Token de restablecimiento enviado por email",
  })
  @IsString({ message: "El token debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El token es requerido" })
  token!: string;

  @ApiProperty({
    description: "Nueva contraseña (mínimo 8 caracteres)",
    example: "NuevaContraseña123",
  })
  @IsString({ message: "La contraseña debe ser una cadena de texto" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: "Contraseña actual",
  })
  @IsString({ message: "La contraseña debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La contraseña actual es requerida" })
  currentPassword!: string;

  @ApiProperty({
    description: "Nueva contraseña (mínimo 8 caracteres)",
    example: "NuevaContraseña123",
  })
  @IsString({ message: "La contraseña debe ser una cadena de texto" })
  @MinLength(8, {
    message: "La nueva contraseña debe tener al menos 8 caracteres",
  })
  newPassword!: string;
}

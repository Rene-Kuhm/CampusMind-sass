import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "estudiante@universidad.edu" })
  @IsEmail({}, { message: "Email inválido" })
  email!: string;

  @ApiProperty({ example: "MiPassword123!" })
  @IsString()
  @MinLength(8)
  password!: string;
}

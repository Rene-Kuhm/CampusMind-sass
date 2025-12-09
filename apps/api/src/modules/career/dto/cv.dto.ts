import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  MaxLength,
} from "class-validator";

export class CreateCVDto {
  @ApiProperty({ example: "Juan Perez" })
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @ApiPropertyOptional({ example: "Estudiante de Ingenieria en Sistemas" })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example:
      "Desarrollador apasionado por la tecnologia con experiencia en React y Node.js",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @ApiPropertyOptional({ example: "juan.perez@email.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+54 11 1234-5678" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: "Buenos Aires, Argentina" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: "https://linkedin.com/in/juanperez" })
  @IsOptional()
  @IsUrl()
  linkedIn?: string;

  @ApiPropertyOptional({ example: "https://github.com/juanperez" })
  @IsOptional()
  @IsUrl()
  github?: string;

  @ApiPropertyOptional({ example: "https://juanperez.dev" })
  @IsOptional()
  @IsUrl()
  portfolio?: string;

  @ApiPropertyOptional({ example: "https://example.com/photo.jpg" })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}

export class UpdateCVDto extends PartialType(CreateCVDto) {}

export class CVResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  linkedIn?: string;

  @ApiPropertyOptional()
  github?: string;

  @ApiPropertyOptional()
  portfolio?: string;

  @ApiPropertyOptional()
  photoUrl?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: "array" })
  education?: unknown[];

  @ApiPropertyOptional({ type: "array" })
  experience?: unknown[];

  @ApiPropertyOptional({ type: "array" })
  skills?: unknown[];

  @ApiPropertyOptional({ type: "array" })
  projects?: unknown[];

  @ApiPropertyOptional({ type: "array" })
  certifications?: unknown[];

  @ApiPropertyOptional({ type: "array" })
  languages?: unknown[];
}

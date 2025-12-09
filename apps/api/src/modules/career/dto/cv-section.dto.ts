import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  IsUrl,
  MaxLength,
  Min,
  Max,
} from "class-validator";

// ============================================
// SKILL LEVEL & LANGUAGE LEVEL ENUMS
// ============================================

export enum SkillLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum LanguageLevel {
  BASIC = "BASIC",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  FLUENT = "FLUENT",
  NATIVE = "NATIVE",
}

// ============================================
// EDUCATION DTOs
// ============================================

export class CreateEducationDto {
  @ApiProperty({ example: "Universidad de Buenos Aires" })
  @IsString()
  @MaxLength(200)
  institution!: string;

  @ApiProperty({ example: "Licenciatura en Sistemas" })
  @IsString()
  @MaxLength(200)
  degree!: string;

  @ApiPropertyOptional({ example: "Ciencias de la Computacion" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  field?: string;

  @ApiProperty({ example: "2020-03-01" })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: "2024-12-15" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  gpa?: number;

  @ApiPropertyOptional({ example: "Especializado en desarrollo de software" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateEducationDto extends PartialType(CreateEducationDto) {}

// ============================================
// EXPERIENCE DTOs
// ============================================

export class CreateExperienceDto {
  @ApiProperty({ example: "Google" })
  @IsString()
  @MaxLength(200)
  company!: string;

  @ApiProperty({ example: "Software Engineer Intern" })
  @IsString()
  @MaxLength(200)
  position!: string;

  @ApiPropertyOptional({ example: "Mountain View, CA" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ example: "2023-06-01" })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: "2023-08-31" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({
    example: "Desarrollo de microservicios en Go y Kubernetes",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: ["Reduci latencia en 40%", "Implemente CI/CD pipeline"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

// ============================================
// SKILL DTOs
// ============================================

export class CreateSkillDto {
  @ApiProperty({ example: "TypeScript" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: SkillLevel, example: SkillLevel.ADVANCED })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @ApiPropertyOptional({ example: "Programacion" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

// ============================================
// PROJECT DTOs
// ============================================

export class CreateProjectDto {
  @ApiProperty({ example: "CampusMind - Plataforma de Estudio con IA" })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example:
      "Plataforma SaaS para estudiantes universitarios con flashcards, quizzes y asistente de IA",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: "https://github.com/user/campusmind" })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    example: ["Next.js", "NestJS", "PostgreSQL", "OpenAI"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-06-01" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: ["10k usuarios activos", "Featured en ProductHunt"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

// ============================================
// CERTIFICATION DTOs
// ============================================

export class CreateCertificationDto {
  @ApiProperty({ example: "AWS Certified Developer - Associate" })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: "Amazon Web Services" })
  @IsString()
  @MaxLength(200)
  issuer!: string;

  @ApiProperty({ example: "2024-01-15" })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ example: "2027-01-15" })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: "ABC123XYZ" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  credentialId?: string;

  @ApiPropertyOptional({
    example: "https://aws.amazon.com/verify/ABC123XYZ",
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateCertificationDto extends PartialType(CreateCertificationDto) {}

// ============================================
// LANGUAGE DTOs
// ============================================

export class CreateLanguageDto {
  @ApiProperty({ example: "Ingles" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: LanguageLevel, example: LanguageLevel.ADVANCED })
  @IsEnum(LanguageLevel)
  level!: LanguageLevel;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateLanguageDto extends PartialType(CreateLanguageDto) {}

// ============================================
// CV SECTION TYPES
// ============================================

export type CVSectionType =
  | "education"
  | "experience"
  | "skills"
  | "projects"
  | "certifications"
  | "languages";

export const CV_SECTION_TYPES: CVSectionType[] = [
  "education",
  "experience",
  "skills",
  "projects",
  "certifications",
  "languages",
];

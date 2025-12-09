import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
  Max,
} from "class-validator";

// ============================================
// INTERVIEW TYPE & STATUS ENUMS
// ============================================

export enum InterviewType {
  PHONE = "PHONE",
  VIDEO = "VIDEO",
  IN_PERSON = "IN_PERSON",
  TECHNICAL = "TECHNICAL",
  HR = "HR",
  FINAL = "FINAL",
}

export enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum InterviewCategory {
  BEHAVIORAL = "BEHAVIORAL",
  TECHNICAL = "TECHNICAL",
  SITUATIONAL = "SITUATIONAL",
  COMPANY = "COMPANY",
  ROLE = "ROLE",
  SALARY = "SALARY",
}

// ============================================
// CREATE INTERVIEW DTO
// ============================================

export class CreateInterviewDto {
  @ApiProperty({ enum: InterviewType, example: InterviewType.TECHNICAL })
  @IsEnum(InterviewType)
  type!: InterviewType;

  @ApiProperty({ example: "2024-03-25T14:00:00Z" })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number;

  @ApiPropertyOptional({ example: "https://meet.google.com/abc-defg-hij" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({
    example: "Repasar estructuras de datos y algoritmos",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: ["Que experiencia tenes con React?", "Contame sobre un proyecto desafiante"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questions?: string[];
}

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {
  @ApiPropertyOptional({ enum: InterviewStatus, example: InterviewStatus.COMPLETED })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @ApiPropertyOptional({ example: "Entrevista positiva, seguimos adelante" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}

// ============================================
// INTERVIEW RESPONSE DTO
// ============================================

export class InterviewResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiProperty({ enum: InterviewType })
  type!: InterviewType;

  @ApiProperty()
  scheduledAt!: Date;

  @ApiPropertyOptional()
  duration?: number;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [String] })
  questions!: string[];

  @ApiProperty({ enum: InterviewStatus })
  status!: InterviewStatus;

  @ApiPropertyOptional()
  feedback?: string;

  @ApiPropertyOptional()
  rating?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  application?: {
    id: string;
    job: {
      id: string;
      title: string;
      company: string;
    };
  };
}

// ============================================
// INTERVIEW PREP DTO
// ============================================

export class InterviewPrepRequestDto {
  @ApiPropertyOptional({
    enum: InterviewCategory,
    example: InterviewCategory.TECHNICAL,
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(InterviewCategory, { each: true })
  categories?: InterviewCategory[];

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  questionCount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  includeCompanyResearch?: boolean;
}

export class InterviewQuestionDto {
  @ApiProperty({ example: "Contame sobre un proyecto desafiante que hayas completado" })
  question!: string;

  @ApiProperty({ enum: InterviewCategory })
  category!: InterviewCategory;

  @ApiPropertyOptional()
  sampleAnswer?: string;

  @ApiProperty({ type: [String] })
  tips!: string[];
}

export class InterviewPrepResponseDto {
  @ApiProperty()
  interviewId!: string;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty()
  company!: string;

  @ApiProperty({ type: [InterviewQuestionDto] })
  questions!: InterviewQuestionDto[];

  @ApiPropertyOptional()
  companyResearch?: {
    about: string;
    culture: string;
    recentNews: string[];
    tips: string[];
  };

  @ApiProperty({ type: [String] })
  generalTips!: string[];

  @ApiProperty()
  generatedAt!: Date;
}

// ============================================
// INTERVIEW FILTER DTO
// ============================================

export class InterviewFilterDto {
  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @ApiPropertyOptional({ enum: InterviewType })
  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @ApiPropertyOptional({ example: "2024-03-01" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: "2024-03-31" })
  @IsOptional()
  @IsDateString()
  to?: string;
}

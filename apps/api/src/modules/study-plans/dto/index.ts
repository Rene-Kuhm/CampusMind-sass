import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsArray,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class CreateStudyPlanDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(12)
  hoursPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek?: number;

  @IsOptional()
  @IsBoolean()
  includeBreaks?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimes?: string[]; // 'morning', 'afternoon', 'evening'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[]; // Topics to cover
}

export class GeneratePlanDto {
  @IsString()
  subjectId: string;

  @IsDateString()
  examDate: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsNumber()
  hoursPerDay?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimes?: string[];
}

export class UpdatePlanItemDto {
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

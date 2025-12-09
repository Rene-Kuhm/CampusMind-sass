import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export enum GoalType {
  STUDY_HOURS = 'STUDY_HOURS',
  FLASHCARDS_REVIEW = 'FLASHCARDS_REVIEW',
  QUIZZES_COMPLETE = 'QUIZZES_COMPLETE',
  PAGES_READ = 'PAGES_READ',
  POMODOROS = 'POMODOROS',
  TASKS_COMPLETE = 'TASKS_COMPLETE',
  CUSTOM = 'CUSTOM',
}

export enum GoalUnit {
  HOURS = 'HOURS',
  MINUTES = 'MINUTES',
  COUNT = 'COUNT',
  PAGES = 'PAGES',
  PERCENTAGE = 'PERCENTAGE',
}

export enum GoalPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SEMESTER = 'SEMESTER',
  CUSTOM = 'CUSTOM',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(GoalType)
  type: GoalType;

  @IsInt()
  @Min(1)
  targetValue: number;

  @IsEnum(GoalUnit)
  unit: GoalUnit;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsEnum(GoalPeriod)
  periodType?: GoalPeriod;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsString()
  reminderTime?: string;
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentValue?: number;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsString()
  reminderTime?: string;
}

export class AddProgressDto {
  @IsInt()
  @Min(1)
  value: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GoalQueryDto {
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsEnum(GoalPeriod)
  periodType?: GoalPeriod;
}

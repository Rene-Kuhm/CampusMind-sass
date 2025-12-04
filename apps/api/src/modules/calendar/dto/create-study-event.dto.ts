import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export enum StudyEventType {
  STUDY_SESSION = 'STUDY_SESSION',
  REVIEW = 'REVIEW',
  EXAM = 'EXAM',
  DEADLINE = 'DEADLINE',
  CLASS = 'CLASS',
  BREAK = 'BREAK',
}

export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateStudyEventDto {
  @ApiProperty({
    example: 'Estudiar Capítulo 3 - Derivadas',
    description: 'Título del evento de estudio',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'Revisar ejemplos del libro y resolver ejercicios',
    description: 'Descripción o notas del evento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: '2024-03-15T10:00:00Z',
    description: 'Fecha y hora de inicio',
  })
  @IsDateString()
  startTime!: string;

  @ApiProperty({
    example: '2024-03-15T12:00:00Z',
    description: 'Fecha y hora de fin',
  })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({
    enum: StudyEventType,
    default: StudyEventType.STUDY_SESSION,
    description: 'Tipo de evento',
  })
  @IsOptional()
  @IsEnum(StudyEventType)
  type?: StudyEventType;

  @ApiPropertyOptional({
    description: 'ID de la materia asociada',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'ID del recurso a estudiar',
  })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({
    example: '#6366f1',
    description: 'Color del evento (hex)',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    enum: RecurrenceType,
    default: RecurrenceType.NONE,
    description: 'Tipo de recurrencia',
  })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrence?: RecurrenceType;

  @ApiPropertyOptional({
    example: 15,
    description: 'Minutos antes para recordatorio',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  reminderMinutes?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica si es un evento de todo el día',
  })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;
}

export class UpdateStudyEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ enum: StudyEventType })
  @IsOptional()
  @IsEnum(StudyEventType)
  type?: StudyEventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: RecurrenceType })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrence?: RecurrenceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  reminderMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    description: 'Marcar evento como completado',
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

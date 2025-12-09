import {
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWellnessLogDto {
  @ApiPropertyOptional({
    description: 'Date of the wellness log (defaults to today)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Hours of sleep (0-24)',
    example: 7.5,
    minimum: 0,
    maximum: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @ApiPropertyOptional({
    description: 'Sleep quality rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  sleepQuality?: number;

  @ApiPropertyOptional({
    description: 'Mood score rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  moodScore?: number;

  @ApiPropertyOptional({
    description: 'Stress level rating (1-5, where 1 is lowest stress)',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  stressLevel?: number;

  @ApiPropertyOptional({
    description: 'Energy level rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  energyLevel?: number;

  @ApiPropertyOptional({
    description: 'Minutes of exercise',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exerciseMinutes?: number;

  @ApiPropertyOptional({
    description: 'Minutes of meditation',
    example: 15,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  meditationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Number of breaks taken during study/work',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breaksCount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the day',
    example: 'Felt productive today, completed my study goals',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'List of things to be grateful for (recommended 3)',
    example: ['Good weather', 'Finished exam', 'Time with friends'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gratitude?: string[];
}

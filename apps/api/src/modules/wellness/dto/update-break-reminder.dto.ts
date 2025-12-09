import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  Min,
  Max,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBreakReminderDto {
  @ApiPropertyOptional({
    description: 'Whether break reminders are enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Interval between breaks in minutes (based on 52-17 rule by default)',
    example: 52,
    minimum: 10,
    maximum: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  intervalMinutes?: number;

  @ApiPropertyOptional({
    description: 'Duration of each break in minutes',
    example: 17,
    minimum: 5,
    maximum: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  breakMinutes?: number;

  @ApiPropertyOptional({
    description: 'Start time for reminders (HH:mm format)',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time for reminders (HH:mm format)',
    example: '22:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Active days (0=Sunday, 1=Monday, ..., 6=Saturday)',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  activeDays?: number[];

  @ApiPropertyOptional({
    description: 'Whether to play sound on break reminder',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show notification on break reminder',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;
}

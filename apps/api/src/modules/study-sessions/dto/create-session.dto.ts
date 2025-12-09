import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from "class-validator";

export enum StudySessionType {
  POMODORO = "POMODORO",
  DEEP_WORK = "DEEP_WORK",
  EXAM_MODE = "EXAM_MODE",
  CUSTOM = "CUSTOM",
}

export class CreateSessionDto {
  @ApiPropertyOptional({ example: "subject-id-123" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ enum: StudySessionType, example: StudySessionType.POMODORO })
  @IsOptional()
  @IsEnum(StudySessionType)
  type?: StudySessionType;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  targetMinutes?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  breakMinutes?: number;
}

export class EndSessionDto {
  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  focusScore?: number;

  @ApiPropertyOptional({ example: "Sesión muy productiva" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

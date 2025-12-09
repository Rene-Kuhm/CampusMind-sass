import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, MaxLength } from "class-validator";
import { JobResponseDto } from "./job.dto";

// ============================================
// APPLICATION STATUS ENUM
// ============================================

export enum ApplicationStatus {
  SAVED = "SAVED",
  APPLIED = "APPLIED",
  SCREENING = "SCREENING",
  INTERVIEWING = "INTERVIEWING",
  OFFER = "OFFER",
  REJECTED = "REJECTED",
  ACCEPTED = "ACCEPTED",
  WITHDRAWN = "WITHDRAWN",
}

// ============================================
// CREATE APPLICATION DTO
// ============================================

export class CreateApplicationDto {
  @ApiPropertyOptional({
    example:
      "Estimados, me presento como candidato para el puesto de desarrollador...",
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  coverLetter?: string;

  @ApiPropertyOptional({ example: "Referido por Juan de RRHH" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// ============================================
// UPDATE APPLICATION DTO
// ============================================

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    enum: ApplicationStatus,
    example: ApplicationStatus.INTERVIEWING,
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ example: "Agenda entrevista tecnica para el lunes" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// ============================================
// APPLICATION RESPONSE DTO
// ============================================

export class ApplicationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty({ enum: ApplicationStatus })
  status!: ApplicationStatus;

  @ApiPropertyOptional()
  coverLetter?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  appliedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => JobResponseDto })
  job?: JobResponseDto;

  @ApiPropertyOptional({ type: "array" })
  interviews?: unknown[];
}

// ============================================
// APPLICATION FILTER DTO
// ============================================

export class ApplicationFilterDto {
  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

// ============================================
// APPLICATION STATS DTO
// ============================================

export class ApplicationStatsDto {
  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 3 })
  applied!: number;

  @ApiProperty({ example: 2 })
  screening!: number;

  @ApiProperty({ example: 2 })
  interviewing!: number;

  @ApiProperty({ example: 1 })
  offers!: number;

  @ApiProperty({ example: 1 })
  rejected!: number;

  @ApiProperty({ example: 1 })
  accepted!: number;
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
} from "class-validator";

// ============================================
// JOB TYPE ENUM
// ============================================

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  INTERNSHIP = "INTERNSHIP",
  FREELANCE = "FREELANCE",
  CONTRACT = "CONTRACT",
}

// ============================================
// JOB FILTER DTO
// ============================================

export class JobFilterDto {
  @ApiPropertyOptional({ example: "desarrollador" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: JobType, example: JobType.INTERNSHIP })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @ApiPropertyOptional({ example: "Buenos Aires" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @ApiPropertyOptional({ example: "Ingenieria en Sistemas" })
  @IsOptional()
  @IsString()
  career?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minYear?: number;

  @ApiPropertyOptional({ example: ["React", "TypeScript"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ============================================
// JOB RESPONSE DTO
// ============================================

export class JobResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  company!: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiProperty()
  isRemote!: boolean;

  @ApiProperty({ enum: JobType })
  type!: JobType;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  requirements!: string[];

  @ApiProperty({ type: [String] })
  benefits!: string[];

  @ApiPropertyOptional()
  salaryMin?: number;

  @ApiPropertyOptional()
  salaryMax?: number;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional()
  career?: string;

  @ApiPropertyOptional()
  minYear?: number;

  @ApiProperty({ type: [String] })
  skills!: string[];

  @ApiPropertyOptional()
  applyUrl?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  hasApplied?: boolean;
}

// ============================================
// PAGINATED JOBS RESPONSE
// ============================================

export class PaginatedJobsResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  data!: JobResponseDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}

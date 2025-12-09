import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsArray,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateTutorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  expertise: string[];

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  availability?: any; // JSON with schedule
}

export class UpdateTutorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  availability?: any;
}

export class BookSessionDto {
  @IsString()
  tutorId: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(15)
  @Max(180)
  duration: number;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  duration?: number;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  tutorNotes?: string;

  @IsOptional()
  @IsString()
  studentNotes?: string;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class TutorQueryDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsBoolean()
  freeOnly?: boolean;

  @IsOptional()
  @IsNumber()
  maxRate?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'sessions' | 'rate';
}

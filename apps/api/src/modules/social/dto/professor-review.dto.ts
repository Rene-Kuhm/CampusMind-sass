import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProfessorReviewDto {
  @ApiProperty({ description: "Overall rating (1-5)", minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating!: number;

  @ApiProperty({ description: "Difficulty rating (1-5)", minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyRating!: number;

  @ApiProperty({ description: "Clarity rating (1-5)", minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  clarityRating!: number;

  @ApiProperty({ description: "Helpfulness rating (1-5)", minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  helpfulnessRating!: number;

  @ApiPropertyOptional({ description: "Course name where you had this professor" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  courseName?: string;

  @ApiPropertyOptional({ description: "Grade received in the course" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  grade?: string;

  @ApiProperty({ description: "Would you take this professor again?" })
  @IsBoolean()
  wouldTakeAgain!: boolean;

  @ApiPropertyOptional({
    description: "Was this course taken for credit?",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isForCredit?: boolean;

  @ApiPropertyOptional({ description: "Your review comment", maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({
    description: "Tags for the review",
    example: ["clear explanations", "tough grader"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Submit review anonymously?",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class ProfessorReviewResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  professorId!: string;

  @ApiProperty()
  overallRating!: number;

  @ApiProperty()
  difficultyRating!: number;

  @ApiProperty()
  clarityRating!: number;

  @ApiProperty()
  helpfulnessRating!: number;

  @ApiPropertyOptional()
  courseName?: string | null;

  @ApiPropertyOptional()
  grade?: string | null;

  @ApiProperty()
  wouldTakeAgain!: boolean;

  @ApiProperty()
  isForCredit!: boolean;

  @ApiPropertyOptional()
  comment?: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  isAnonymous!: boolean;

  @ApiProperty()
  isApproved!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ description: "Reviewer info (only if not anonymous)" })
  reviewer?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export class ProfessorReviewsListDto {
  @ApiProperty({ type: [ProfessorReviewResponseDto] })
  reviews!: ProfessorReviewResponseDto[];

  @ApiProperty({ description: "Average overall rating" })
  averageRating!: number;

  @ApiProperty({ description: "Average difficulty rating" })
  averageDifficulty!: number;

  @ApiProperty({ description: "Average clarity rating" })
  averageClarity!: number;

  @ApiProperty({ description: "Average helpfulness rating" })
  averageHelpfulness!: number;

  @ApiProperty({ description: "Percentage who would take again" })
  wouldTakeAgainPercent!: number;

  @ApiProperty({ description: "Total number of reviews" })
  totalReviews!: number;
}

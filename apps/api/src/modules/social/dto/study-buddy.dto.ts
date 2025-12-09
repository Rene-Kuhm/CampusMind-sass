import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum StudyStyleEnum {
  FORMAL = "FORMAL",
  PRACTICAL = "PRACTICAL",
  BALANCED = "BALANCED",
}

export class UpdateBuddyPreferencesDto {
  @ApiPropertyOptional({ description: "Is user actively searching for study buddies?" })
  @IsOptional()
  @IsBoolean()
  isSearching?: boolean;

  @ApiPropertyOptional({
    description: "Subject IDs to find buddies for",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional({
    description: "Preferred study style",
    enum: StudyStyleEnum,
  })
  @IsOptional()
  @IsEnum(StudyStyleEnum)
  studyStyle?: StudyStyleEnum;

  @ApiPropertyOptional({
    description: "Availability schedule (JSON object with days/times)",
    example: {
      monday: ["09:00-12:00", "14:00-18:00"],
      wednesday: ["10:00-15:00"],
    },
  })
  @IsOptional()
  @IsObject()
  availability?: Record<string, string[]>;

  @ApiPropertyOptional({ description: "Only match with same university?" })
  @IsOptional()
  @IsBoolean()
  sameUniversity?: boolean;

  @ApiPropertyOptional({ description: "Only match with same career?" })
  @IsOptional()
  @IsBoolean()
  sameCareer?: boolean;

  @ApiPropertyOptional({ description: "Only match with same year?" })
  @IsOptional()
  @IsBoolean()
  sameYear?: boolean;
}

export class BuddyPreferencesResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  isSearching!: boolean;

  @ApiProperty({ type: [String] })
  subjects!: string[];

  @ApiProperty({ enum: StudyStyleEnum })
  studyStyle!: StudyStyleEnum;

  @ApiPropertyOptional()
  availability?: Record<string, string[]> | null;

  @ApiProperty()
  sameUniversity!: boolean;

  @ApiProperty()
  sameCareer!: boolean;

  @ApiProperty()
  sameYear!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export enum MatchStatusEnum {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
}

export class BuddyMatchResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  matchScore!: number;

  @ApiProperty({ type: [String] })
  commonSubjects!: string[];

  @ApiProperty({ enum: MatchStatusEnum })
  status!: MatchStatusEnum;

  @ApiProperty()
  initiatedBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: "The matched user info" })
  matchedUser!: {
    id: string;
    firstName?: string;
    lastName?: string;
    university?: string;
    career?: string;
    year?: number;
    studyStyle?: string;
  };
}

export class BuddyMatchesListDto {
  @ApiProperty({ type: [BuddyMatchResponseDto] })
  matches!: BuddyMatchResponseDto[];

  @ApiProperty({ description: "Total number of potential matches" })
  total!: number;
}

export class UpdateMatchStatusDto {
  @ApiProperty({
    description: "New status for the match",
    enum: MatchStatusEnum,
  })
  @IsEnum(MatchStatusEnum)
  status!: MatchStatusEnum;
}

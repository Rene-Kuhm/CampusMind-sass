import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ShareDeckDto {
  @ApiProperty({ description: "Title for the shared deck", maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: "Description of the deck", maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: "Tags for discoverability",
    type: [String],
    example: ["calculus", "derivatives", "final exam"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Related subject name" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @ApiPropertyOptional({ description: "University name" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  university?: string;
}

export class SharedDeckResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  deckId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiPropertyOptional()
  subject?: string | null;

  @ApiPropertyOptional()
  university?: string | null;

  @ApiProperty()
  downloadCount!: number;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  ratingCount!: number;

  @ApiProperty()
  isApproved!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ description: "Deck card count" })
  cardCount?: number;

  @ApiPropertyOptional({ description: "Sharer info" })
  sharedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export class SharedDecksListDto {
  @ApiProperty({ type: [SharedDeckResponseDto] })
  decks!: SharedDeckResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class SharedDecksQueryDto {
  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: "Search by title, tags, or subject" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by subject" })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: "Filter by university" })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({
    description: "Sort by: rating, downloads, newest",
    default: "newest",
  })
  @IsOptional()
  @IsString()
  sortBy?: "rating" | "downloads" | "newest";
}

export class RateDeckDto {
  @ApiProperty({ description: "Rating (1-5)", minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: "Optional comment", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class DeckRatingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sharedDeckId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  rating!: number;

  @ApiPropertyOptional()
  comment?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ description: "Rater info (if not anonymous)" })
  ratedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export class DeckRatingsListDto {
  @ApiProperty({ type: [DeckRatingResponseDto] })
  ratings!: DeckRatingResponseDto[];

  @ApiProperty()
  averageRating!: number;

  @ApiProperty()
  totalRatings!: number;

  @ApiProperty({ description: "Rating distribution (1-5)" })
  distribution!: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

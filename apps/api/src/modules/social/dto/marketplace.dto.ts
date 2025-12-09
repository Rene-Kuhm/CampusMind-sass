import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum ListingTypeEnum {
  BOOK = "BOOK",
  NOTES = "NOTES",
  CALCULATOR = "CALCULATOR",
  EQUIPMENT = "EQUIPMENT",
  TUTORING_SERVICE = "TUTORING_SERVICE",
  OTHER = "OTHER",
}

export enum ItemConditionEnum {
  NEW = "NEW",
  LIKE_NEW = "LIKE_NEW",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
}

export enum ListingStatusEnum {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  RESERVED = "RESERVED",
  EXPIRED = "EXPIRED",
  DELETED = "DELETED",
}

export class CreateMarketplaceListingDto {
  @ApiProperty({ description: "Listing title", maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: "Detailed description", maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: "Type of listing", enum: ListingTypeEnum })
  @IsEnum(ListingTypeEnum)
  type!: ListingTypeEnum;

  @ApiPropertyOptional({
    description: "Item condition",
    enum: ItemConditionEnum,
    default: ItemConditionEnum.GOOD,
  })
  @IsOptional()
  @IsEnum(ItemConditionEnum)
  condition?: ItemConditionEnum;

  @ApiProperty({ description: "Price", minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: "Currency code", default: "ARS" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: "Is the price negotiable?", default: true })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiPropertyOptional({ description: "Related subject/category" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: "ISBN (for books)" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string;

  @ApiPropertyOptional({ description: "Author (for books)" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional({ description: "Edition (for books)" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  edition?: string;

  @ApiPropertyOptional({ description: "Image URLs", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: "Location for pickup" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: "Offers delivery?", default: false })
  @IsOptional()
  @IsBoolean()
  isDelivery?: boolean;

  @ApiPropertyOptional({ description: "Offers pickup?", default: true })
  @IsOptional()
  @IsBoolean()
  isPickup?: boolean;
}

export class UpdateMarketplaceListingDto {
  @ApiPropertyOptional({ description: "Listing title", maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: "Detailed description", maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "Type of listing", enum: ListingTypeEnum })
  @IsOptional()
  @IsEnum(ListingTypeEnum)
  type?: ListingTypeEnum;

  @ApiPropertyOptional({ description: "Item condition", enum: ItemConditionEnum })
  @IsOptional()
  @IsEnum(ItemConditionEnum)
  condition?: ItemConditionEnum;

  @ApiPropertyOptional({ description: "Price", minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: "Currency code" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: "Is the price negotiable?" })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiPropertyOptional({ description: "Related subject/category" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: "ISBN (for books)" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string;

  @ApiPropertyOptional({ description: "Author (for books)" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional({ description: "Edition (for books)" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  edition?: string;

  @ApiPropertyOptional({ description: "Image URLs", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: "Location for pickup" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: "Offers delivery?" })
  @IsOptional()
  @IsBoolean()
  isDelivery?: boolean;

  @ApiPropertyOptional({ description: "Offers pickup?" })
  @IsOptional()
  @IsBoolean()
  isPickup?: boolean;

  @ApiPropertyOptional({ description: "Listing status", enum: ListingStatusEnum })
  @IsOptional()
  @IsEnum(ListingStatusEnum)
  status?: ListingStatusEnum;
}

export class MarketplaceListingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sellerId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: ListingTypeEnum })
  type!: ListingTypeEnum;

  @ApiProperty({ enum: ItemConditionEnum })
  condition!: ItemConditionEnum;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  isNegotiable!: boolean;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiPropertyOptional()
  isbn?: string | null;

  @ApiPropertyOptional()
  author?: string | null;

  @ApiPropertyOptional()
  edition?: string | null;

  @ApiProperty({ type: [String] })
  images!: string[];

  @ApiPropertyOptional()
  location?: string | null;

  @ApiProperty()
  isDelivery!: boolean;

  @ApiProperty()
  isPickup!: boolean;

  @ApiProperty({ enum: ListingStatusEnum })
  status!: ListingStatusEnum;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ description: "Seller info" })
  seller?: {
    id: string;
    firstName?: string;
    lastName?: string;
    university?: string;
  };
}

export class MarketplaceListingsListDto {
  @ApiProperty({ type: [MarketplaceListingResponseDto] })
  listings!: MarketplaceListingResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class MarketplaceQueryDto {
  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: "Filter by listing type", enum: ListingTypeEnum })
  @IsOptional()
  @IsEnum(ListingTypeEnum)
  type?: ListingTypeEnum;

  @ApiPropertyOptional({ description: "Filter by category/subject" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "Search query" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Minimum price" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: "Maximum price" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: "Filter by condition", enum: ItemConditionEnum })
  @IsOptional()
  @IsEnum(ItemConditionEnum)
  condition?: ItemConditionEnum;
}

export class CreateMarketplaceMessageDto {
  @ApiProperty({ description: "Message content", maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  content!: string;
}

export class MarketplaceMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  listingId!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  receiverId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ description: "Sender info" })
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export class MarketplaceMessagesListDto {
  @ApiProperty({ type: [MarketplaceMessageResponseDto] })
  messages!: MarketplaceMessageResponseDto[];

  @ApiProperty()
  total!: number;
}

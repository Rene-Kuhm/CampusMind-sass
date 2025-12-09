import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum GroupRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export enum PostType {
  DISCUSSION = 'DISCUSSION',
  QUESTION = 'QUESTION',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  RESOURCE = 'RESOURCE',
  POLL = 'POLL',
}

export class CreateGroupDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(500)
  maxMembers?: number;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(500)
  maxMembers?: number;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;
}

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type: string;

  @IsInt()
  @Min(1)
  targetValue: number;

  @IsString()
  unit: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;
}

export class GroupQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsBoolean()
  publicOnly?: boolean;
}

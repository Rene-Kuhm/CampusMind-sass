import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateThreadDto {
  @IsString()
  categoryId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateThreadDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateReplyDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class VoteDto {
  @IsInt()
  @Min(-1)
  @Max(1)
  value: number;
}

export class ThreadQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'recent' | 'popular' | 'unanswered';
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

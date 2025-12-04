import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { StudyStyle, ContentDepth } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Ingeniería en Sistemas' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  career?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  year?: number;

  @ApiPropertyOptional({ example: 'Universidad de Buenos Aires' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  university?: string;

  @ApiPropertyOptional({ enum: StudyStyle, example: 'PRACTICAL' })
  @IsOptional()
  @IsEnum(StudyStyle)
  studyStyle?: StudyStyle;

  @ApiPropertyOptional({ enum: ContentDepth, example: 'INTERMEDIATE' })
  @IsOptional()
  @IsEnum(ContentDepth)
  contentDepth?: ContentDepth;

  @ApiPropertyOptional({ example: 'es' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  preferredLang?: string;
}

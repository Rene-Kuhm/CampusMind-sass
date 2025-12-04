import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  IsBoolean,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ResourceType, ResourceLevel } from '@prisma/client';

export class CreateResourceDto {
  @ApiProperty({ example: 'Cálculo Vol. 1 - Stewart' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: ['James Stewart'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authors?: string[];

  @ApiPropertyOptional({ example: 'Libro de cálculo diferencial e integral' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://openstax.org/details/books/calculus-volume-1' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ enum: ResourceType, example: 'BOOK' })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiPropertyOptional({ enum: ResourceLevel, example: 'INTERMEDIATE' })
  @IsOptional()
  @IsEnum(ResourceLevel)
  level?: ResourceLevel;

  @ApiPropertyOptional({ example: 'es' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOpenAccess?: boolean;

  @ApiPropertyOptional({ example: 'CC-BY-4.0' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  license?: string;

  @ApiPropertyOptional({ example: 'W2741809807', description: 'ID en OpenAlex u otra fuente' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ example: 'openalex', description: 'Fuente externa del recurso' })
  @IsOptional()
  @IsString()
  externalSource?: string;
}

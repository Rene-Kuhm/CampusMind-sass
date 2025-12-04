import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateFlashcardDto {
  @ApiProperty({
    example: '¿Qué es una derivada?',
    description: 'Pregunta o frente de la tarjeta',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  front!: string;

  @ApiProperty({
    example: 'La derivada mide la tasa de cambio instantánea de una función.',
    description: 'Respuesta o reverso de la tarjeta',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  back!: string;

  @ApiPropertyOptional({
    description: 'ID del deck al que pertenece',
  })
  @IsOptional()
  @IsString()
  deckId?: string;

  @ApiPropertyOptional({
    example: ['cálculo', 'derivadas', 'matemáticas'],
    description: 'Tags para categorizar la tarjeta',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 'f\'(x) = lim[h→0] (f(x+h) - f(x))/h',
    description: 'Fórmula o código relacionado (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formula?: string;
}

export class UpdateFlashcardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  front?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  back?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deckId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formula?: string;
}

export class CreateDeckDto {
  @ApiProperty({
    example: 'Cálculo Diferencial - Derivadas',
    description: 'Nombre del deck',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: 'Tarjetas para estudiar conceptos de derivadas',
    description: 'Descripción del deck',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'ID de la materia asociada',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    example: '#6366f1',
    description: 'Color del deck (hex)',
  })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateDeckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}

export class ReviewFlashcardDto {
  @ApiProperty({
    example: 3,
    description: 'Calidad de la respuesta (1-5, donde 1=fail, 5=perfecto)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  quality!: number;
}

export class GenerateFlashcardsDto {
  @ApiProperty({
    description: 'ID del recurso del cual generar flashcards',
  })
  @IsString()
  resourceId!: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Número máximo de flashcards a generar',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxCards?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Incluir fórmulas/código si están presentes',
  })
  @IsOptional()
  @IsBoolean()
  includeFormulas?: boolean;
}

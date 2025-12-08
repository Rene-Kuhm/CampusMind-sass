import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class GenerateAudioDto {
  @ApiProperty({ description: 'Texto a convertir en audio' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({
    description: 'Voz a utilizar',
    enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
    default: 'Kore',
  })
  @IsOptional()
  @IsEnum(['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'])
  voice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

  @ApiPropertyOptional({ description: 'Velocidad del audio (0.5-2.0)', default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  speed?: number;
}

export class GeneratePodcastDto {
  @ApiProperty({ description: 'ID del recurso para generar el podcast' })
  @IsString()
  resourceId!: string;

  @ApiPropertyOptional({
    description: 'Voz a utilizar',
    enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
    default: 'Kore',
  })
  @IsOptional()
  @IsEnum(['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'])
  voice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

  @ApiPropertyOptional({
    description: 'Estilo del podcast',
    enum: ['formal', 'casual'],
    default: 'casual',
  })
  @IsOptional()
  @IsEnum(['formal', 'casual'])
  style?: 'formal' | 'casual';

  @ApiPropertyOptional({
    description: 'Duración aproximada',
    enum: ['short', 'medium', 'long'],
    default: 'medium',
  })
  @IsOptional()
  @IsEnum(['short', 'medium', 'long'])
  duration?: 'short' | 'medium' | 'long';
}

export class GenerateQuestionsDto {
  @ApiProperty({ description: 'ID del recurso para generar preguntas' })
  @IsString()
  resourceId!: string;

  @ApiPropertyOptional({ description: 'Cantidad de preguntas a generar', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  count?: number;

  @ApiPropertyOptional({
    description: 'Tipos de preguntas',
    type: [String],
    enum: ['multiple_choice', 'true_false', 'short_answer', 'fill_blank'],
  })
  @IsOptional()
  @IsArray()
  types?: Array<'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank'>;

  @ApiPropertyOptional({
    description: 'Dificultad de las preguntas',
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed',
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'mixed'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

export class GenerateFlashcardsDto {
  @ApiProperty({ description: 'ID del recurso para generar flashcards' })
  @IsString()
  resourceId!: string;

  @ApiPropertyOptional({ description: 'Cantidad de flashcards a generar', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  count?: number;

  @ApiPropertyOptional({ description: 'Incluir fórmulas matemáticas', default: true })
  @IsOptional()
  @IsBoolean()
  includeFormulas?: boolean;
}

export class GenerateStudyGuideDto {
  @ApiProperty({ description: 'ID del recurso para generar la guía' })
  @IsString()
  resourceId!: string;
}

export class GenerateFromContentDto {
  @ApiProperty({ description: 'Contenido de texto para procesar' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Título del contenido' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class GenerateQuestionsFromContentDto extends GenerateFromContentDto {
  @ApiPropertyOptional({ description: 'Cantidad de preguntas', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  count?: number;

  @ApiPropertyOptional({
    description: 'Tipos de preguntas',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  types?: Array<'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank'>;

  @ApiPropertyOptional({
    description: 'Dificultad',
    enum: ['easy', 'medium', 'hard', 'mixed'],
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'mixed'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

export class GenerateFlashcardsFromContentDto extends GenerateFromContentDto {
  @ApiPropertyOptional({ description: 'Cantidad de flashcards', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  count?: number;
}

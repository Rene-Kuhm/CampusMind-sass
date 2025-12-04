import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class QueryRagDto {
  @ApiProperty({
    example: 'Explícame el teorema de Stokes con un ejemplo práctico',
    description: 'Pregunta o consulta del estudiante',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  query: string;

  @ApiPropertyOptional({
    description: 'ID de la materia para limitar la búsqueda',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'IDs de recursos específicos para buscar',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];

  @ApiPropertyOptional({
    example: 5,
    description: 'Número de chunks a recuperar',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({
    example: 0.7,
    description: 'Score mínimo de similitud (0-1)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number;

  @ApiPropertyOptional({
    enum: ['formal', 'practical', 'balanced'],
    description: 'Estilo de respuesta',
  })
  @IsOptional()
  @IsEnum(['formal', 'practical', 'balanced'])
  style?: 'formal' | 'practical' | 'balanced';

  @ApiPropertyOptional({
    enum: ['basic', 'intermediate', 'advanced'],
    description: 'Profundidad de la respuesta',
  })
  @IsOptional()
  @IsEnum(['basic', 'intermediate', 'advanced'])
  depth?: 'basic' | 'intermediate' | 'advanced';
}

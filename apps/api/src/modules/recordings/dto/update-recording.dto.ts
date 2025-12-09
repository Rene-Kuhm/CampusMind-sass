import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';

export class UpdateRecordingDto {
  @ApiPropertyOptional({ example: 'Clase de Cálculo - Integrales (Actualizado)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Explicación detallada de integrales' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'clfxyz123' })
  @IsOptional()
  @IsString()
  subjectId?: string | null;

  @ApiPropertyOptional({ example: 'Aula 302, Edificio B' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'Dra. María García' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professorName?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ example: ['cálculo', 'derivadas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isProcessed?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({ example: 'clfabc789', description: 'ID of linked transcription' })
  @IsOptional()
  @IsString()
  transcriptionId?: string | null;
}

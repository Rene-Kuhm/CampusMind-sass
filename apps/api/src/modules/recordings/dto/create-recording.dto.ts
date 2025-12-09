import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsUrl,
  MaxLength,
  MinLength,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateRecordingDto {
  @ApiProperty({ example: 'Clase de Cálculo - Integrales' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Explicación de integrales definidas e indefinidas' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'https://storage.example.com/recordings/abc123.mp3' })
  @IsString()
  @IsUrl()
  fileUrl!: string;

  @ApiProperty({ example: 'clase-calculo-2024-01-15.mp3' })
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: 15728640, description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  fileSize!: number;

  @ApiProperty({ example: 'audio/mpeg', description: 'MIME type of the audio file' })
  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @ApiProperty({ example: 3600, description: 'Duration in seconds' })
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiPropertyOptional({ example: 'clfxyz123' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'Aula 301, Edificio A' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'Dr. Juan Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professorName?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ example: ['cálculo', 'integrales', 'matemáticas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

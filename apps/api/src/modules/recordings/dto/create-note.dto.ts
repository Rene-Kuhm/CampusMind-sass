import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';

export class CreateRecordingNoteDto {
  @ApiProperty({ example: 'El profesor mencionó que este tema es clave para el examen' })
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({
    example: 1234,
    description: 'Timestamp in seconds (optional, can be a general note)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timestamp?: number;
}

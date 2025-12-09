import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({ example: 1234, description: 'Timestamp in seconds from the start' })
  @IsInt()
  @Min(0)
  timestamp!: number;

  @ApiProperty({ example: 'Definición importante de integral definida' })
  @IsString()
  @MaxLength(200)
  label!: string;

  @ApiPropertyOptional({ example: '#FF5733', description: 'Color in hex format' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}

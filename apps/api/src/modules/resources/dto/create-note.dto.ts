import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Este capítulo explica muy bien las derivadas parciales' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from "class-validator";

export class CreateGradeDto {
  @ApiProperty({ example: "Primer Parcial" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxScore?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  weight?: number;

  @ApiPropertyOptional({ example: "2024-03-15" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: "Muy buen resultado" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: "category-id-123" })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

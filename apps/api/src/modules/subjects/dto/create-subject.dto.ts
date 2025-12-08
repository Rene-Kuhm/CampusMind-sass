import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";

export class CreateSubjectDto {
  @ApiProperty({ example: "Análisis Matemático I" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: "Cálculo diferencial e integral de una variable",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: "Ingeniería en Sistemas" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  career?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  year?: number;

  @ApiPropertyOptional({ example: "1er cuatrimestre" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  semester?: string;

  @ApiPropertyOptional({ example: "#6366f1" })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: "Color debe ser un código hex válido",
  })
  color?: string;
}

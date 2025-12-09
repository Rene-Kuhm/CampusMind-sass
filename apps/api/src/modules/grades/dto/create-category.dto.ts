import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  Matches,
} from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Parciales" })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ example: 0.6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;

  @ApiPropertyOptional({ example: "#6366f1" })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: "Color debe ser un código hex válido",
  })
  color?: string;
}

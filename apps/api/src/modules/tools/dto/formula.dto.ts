import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsObject,
  MinLength,
  MaxLength,
  Min,
} from "class-validator";

export class CreateFormulaDto {
  @ApiProperty({
    example: "Integral por partes",
    description: "Nombre de la formula",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: "\\int u \\, dv = uv - \\int v \\, du",
    description: "Formula en formato LaTeX",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  latex!: string;

  @ApiPropertyOptional({
    example: "Tecnica de integracion para productos de funciones",
    description: "Descripcion de la formula",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: { u: "funcion a derivar", dv: "funcion a integrar" },
    description: "Variables de la formula y sus significados",
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional({
    example: "\\int x \\cdot e^x \\, dx = x \\cdot e^x - e^x + C",
    description: "Ejemplo de uso de la formula",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  example?: string;

  @ApiPropertyOptional({
    example: ["integrales", "calculo", "tecnicas"],
    description: "Tags para categorizar la formula",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 0,
    description: "Orden de la formula en la hoja",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateFormulaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  latex?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  example?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class FormulaResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sheetId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  latex!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  variables?: Record<string, string> | null;

  @ApiPropertyOptional()
  example?: string | null;

  @ApiProperty()
  tags!: string[];

  @ApiProperty()
  order!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class ReorderFormulasDto {
  @ApiProperty({
    example: [
      { id: "formula-1", order: 0 },
      { id: "formula-2", order: 1 },
    ],
    description: "Lista de formulas con su nuevo orden",
  })
  @IsArray()
  formulas!: { id: string; order: number }[];
}

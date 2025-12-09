import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsUUID,
} from "class-validator";

export class CreateFormulaSheetDto {
  @ApiProperty({
    example: "Formulas de Calculo Integral",
    description: "Titulo de la hoja de formulas",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: "Formulas esenciales para integrales definidas e indefinidas",
    description: "Descripcion de la hoja de formulas",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: "Matematicas",
    description: "Categoria de la hoja (Matematicas, Fisica, Quimica, etc.)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: "ID de la materia asociada",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Si la hoja es publica para la comunidad",
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateFormulaSheetDto {
  @ApiPropertyOptional({
    example: "Formulas de Calculo Diferencial",
    description: "Titulo actualizado",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: "Descripcion actualizada",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: "Categoria actualizada",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: "ID de la materia asociada",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: "Visibilidad publica",
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class FormulaSheetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiPropertyOptional()
  subjectId?: string | null;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  formulaCount?: number;
}

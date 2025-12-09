import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
  MinLength,
  MaxLength,
} from "class-validator";

export class MindMapNodeDto {
  @ApiProperty({ description: "Node ID" })
  @IsString()
  id!: string;

  @ApiProperty({ description: "Node label/text" })
  @IsString()
  label!: string;

  @ApiPropertyOptional({ description: "X position" })
  @IsOptional()
  x?: number;

  @ApiPropertyOptional({ description: "Y position" })
  @IsOptional()
  y?: number;

  @ApiPropertyOptional({ description: "Node color" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: "Node shape" })
  @IsOptional()
  @IsString()
  shape?: string;

  @ApiPropertyOptional({ description: "Parent node ID" })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class MindMapEdgeDto {
  @ApiProperty({ description: "Source node ID" })
  @IsString()
  source!: string;

  @ApiProperty({ description: "Target node ID" })
  @IsString()
  target!: string;

  @ApiPropertyOptional({ description: "Edge label" })
  @IsOptional()
  @IsString()
  label?: string;
}

export class MindMapDataDto {
  @ApiProperty({ description: "List of nodes", type: [MindMapNodeDto] })
  @IsArray()
  nodes!: MindMapNodeDto[];

  @ApiProperty({ description: "List of edges", type: [MindMapEdgeDto] })
  @IsArray()
  edges!: MindMapEdgeDto[];

  @ApiPropertyOptional({ description: "Root node ID" })
  @IsOptional()
  @IsString()
  rootId?: string;

  @ApiPropertyOptional({ description: "Layout type (tree, radial, force)" })
  @IsOptional()
  @IsString()
  layout?: string;
}

export class CreateMindMapDto {
  @ApiProperty({
    example: "Estructura del Sistema Nervioso",
    description: "Titulo del mapa mental",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: "Mapa conceptual de la anatomia del sistema nervioso",
    description: "Descripcion del mapa mental",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: "ID de la materia asociada" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({
    description: "Datos del mapa (nodos, aristas, layout)",
    type: MindMapDataDto,
  })
  @IsObject()
  data!: MindMapDataDto;

  @ApiPropertyOptional({
    example: ["biologia", "neurociencia"],
    description: "Tags para categorizar el mapa",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Si el mapa es publico",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateMindMapDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: MindMapDataDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: "Thumbnail image (base64 or URL)" })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class GenerateMindMapDto {
  @ApiProperty({ description: "ID del recurso del cual generar el mapa" })
  @IsString()
  resourceId!: string;

  @ApiPropertyOptional({
    example: 10,
    description: "Numero maximo de nodos principales",
    default: 10,
  })
  @IsOptional()
  maxNodes?: number;

  @ApiPropertyOptional({
    description: "Profundidad maxima del arbol",
    default: 3,
  })
  @IsOptional()
  maxDepth?: number;
}

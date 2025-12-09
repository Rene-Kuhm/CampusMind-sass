import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  IsIn,
} from "class-validator";

export const SUPPORTED_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "sql",
  "r",
  "matlab",
  "bash",
  "html",
  "css",
  "json",
  "yaml",
  "markdown",
  "latex",
  "other",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export class CreateCodeSnippetDto {
  @ApiProperty({
    example: "Binary Search Algorithm",
    description: "Titulo del snippet de codigo",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: "Implementacion eficiente de busqueda binaria en un array ordenado",
    description: "Descripcion del snippet",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    description: "Codigo fuente del snippet",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  code!: string;

  @ApiProperty({
    example: "python",
    description: "Lenguaje de programacion",
    enum: SUPPORTED_LANGUAGES,
  })
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  language!: SupportedLanguage;

  @ApiPropertyOptional({
    example: ["algoritmos", "busqueda", "arrays"],
    description: "Tags para categorizar el snippet",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "ID de la materia asociada",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Si el snippet es publico para la comunidad",
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: "Si el snippet puede ser ejecutado (solo Python y JavaScript)",
  })
  @IsOptional()
  @IsBoolean()
  isExecutable?: boolean;
}

export class UpdateCodeSnippetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  code?: string;

  @ApiPropertyOptional({
    enum: SUPPORTED_LANGUAGES,
  })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  language?: SupportedLanguage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExecutable?: boolean;
}

export class ExecuteCodeDto {
  @ApiPropertyOptional({
    example: '{"input": [1, 2, 3, 4, 5], "target": 3}',
    description: "Entrada opcional para la ejecucion (JSON string)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  input?: string;

  @ApiPropertyOptional({
    example: 5000,
    description: "Timeout en milisegundos (max 10000)",
  })
  @IsOptional()
  timeout?: number;
}

export class CodeSnippetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  language!: string;

  @ApiProperty()
  tags!: string[];

  @ApiPropertyOptional()
  subjectId?: string | null;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  isExecutable!: boolean;

  @ApiPropertyOptional()
  lastOutput?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ExecutionResultDto {
  @ApiProperty({
    example: true,
    description: "Si la ejecucion fue exitosa",
  })
  success!: boolean;

  @ApiPropertyOptional({
    example: "[0, 1, 1, 2, 3, 5, 8, 13]",
    description: "Salida de la ejecucion",
  })
  output?: string;

  @ApiPropertyOptional({
    example: "NameError: name 'x' is not defined",
    description: "Mensaje de error si la ejecucion fallo",
  })
  error?: string;

  @ApiProperty({
    example: 45,
    description: "Tiempo de ejecucion en milisegundos",
  })
  executionTime!: number;
}

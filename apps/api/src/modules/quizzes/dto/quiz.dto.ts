import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  SHORT_ANSWER = "SHORT_ANSWER",
  ESSAY = "ESSAY",
}

export enum DifficultyLevel {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export class QuestionOptionDto {
  @ApiProperty({ example: "La derivada es la tasa de cambio instantánea" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({
    example: "¿Cuál es la definición de derivada?",
    description: "Texto de la pregunta",
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  text!: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiPropertyOptional({
    type: [QuestionOptionDto],
    description: "Opciones para multiple choice o true/false",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @ApiPropertyOptional({
    example: "La derivada mide la tasa de cambio instantánea de una función.",
    description: "Respuesta correcta para short answer/essay",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  correctAnswer?: string;

  @ApiPropertyOptional({
    example:
      "Recuerda que la derivada representa la pendiente de la recta tangente.",
    description: "Explicación de la respuesta",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  explanation?: string;

  @ApiPropertyOptional({
    enum: DifficultyLevel,
    default: DifficultyLevel.MEDIUM,
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({
    example: 2,
    description: "Puntos que vale la pregunta",
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  points?: number;
}

export class CreateQuizDto {
  @ApiProperty({
    example: "Parcial 1 - Derivadas",
    description: "Título del simulacro",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: "Simulacro de examen parcial sobre derivadas y sus aplicaciones",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: "ID de la materia asociada",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    example: 60,
    description: "Tiempo límite en minutos (null = sin límite)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  timeLimitMinutes?: number;

  @ApiPropertyOptional({
    example: 70,
    description: "Porcentaje mínimo para aprobar",
    default: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Mostrar respuestas correctas al finalizar",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showAnswers?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: "Mezclar orden de las preguntas",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({
    type: [CreateQuestionDto],
    description: "Preguntas del quiz",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}

export class UpdateQuizDto {
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
  @IsInt()
  @Min(1)
  @Max(300)
  timeLimitMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAnswers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;
}

export class AnswerDto {
  @ApiProperty({ description: "ID de la pregunta" })
  @IsString()
  questionId!: string;

  @ApiPropertyOptional({
    example: "opt_123",
    description: "ID de la opción seleccionada (para multiple choice)",
  })
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @ApiPropertyOptional({
    example: "La derivada es la tasa de cambio...",
    description: "Respuesta de texto (para short answer/essay)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  textAnswer?: string;
}

export class SubmitQuizDto {
  @ApiProperty({
    type: [AnswerDto],
    description: "Respuestas del usuario",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @ApiPropertyOptional({
    example: 45,
    description: "Tiempo empleado en minutos",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentMinutes?: number;
}

export class GenerateQuizDto {
  @ApiProperty({
    description: "ID del recurso del cual generar el quiz",
  })
  @IsString()
  resourceId!: string;

  @ApiPropertyOptional({
    example: 10,
    description: "Número de preguntas a generar",
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(50)
  questionCount?: number;

  @ApiPropertyOptional({
    enum: DifficultyLevel,
    description: "Dificultad del quiz",
    default: DifficultyLevel.MEDIUM,
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({
    type: [String],
    enum: QuestionType,
    description: "Tipos de preguntas a incluir",
    default: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(QuestionType, { each: true })
  questionTypes?: QuestionType[];
}

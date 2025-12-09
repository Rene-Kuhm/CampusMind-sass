import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  MaxLength,
} from "class-validator";

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class CreateTaskDto {
  @ApiProperty({ example: "Entregar TP de Algoritmos" })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: "Implementar el algoritmo de Dijkstra" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: "subject-id-123" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: "2024-03-20T23:59:00Z" })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: "2024-03-19T10:00:00Z" })
  @IsOptional()
  @IsDateString()
  reminderAt?: string;

  @ApiPropertyOptional({ example: ["programación", "grafos"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

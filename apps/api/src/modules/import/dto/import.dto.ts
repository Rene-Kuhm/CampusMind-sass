import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum ImportType {
  FLASHCARDS = "flashcards",
  NOTES = "notes",
  TASKS = "tasks",
  MINDMAPS = "mindmaps",
  RESOURCES = "resources",
  CALENDAR = "calendar",
}

export enum ImportFormat {
  CSV = "csv",
  JSON = "json",
  MARKDOWN = "markdown",
  ANKI = "anki",
  QUIZLET = "quizlet",
  NOTION = "notion",
  ICAL = "ical",
}

export class FlashcardImportItem {
  @ApiProperty({ description: "Front of the card (question)" })
  @IsString()
  front!: string;

  @ApiProperty({ description: "Back of the card (answer)" })
  @IsString()
  back!: string;

  @ApiPropertyOptional({ description: "Tags for the card" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Formula or code" })
  @IsOptional()
  @IsString()
  formula?: string;
}

export class TaskImportItem {
  @ApiProperty({ description: "Task title" })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: "Task description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Due date (ISO string)" })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: "Priority: low, medium, high" })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class NoteImportItem {
  @ApiProperty({ description: "Note title" })
  @IsString()
  title!: string;

  @ApiProperty({ description: "Note content (markdown supported)" })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: "Tags for the note" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ImportDataDto {
  @ApiProperty({
    enum: ImportType,
    description: "Type of data to import",
  })
  @IsEnum(ImportType)
  type!: ImportType;

  @ApiProperty({
    enum: ImportFormat,
    description: "Format of the imported data",
  })
  @IsEnum(ImportFormat)
  format!: ImportFormat;

  @ApiPropertyOptional({ description: "Target subject ID" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: "Target deck ID (for flashcards)" })
  @IsOptional()
  @IsString()
  deckId?: string;

  @ApiProperty({ description: "Raw data content (string or JSON)" })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: "Column mapping for CSV imports" })
  @IsOptional()
  @IsObject()
  columnMapping?: Record<string, string>;
}

export class ImportFlashcardsDto {
  @ApiPropertyOptional({ description: "Target deck ID" })
  @IsOptional()
  @IsString()
  deckId?: string;

  @ApiPropertyOptional({ description: "New deck name (if no deckId)" })
  @IsOptional()
  @IsString()
  deckName?: string;

  @ApiPropertyOptional({ description: "Subject ID for new deck" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ type: [FlashcardImportItem], description: "Flashcards to import" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashcardImportItem)
  cards!: FlashcardImportItem[];
}

export class ImportTasksDto {
  @ApiPropertyOptional({ description: "Subject ID to associate tasks" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ type: [TaskImportItem], description: "Tasks to import" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskImportItem)
  tasks!: TaskImportItem[];
}

export class ImportNotesDto {
  @ApiPropertyOptional({ description: "Subject ID to associate notes" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ type: [NoteImportItem], description: "Notes to import" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteImportItem)
  notes!: NoteImportItem[];
}

export class ParseCsvDto {
  @ApiProperty({ description: "CSV content as string" })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: "Delimiter character", default: "," })
  @IsOptional()
  @IsString()
  delimiter?: string;

  @ApiPropertyOptional({ description: "Whether first row is header", default: true })
  @IsOptional()
  hasHeader?: boolean;
}

export class ImportResultDto {
  @ApiProperty({ description: "Number of items successfully imported" })
  imported!: number;

  @ApiProperty({ description: "Number of items that failed" })
  failed!: number;

  @ApiProperty({ description: "List of errors if any" })
  errors!: string[];

  @ApiPropertyOptional({ description: "IDs of created items" })
  createdIds?: string[];
}

export class ExportDataDto {
  @ApiProperty({
    enum: ImportType,
    description: "Type of data to export",
  })
  @IsEnum(ImportType)
  type!: ImportType;

  @ApiProperty({
    enum: ["csv", "json"],
    description: "Export format",
  })
  @IsEnum(["csv", "json"])
  format!: "csv" | "json";

  @ApiPropertyOptional({ description: "Subject ID to filter by" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: "Deck ID (for flashcards export)" })
  @IsOptional()
  @IsString()
  deckId?: string;
}

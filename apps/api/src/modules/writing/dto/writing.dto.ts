import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUUID,
} from "class-validator";

// ============================================
// ENUMS
// ============================================

export enum DocumentType {
  ESSAY = "ESSAY",
  RESEARCH_PAPER = "RESEARCH_PAPER",
  REPORT = "REPORT",
  THESIS = "THESIS",
  ARTICLE = "ARTICLE",
  SUMMARY = "SUMMARY",
  NOTES = "NOTES",
  OTHER = "OTHER",
}

export enum WritingStyle {
  ACADEMIC = "ACADEMIC",
  FORMAL = "FORMAL",
  INFORMAL = "INFORMAL",
  TECHNICAL = "TECHNICAL",
  CREATIVE = "CREATIVE",
  PERSUASIVE = "PERSUASIVE",
}

export enum AnalysisType {
  GRAMMAR = "GRAMMAR",
  STYLE = "STYLE",
  CLARITY = "CLARITY",
  TONE = "TONE",
  STRUCTURE = "STRUCTURE",
  ALL = "ALL",
}

export enum ImprovementType {
  CLARITY = "CLARITY",
  CONCISENESS = "CONCISENESS",
  ENGAGEMENT = "ENGAGEMENT",
  ACADEMIC_TONE = "ACADEMIC_TONE",
  FLOW = "FLOW",
  VOCABULARY = "VOCABULARY",
}

// ============================================
// CREATE DOCUMENT DTO
// ============================================

export class CreateDocumentDto {
  @ApiProperty({
    example: "Analysis of Climate Change Effects",
    description: "Title of the document",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({
    example: "This essay explores the multifaceted effects of climate change...",
    description: "Content of the document",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string;

  @ApiPropertyOptional({
    enum: DocumentType,
    example: DocumentType.ESSAY,
    description: "Type of document",
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    enum: WritingStyle,
    example: WritingStyle.ACADEMIC,
    description: "Writing style for the document",
  })
  @IsOptional()
  @IsEnum(WritingStyle)
  style?: WritingStyle;

  @ApiPropertyOptional({
    example: "clxyz123abc",
    description: "Subject ID to associate the document with",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    example: ["climate", "environment", "science"],
    description: "Tags for the document",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: "essay-template-001",
    description: "Template ID used to create the document",
  })
  @IsOptional()
  @IsString()
  templateId?: string;
}

// ============================================
// UPDATE DOCUMENT DTO
// ============================================

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    example: "Updated: Analysis of Climate Change Effects",
    description: "Updated title of the document",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({
    example: "This updated essay explores...",
    description: "Updated content of the document",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string;

  @ApiPropertyOptional({
    enum: DocumentType,
    example: DocumentType.RESEARCH_PAPER,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    enum: WritingStyle,
    example: WritingStyle.FORMAL,
  })
  @IsOptional()
  @IsEnum(WritingStyle)
  style?: WritingStyle;

  @ApiPropertyOptional({
    example: "clxyz123abc",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    example: ["updated", "tags"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: false,
    description: "Whether the document is archived",
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

// ============================================
// ANALYZE TEXT DTO
// ============================================

export class AnalyzeTextDto {
  @ApiProperty({
    example: "The quick brown fox jumps over the lazy dog. Their was a mistake here.",
    description: "Text to analyze for grammar and style issues",
  })
  @IsString()
  @MinLength(10)
  @MaxLength(50000)
  text!: string;

  @ApiPropertyOptional({
    enum: AnalysisType,
    example: AnalysisType.ALL,
    description: "Type of analysis to perform",
    default: AnalysisType.ALL,
  })
  @IsOptional()
  @IsEnum(AnalysisType)
  analysisType?: AnalysisType;

  @ApiPropertyOptional({
    enum: WritingStyle,
    example: WritingStyle.ACADEMIC,
    description: "Expected writing style for context",
  })
  @IsOptional()
  @IsEnum(WritingStyle)
  expectedStyle?: WritingStyle;

  @ApiPropertyOptional({
    example: "en",
    description: "Language code (ISO 639-1)",
    default: "en",
  })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;
}

// ============================================
// IMPROVE TEXT DTO
// ============================================

export class ImproveTextDto {
  @ApiProperty({
    example: "The thing about climate change is that it is very bad and affects many things.",
    description: "Text to improve",
  })
  @IsString()
  @MinLength(10)
  @MaxLength(50000)
  text!: string;

  @ApiPropertyOptional({
    enum: ImprovementType,
    isArray: true,
    example: [ImprovementType.CLARITY, ImprovementType.ACADEMIC_TONE],
    description: "Types of improvements to apply",
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ImprovementType, { each: true })
  improvementTypes?: ImprovementType[];

  @ApiPropertyOptional({
    enum: WritingStyle,
    example: WritingStyle.ACADEMIC,
    description: "Target writing style",
  })
  @IsOptional()
  @IsEnum(WritingStyle)
  targetStyle?: WritingStyle;

  @ApiPropertyOptional({
    example: "Environmental Science",
    description: "Context or subject area for better suggestions",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  context?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether to preserve the original meaning strictly",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  preserveMeaning?: boolean;
}

// ============================================
// PLAGIARISM CHECK DTO
// ============================================

export class PlagiarismCheckDto {
  @ApiProperty({
    example: "This is the text content to check for potential plagiarism...",
    description: "Text to check for plagiarism",
  })
  @IsString()
  @MinLength(50)
  @MaxLength(50000)
  text!: string;

  @ApiPropertyOptional({
    example: ["https://example.com/source1.pdf"],
    description: "URLs to exclude from plagiarism check (e.g., cited sources)",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedSources?: string[];

  @ApiPropertyOptional({
    example: 0.7,
    description: "Similarity threshold (0-1) above which to flag as potential plagiarism",
    default: 0.7,
  })
  @IsOptional()
  @Min(0)
  @Max(1)
  similarityThreshold?: number;
}

// ============================================
// SAVE VERSION DTO
// ============================================

export class SaveVersionDto {
  @ApiPropertyOptional({
    example: "Added conclusion section",
    description: "Description of changes in this version",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeDescription?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether this is a major version",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMajorVersion?: boolean;
}

// ============================================
// QUERY PARAMS DTOs
// ============================================

export class GetDocumentsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: "Page number",
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: "Items per page",
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: DocumentType,
    description: "Filter by document type",
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    example: "clxyz123abc",
    description: "Filter by subject ID",
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    example: "climate",
    description: "Search term for title or content",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Include archived documents",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;

  @ApiPropertyOptional({
    example: ["climate", "research"],
    description: "Filter by tags",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class GetTemplatesQueryDto {
  @ApiPropertyOptional({
    enum: DocumentType,
    description: "Filter templates by document type",
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    enum: WritingStyle,
    description: "Filter templates by writing style",
  })
  @IsOptional()
  @IsEnum(WritingStyle)
  style?: WritingStyle;

  @ApiPropertyOptional({
    example: "essay",
    description: "Search term for template name or description",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class AnalysisIssueDto {
  @ApiProperty({ example: "grammar" })
  type!: string;

  @ApiProperty({ example: "Subject-verb disagreement" })
  message!: string;

  @ApiProperty({ example: "Their was" })
  text!: string;

  @ApiProperty({ example: "There was" })
  suggestion!: string;

  @ApiProperty({ example: 45 })
  startIndex!: number;

  @ApiProperty({ example: 54 })
  endIndex!: number;

  @ApiProperty({ example: "high" })
  severity!: string;
}

export class AnalysisResultDto {
  @ApiProperty({ type: [AnalysisIssueDto] })
  issues!: AnalysisIssueDto[];

  @ApiProperty({ example: 85 })
  overallScore!: number;

  @ApiProperty({
    example: { grammar: 80, style: 90, clarity: 85, tone: 88 },
  })
  scores!: Record<string, number>;

  @ApiProperty({ example: 250 })
  wordCount!: number;

  @ApiProperty({ example: 12 })
  sentenceCount!: number;

  @ApiProperty({ example: 20.8 })
  averageWordsPerSentence!: number;

  @ApiProperty({ example: 12.5 })
  readabilityScore!: number;
}

export class ImprovementSuggestionDto {
  @ApiProperty({ example: "The thing about climate change is that it is very bad" })
  original!: string;

  @ApiProperty({ example: "Climate change poses significant environmental challenges" })
  improved!: string;

  @ApiProperty({ example: "Replaced vague language with more precise academic terminology" })
  explanation!: string;

  @ApiProperty({ example: "CLARITY" })
  type!: string;
}

export class ImproveResultDto {
  @ApiProperty({
    example: "Climate change poses significant environmental challenges that affect numerous ecosystems globally.",
  })
  improvedText!: string;

  @ApiProperty({ type: [ImprovementSuggestionDto] })
  suggestions!: ImprovementSuggestionDto[];

  @ApiProperty({ example: 15 })
  changesCount!: number;

  @ApiProperty({ example: 25 })
  improvementPercentage!: number;
}

export class PlagiarismMatchDto {
  @ApiProperty({ example: "This exact phrase was found in another source" })
  matchedText!: string;

  @ApiProperty({ example: 0.95 })
  similarity!: number;

  @ApiProperty({ example: "https://example.com/original-source" })
  possibleSource?: string;

  @ApiProperty({ example: 100 })
  startIndex!: number;

  @ApiProperty({ example: 150 })
  endIndex!: number;
}

export class PlagiarismResultDto {
  @ApiProperty({ example: 12.5 })
  overallSimilarity!: number;

  @ApiProperty({ example: false })
  isPlagiarismDetected!: boolean;

  @ApiProperty({ type: [PlagiarismMatchDto] })
  matches!: PlagiarismMatchDto[];

  @ApiProperty({ example: 2500 })
  analyzedCharacters!: number;

  @ApiProperty({ example: "2024-01-15T10:30:00Z" })
  checkedAt!: string;
}

export class DocumentVersionDto {
  @ApiProperty({ example: "clversion123" })
  id!: string;

  @ApiProperty({ example: 1 })
  versionNumber!: number;

  @ApiProperty({ example: "Added introduction paragraph" })
  changeDescription?: string;

  @ApiProperty({ example: 2500 })
  wordCount!: number;

  @ApiProperty({ example: "2024-01-15T10:30:00Z" })
  createdAt!: string;

  @ApiProperty({ example: true })
  isMajorVersion!: boolean;
}

export class WritingTemplateDto {
  @ApiProperty({ example: "essay-template-001" })
  id!: string;

  @ApiProperty({ example: "Academic Essay Template" })
  name!: string;

  @ApiProperty({ example: "A structured template for academic essays with introduction, body, and conclusion sections." })
  description!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.ESSAY })
  type!: DocumentType;

  @ApiProperty({ enum: WritingStyle, example: WritingStyle.ACADEMIC })
  style!: WritingStyle;

  @ApiProperty({ example: "# Introduction\n\n[Your thesis statement here]\n\n# Body\n\n## Main Point 1\n\n..." })
  content!: string;

  @ApiProperty({ example: ["academic", "essay", "structured"] })
  tags!: string[];
}

export class DocumentResponseDto {
  @ApiProperty({ example: "cldoc123abc" })
  id!: string;

  @ApiProperty({ example: "Analysis of Climate Change Effects" })
  title!: string;

  @ApiProperty({ example: "This essay explores the multifaceted effects..." })
  content!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.ESSAY })
  type!: DocumentType;

  @ApiProperty({ enum: WritingStyle, example: WritingStyle.ACADEMIC })
  style!: WritingStyle;

  @ApiProperty({ example: 2500 })
  wordCount!: number;

  @ApiProperty({ example: ["climate", "environment"] })
  tags!: string[];

  @ApiProperty({ example: 3 })
  currentVersion!: number;

  @ApiProperty({ example: false })
  isArchived!: boolean;

  @ApiProperty({ example: "2024-01-15T10:30:00Z" })
  createdAt!: string;

  @ApiProperty({ example: "2024-01-16T14:20:00Z" })
  updatedAt!: string;
}

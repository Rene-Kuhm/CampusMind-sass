import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { WritingService } from "./writing.service";
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  AnalyzeTextDto,
  ImproveTextDto,
  PlagiarismCheckDto,
  SaveVersionDto,
  GetDocumentsQueryDto,
  GetTemplatesQueryDto,
  DocumentResponseDto,
  AnalysisResultDto,
  ImproveResultDto,
  PlagiarismResultDto,
  DocumentVersionDto,
  WritingTemplateDto,
} from "./dto";

@ApiTags("writing")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("writing")
export class WritingController {
  constructor(private readonly writingService: WritingService) {}

  // ============================================
  // DOCUMENT CRUD ENDPOINTS
  // ============================================

  @Post()
  @ApiOperation({
    summary: "Create a new writing document",
    description: "Creates a new writing document with optional template",
  })
  @ApiResponse({
    status: 201,
    description: "Document created successfully",
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createDocument(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.writingService.createDocument(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all documents",
    description: "Retrieves all writing documents for the current user with pagination and filters",
  })
  @ApiResponse({
    status: 200,
    description: "Documents retrieved successfully",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "type", required: false, enum: ["ESSAY", "RESEARCH_PAPER", "REPORT", "THESIS", "ARTICLE", "SUMMARY", "NOTES", "OTHER"] })
  @ApiQuery({ name: "subjectId", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "includeArchived", required: false, type: Boolean })
  async getDocuments(
    @CurrentUser("id") userId: string,
    @Query() query: GetDocumentsQueryDto,
  ) {
    return this.writingService.getDocuments(userId, query);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get document by ID",
    description: "Retrieves a specific writing document by its ID",
  })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({
    status: 200,
    description: "Document retrieved successfully",
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  async getDocumentById(
    @CurrentUser("id") userId: string,
    @Param("id") documentId: string,
  ) {
    return this.writingService.getDocumentById(userId, documentId);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update document",
    description: "Updates an existing writing document",
  })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({
    status: 200,
    description: "Document updated successfully",
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  async updateDocument(
    @CurrentUser("id") userId: string,
    @Param("id") documentId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.writingService.updateDocument(userId, documentId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete document",
    description: "Permanently deletes a writing document",
  })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({ status: 204, description: "Document deleted successfully" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async deleteDocument(
    @CurrentUser("id") userId: string,
    @Param("id") documentId: string,
  ) {
    await this.writingService.deleteDocument(userId, documentId);
  }

  // ============================================
  // TEMPLATES ENDPOINTS
  // ============================================

  @Get("templates")
  @ApiOperation({
    summary: "Get available templates",
    description: "Retrieves all available writing templates with optional filters",
  })
  @ApiResponse({
    status: 200,
    description: "Templates retrieved successfully",
    type: [WritingTemplateDto],
  })
  @ApiQuery({ name: "type", required: false, enum: ["ESSAY", "RESEARCH_PAPER", "REPORT", "THESIS", "ARTICLE", "SUMMARY", "NOTES", "OTHER"] })
  @ApiQuery({ name: "style", required: false, enum: ["ACADEMIC", "FORMAL", "INFORMAL", "TECHNICAL", "CREATIVE", "PERSUASIVE"] })
  @ApiQuery({ name: "search", required: false, type: String })
  async getTemplates(@Query() query: GetTemplatesQueryDto) {
    return this.writingService.getTemplates(query);
  }

  @Get("templates/:templateId")
  @ApiOperation({
    summary: "Get template by ID",
    description: "Retrieves a specific writing template by its ID",
  })
  @ApiParam({ name: "templateId", description: "Template ID" })
  @ApiResponse({
    status: 200,
    description: "Template retrieved successfully",
    type: WritingTemplateDto,
  })
  @ApiResponse({ status: 404, description: "Template not found" })
  async getTemplateById(@Param("templateId") templateId: string) {
    return this.writingService.getTemplateById(templateId);
  }

  // ============================================
  // TEXT ANALYSIS ENDPOINTS
  // ============================================

  @Post("analyze")
  @ApiOperation({
    summary: "Analyze text",
    description: "Analyzes text for grammar, style, clarity, and tone issues using AI",
  })
  @ApiResponse({
    status: 200,
    description: "Analysis completed successfully",
    type: AnalysisResultDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async analyzeText(
    @CurrentUser("id") userId: string,
    @Body() dto: AnalyzeTextDto,
  ) {
    return this.writingService.analyzeText(userId, dto);
  }

  @Post("improve")
  @ApiOperation({
    summary: "Get AI suggestions to improve text",
    description: "Uses AI to suggest improvements for clarity, conciseness, academic tone, etc.",
  })
  @ApiResponse({
    status: 200,
    description: "Improvement suggestions generated successfully",
    type: ImproveResultDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async improveText(
    @CurrentUser("id") userId: string,
    @Body() dto: ImproveTextDto,
  ) {
    return this.writingService.improveText(userId, dto);
  }

  @Post("plagiarism-check")
  @ApiOperation({
    summary: "Check for plagiarism",
    description: "Performs a basic plagiarism check on the provided text",
  })
  @ApiResponse({
    status: 200,
    description: "Plagiarism check completed successfully",
    type: PlagiarismResultDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async checkPlagiarism(
    @CurrentUser("id") userId: string,
    @Body() dto: PlagiarismCheckDto,
  ) {
    return this.writingService.checkPlagiarism(userId, dto);
  }

  // ============================================
  // VERSION HISTORY ENDPOINTS
  // ============================================

  @Get(":id/history")
  @ApiOperation({
    summary: "Get document version history",
    description: "Retrieves the version history of a document",
  })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({
    status: 200,
    description: "Version history retrieved successfully",
    type: [DocumentVersionDto],
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  async getDocumentHistory(
    @CurrentUser("id") userId: string,
    @Param("id") documentId: string,
  ) {
    return this.writingService.getDocumentHistory(userId, documentId);
  }

  @Post(":id/save-version")
  @ApiOperation({
    summary: "Save a new version",
    description: "Saves the current document state as a new version",
  })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({
    status: 201,
    description: "Version saved successfully",
    type: DocumentVersionDto,
  })
  @ApiResponse({ status: 404, description: "Document not found" })
  async saveVersion(
    @CurrentUser("id") userId: string,
    @Param("id") documentId: string,
    @Body() dto: SaveVersionDto,
  ) {
    return this.writingService.saveVersion(userId, documentId, dto);
  }

  @Get(":id/history/:versionId")
  @ApiOperation({
    summary: "Get version content",
    description: "Retrieves the content of a specific version",
  })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiParam({ name: "versionId", description: "Version ID" })
  @ApiResponse({
    status: 200,
    description: "Version content retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Version not found" })
  async getVersionContent(
    @CurrentUser("id") userId: string,
    @Param("id") documentId: string,
    @Param("versionId") versionId: string,
  ) {
    return this.writingService.getVersionContent(userId, documentId, versionId);
  }

  @Post(":id/restore/:versionId")
  @ApiOperation({
    summary: "Restore document to a previous version",
    description: "Restores the document content from a specific version",
  })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiParam({ name: "versionId", description: "Version ID to restore" })
  @ApiResponse({
    status: 200,
    description: "Document restored successfully",
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: "Document or version not found" })
  async restoreVersion(
    @CurrentUser("id") userId: string,
    @Param("id") documentId: string,
    @Param("versionId") versionId: string,
  ) {
    return this.writingService.restoreVersion(userId, documentId, versionId);
  }
}

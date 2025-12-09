import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { ToolsService } from "./tools.service";
import {
  CreateFormulaSheetDto,
  UpdateFormulaSheetDto,
  CreateFormulaDto,
  UpdateFormulaDto,
  ReorderFormulasDto,
  CreateCodeSnippetDto,
  UpdateCodeSnippetDto,
  ExecuteCodeDto,
  SUPPORTED_LANGUAGES,
} from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

interface User {
  id: string;
  email: string;
}

@ApiTags("tools")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tools")
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  // ==================== FORMULA SHEET ENDPOINTS ====================

  @Post("formulas")
  @ApiOperation({ summary: "Crear nueva hoja de formulas" })
  @ApiResponse({ status: 201, description: "Hoja de formulas creada" })
  @ApiResponse({ status: 400, description: "Datos invalidos" })
  @ApiResponse({ status: 404, description: "Materia no encontrada" })
  createFormulaSheet(
    @CurrentUser() user: User,
    @Body() dto: CreateFormulaSheetDto,
  ) {
    return this.toolsService.createFormulaSheet(user.id, dto);
  }

  @Get("formulas")
  @ApiOperation({ summary: "Listar hojas de formulas del usuario" })
  @ApiQuery({ name: "subjectId", required: false, description: "Filtrar por materia" })
  @ApiQuery({ name: "category", required: false, description: "Filtrar por categoria" })
  @ApiQuery({ name: "search", required: false, description: "Buscar por titulo o descripcion" })
  @ApiResponse({ status: 200, description: "Lista de hojas de formulas" })
  getFormulaSheets(
    @CurrentUser() user: User,
    @Query("subjectId") subjectId?: string,
    @Query("category") category?: string,
    @Query("search") search?: string,
  ) {
    return this.toolsService.getFormulaSheets(user.id, {
      subjectId,
      category,
      search,
    });
  }

  @Get("formulas/:id")
  @ApiOperation({ summary: "Obtener hoja de formulas por ID" })
  @ApiParam({ name: "id", description: "ID de la hoja de formulas" })
  @ApiResponse({ status: 200, description: "Hoja de formulas encontrada" })
  @ApiResponse({ status: 404, description: "Hoja de formulas no encontrada" })
  getFormulaSheet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.getFormulaSheet(id, user.id);
  }

  @Patch("formulas/:id")
  @ApiOperation({ summary: "Actualizar hoja de formulas" })
  @ApiParam({ name: "id", description: "ID de la hoja de formulas" })
  @ApiResponse({ status: 200, description: "Hoja de formulas actualizada" })
  @ApiResponse({ status: 404, description: "Hoja de formulas no encontrada" })
  updateFormulaSheet(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateFormulaSheetDto,
  ) {
    return this.toolsService.updateFormulaSheet(id, user.id, dto);
  }

  @Delete("formulas/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar hoja de formulas" })
  @ApiParam({ name: "id", description: "ID de la hoja de formulas" })
  @ApiResponse({ status: 204, description: "Hoja de formulas eliminada" })
  @ApiResponse({ status: 404, description: "Hoja de formulas no encontrada" })
  deleteFormulaSheet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.deleteFormulaSheet(id, user.id);
  }

  // ==================== FORMULA ENDPOINTS ====================

  @Post("formulas/:sheetId/formulas")
  @ApiOperation({ summary: "Agregar formula a una hoja" })
  @ApiParam({ name: "sheetId", description: "ID de la hoja de formulas" })
  @ApiResponse({ status: 201, description: "Formula creada" })
  @ApiResponse({ status: 404, description: "Hoja de formulas no encontrada" })
  createFormula(
    @CurrentUser() user: User,
    @Param("sheetId") sheetId: string,
    @Body() dto: CreateFormulaDto,
  ) {
    return this.toolsService.createFormula(sheetId, user.id, dto);
  }

  @Get("formulas/:sheetId/formulas")
  @ApiOperation({ summary: "Listar formulas de una hoja" })
  @ApiParam({ name: "sheetId", description: "ID de la hoja de formulas" })
  @ApiResponse({ status: 200, description: "Lista de formulas" })
  @ApiResponse({ status: 404, description: "Hoja de formulas no encontrada" })
  getFormulas(@CurrentUser() user: User, @Param("sheetId") sheetId: string) {
    return this.toolsService.getFormulas(sheetId, user.id);
  }

  @Get("formula/:id")
  @ApiOperation({ summary: "Obtener formula por ID" })
  @ApiParam({ name: "id", description: "ID de la formula" })
  @ApiResponse({ status: 200, description: "Formula encontrada" })
  @ApiResponse({ status: 404, description: "Formula no encontrada" })
  getFormula(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.getFormula(id, user.id);
  }

  @Patch("formula/:id")
  @ApiOperation({ summary: "Actualizar formula" })
  @ApiParam({ name: "id", description: "ID de la formula" })
  @ApiResponse({ status: 200, description: "Formula actualizada" })
  @ApiResponse({ status: 404, description: "Formula no encontrada" })
  @ApiResponse({ status: 403, description: "Sin permisos para editar" })
  updateFormula(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateFormulaDto,
  ) {
    return this.toolsService.updateFormula(id, user.id, dto);
  }

  @Delete("formula/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar formula" })
  @ApiParam({ name: "id", description: "ID de la formula" })
  @ApiResponse({ status: 204, description: "Formula eliminada" })
  @ApiResponse({ status: 404, description: "Formula no encontrada" })
  @ApiResponse({ status: 403, description: "Sin permisos para eliminar" })
  deleteFormula(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.deleteFormula(id, user.id);
  }

  @Patch("formulas/:sheetId/reorder")
  @ApiOperation({ summary: "Reordenar formulas en una hoja" })
  @ApiParam({ name: "sheetId", description: "ID de la hoja de formulas" })
  @ApiResponse({ status: 200, description: "Formulas reordenadas" })
  @ApiResponse({ status: 404, description: "Hoja de formulas no encontrada" })
  reorderFormulas(
    @CurrentUser() user: User,
    @Param("sheetId") sheetId: string,
    @Body() dto: ReorderFormulasDto,
  ) {
    return this.toolsService.reorderFormulas(sheetId, user.id, dto);
  }

  // ==================== CODE SNIPPET ENDPOINTS ====================

  @Post("code-snippets")
  @ApiOperation({ summary: "Crear nuevo snippet de codigo" })
  @ApiResponse({ status: 201, description: "Snippet creado" })
  @ApiResponse({ status: 400, description: "Datos invalidos" })
  @ApiResponse({ status: 404, description: "Materia no encontrada" })
  createCodeSnippet(
    @CurrentUser() user: User,
    @Body() dto: CreateCodeSnippetDto,
  ) {
    return this.toolsService.createCodeSnippet(user.id, dto);
  }

  @Get("code-snippets")
  @ApiOperation({ summary: "Listar snippets de codigo del usuario" })
  @ApiQuery({ name: "subjectId", required: false, description: "Filtrar por materia" })
  @ApiQuery({
    name: "language",
    required: false,
    description: "Filtrar por lenguaje",
    enum: SUPPORTED_LANGUAGES,
  })
  @ApiQuery({ name: "tags", required: false, description: "Filtrar por tags (separados por coma)" })
  @ApiQuery({ name: "search", required: false, description: "Buscar por titulo, descripcion o codigo" })
  @ApiResponse({ status: 200, description: "Lista de snippets" })
  getCodeSnippets(
    @CurrentUser() user: User,
    @Query("subjectId") subjectId?: string,
    @Query("language") language?: string,
    @Query("tags") tags?: string,
    @Query("search") search?: string,
  ) {
    return this.toolsService.getCodeSnippets(user.id, {
      subjectId,
      language,
      tags: tags?.split(",").map((t) => t.trim()),
      search,
    });
  }

  @Get("code-snippets/:id")
  @ApiOperation({ summary: "Obtener snippet por ID" })
  @ApiParam({ name: "id", description: "ID del snippet" })
  @ApiResponse({ status: 200, description: "Snippet encontrado" })
  @ApiResponse({ status: 404, description: "Snippet no encontrado" })
  getCodeSnippet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.getCodeSnippet(id, user.id);
  }

  @Patch("code-snippets/:id")
  @ApiOperation({ summary: "Actualizar snippet de codigo" })
  @ApiParam({ name: "id", description: "ID del snippet" })
  @ApiResponse({ status: 200, description: "Snippet actualizado" })
  @ApiResponse({ status: 404, description: "Snippet no encontrado" })
  updateCodeSnippet(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateCodeSnippetDto,
  ) {
    return this.toolsService.updateCodeSnippet(id, user.id, dto);
  }

  @Delete("code-snippets/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar snippet de codigo" })
  @ApiParam({ name: "id", description: "ID del snippet" })
  @ApiResponse({ status: 204, description: "Snippet eliminado" })
  @ApiResponse({ status: 404, description: "Snippet no encontrado" })
  deleteCodeSnippet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.deleteCodeSnippet(id, user.id);
  }

  @Post("code-snippets/:id/execute")
  @ApiOperation({ summary: "Ejecutar snippet de codigo (simulado)" })
  @ApiParam({ name: "id", description: "ID del snippet" })
  @ApiResponse({
    status: 200,
    description: "Resultado de la ejecucion",
    schema: {
      properties: {
        success: { type: "boolean" },
        output: { type: "string" },
        error: { type: "string" },
        executionTime: { type: "number" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Snippet no es ejecutable" })
  @ApiResponse({ status: 404, description: "Snippet no encontrado" })
  executeCodeSnippet(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: ExecuteCodeDto,
  ) {
    return this.toolsService.executeCodeSnippet(id, user.id, dto);
  }

  // ==================== PUBLIC/COMMUNITY ENDPOINTS ====================

  @Get("public")
  @ApiOperation({ summary: "Listar herramientas publicas de la comunidad" })
  @ApiQuery({
    name: "type",
    required: false,
    enum: ["formulas", "snippets", "all"],
    description: "Tipo de herramienta",
  })
  @ApiQuery({ name: "category", required: false, description: "Categoria (para formulas)" })
  @ApiQuery({
    name: "language",
    required: false,
    enum: SUPPORTED_LANGUAGES,
    description: "Lenguaje (para snippets)",
  })
  @ApiQuery({ name: "search", required: false, description: "Buscar por titulo o descripcion" })
  @ApiQuery({ name: "limit", required: false, description: "Limite de resultados (max 100)" })
  @ApiQuery({ name: "offset", required: false, description: "Offset para paginacion" })
  @ApiResponse({
    status: 200,
    description: "Lista de herramientas publicas",
    schema: {
      properties: {
        formulaSheets: { type: "array" },
        codeSnippets: { type: "array" },
        total: {
          type: "object",
          properties: {
            formulaSheets: { type: "number" },
            codeSnippets: { type: "number" },
          },
        },
      },
    },
  })
  getPublicTools(
    @Query("type") type?: "formulas" | "snippets" | "all",
    @Query("category") category?: string,
    @Query("language") language?: string,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.toolsService.getPublicTools({
      type,
      category,
      language,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post("public/formulas/:id/clone")
  @ApiOperation({ summary: "Clonar hoja de formulas publica a tu coleccion" })
  @ApiParam({ name: "id", description: "ID de la hoja de formulas publica" })
  @ApiResponse({ status: 201, description: "Hoja de formulas clonada" })
  @ApiResponse({ status: 404, description: "Hoja de formulas no encontrada o no es publica" })
  cloneFormulaSheet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.cloneFormulaSheet(id, user.id);
  }

  @Post("public/code-snippets/:id/clone")
  @ApiOperation({ summary: "Clonar snippet publico a tu coleccion" })
  @ApiParam({ name: "id", description: "ID del snippet publico" })
  @ApiResponse({ status: 201, description: "Snippet clonado" })
  @ApiResponse({ status: 404, description: "Snippet no encontrado o no es publico" })
  cloneCodeSnippet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.toolsService.cloneCodeSnippet(id, user.id);
  }

  // ==================== STATS ====================

  @Get("stats")
  @ApiOperation({ summary: "Obtener estadisticas de herramientas del usuario" })
  @ApiResponse({
    status: 200,
    description: "Estadisticas de herramientas",
    schema: {
      properties: {
        totalFormulaSheets: { type: "number" },
        totalFormulas: { type: "number" },
        totalCodeSnippets: { type: "number" },
        byCategory: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              count: { type: "number" },
            },
          },
        },
        byLanguage: {
          type: "array",
          items: {
            type: "object",
            properties: {
              language: { type: "string" },
              count: { type: "number" },
            },
          },
        },
        publicItems: { type: "number" },
      },
    },
  })
  getToolsStats(@CurrentUser() user: User) {
    return this.toolsService.getToolsStats(user.id);
  }
}

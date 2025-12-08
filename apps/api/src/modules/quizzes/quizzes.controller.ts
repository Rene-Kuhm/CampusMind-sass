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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { QuizzesService } from "./quizzes.service";
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  SubmitQuizDto,
} from "./dto/quiz.dto";

@ApiTags("Quizzes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("quizzes")
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // ==================== QUIZ ENDPOINTS ====================

  @Post()
  @ApiOperation({ summary: "Crear nuevo quiz/simulacro" })
  @ApiResponse({ status: 201, description: "Quiz creado exitosamente" })
  async createQuiz(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzesService.createQuiz(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Obtener todos los quizzes del usuario" })
  @ApiQuery({ name: "subjectId", required: false })
  @ApiResponse({ status: 200, description: "Lista de quizzes" })
  async getQuizzes(
    @CurrentUser("id") userId: string,
    @Query("subjectId") subjectId?: string,
  ) {
    return this.quizzesService.getQuizzes(userId, subjectId);
  }

  @Get("stats")
  @ApiOperation({ summary: "Obtener estadísticas generales del usuario" })
  @ApiResponse({ status: 200, description: "Estadísticas del usuario" })
  async getUserStats(@CurrentUser("id") userId: string) {
    return this.quizzesService.getUserStats(userId);
  }

  @Get(":quizId")
  @ApiOperation({ summary: "Obtener quiz por ID" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 200, description: "Quiz encontrado" })
  @ApiResponse({ status: 404, description: "Quiz no encontrado" })
  async getQuiz(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
  ) {
    return this.quizzesService.getQuiz(quizId, userId);
  }

  @Get(":quizId/take")
  @ApiOperation({ summary: "Obtener quiz con preguntas para tomar el examen" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({
    status: 200,
    description: "Quiz con preguntas (sin respuestas)",
  })
  async getQuizWithQuestions(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
  ) {
    return this.quizzesService.getQuizWithQuestions(quizId, userId);
  }

  @Put(":quizId")
  @ApiOperation({ summary: "Actualizar quiz" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 200, description: "Quiz actualizado" })
  async updateQuiz(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.updateQuiz(quizId, userId, dto);
  }

  @Delete(":quizId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar quiz" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 204, description: "Quiz eliminado" })
  async deleteQuiz(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
  ) {
    await this.quizzesService.deleteQuiz(quizId, userId);
  }

  // ==================== QUESTION ENDPOINTS ====================

  @Post(":quizId/questions")
  @ApiOperation({ summary: "Agregar pregunta al quiz" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 201, description: "Pregunta agregada" })
  async addQuestion(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizzesService.addQuestion(quizId, userId, dto);
  }

  @Get(":quizId/questions")
  @ApiOperation({ summary: "Obtener preguntas del quiz" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 200, description: "Lista de preguntas" })
  async getQuestions(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
  ) {
    return this.quizzesService.getQuestions(quizId, userId);
  }

  @Delete("questions/:questionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar pregunta" })
  @ApiParam({ name: "questionId", description: "ID de la pregunta" })
  @ApiResponse({ status: 204, description: "Pregunta eliminada" })
  async deleteQuestion(
    @CurrentUser("id") userId: string,
    @Param("questionId") questionId: string,
  ) {
    await this.quizzesService.deleteQuestion(questionId, userId);
  }

  // ==================== ATTEMPT ENDPOINTS ====================

  @Post(":quizId/submit")
  @ApiOperation({ summary: "Enviar respuestas y obtener calificación" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 201, description: "Quiz calificado" })
  async submitQuiz(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizzesService.submitQuiz(quizId, userId, dto);
  }

  @Get(":quizId/attempts")
  @ApiOperation({ summary: "Obtener intentos del quiz" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 200, description: "Lista de intentos" })
  async getAttempts(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
  ) {
    return this.quizzesService.getAttempts(quizId, userId);
  }

  @Get(":quizId/stats")
  @ApiOperation({ summary: "Obtener estadísticas del quiz" })
  @ApiParam({ name: "quizId", description: "ID del quiz" })
  @ApiResponse({ status: 200, description: "Estadísticas del quiz" })
  async getQuizStats(
    @CurrentUser("id") userId: string,
    @Param("quizId") quizId: string,
  ) {
    return this.quizzesService.getQuizStats(quizId, userId);
  }

  @Get("attempts/:attemptId")
  @ApiOperation({ summary: "Obtener detalle de un intento" })
  @ApiParam({ name: "attemptId", description: "ID del intento" })
  @ApiResponse({ status: 200, description: "Detalle del intento" })
  async getAttempt(
    @CurrentUser("id") userId: string,
    @Param("attemptId") attemptId: string,
  ) {
    return this.quizzesService.getAttempt(attemptId, userId);
  }
}

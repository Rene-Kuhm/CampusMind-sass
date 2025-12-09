import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { StudySessionsService } from "./study-sessions.service";
import { CreateSessionDto, EndSessionDto, StudySessionType } from "./dto/create-session.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

interface User {
  id: string;
  email: string;
}

@ApiTags("study-sessions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("study-sessions")
export class StudySessionsController {
  constructor(private readonly sessionsService: StudySessionsService) {}

  @Post("start")
  @ApiOperation({ summary: "Iniciar sesión de estudio" })
  @ApiResponse({ status: 201, description: "Sesión iniciada" })
  startSession(@CurrentUser() user: User, @Body() dto: CreateSessionDto) {
    return this.sessionsService.startSession(user.id, dto);
  }

  @Patch(":id/end")
  @ApiOperation({ summary: "Finalizar sesión de estudio" })
  @ApiResponse({ status: 200, description: "Sesión finalizada" })
  endSession(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: EndSessionDto,
  ) {
    return this.sessionsService.endSession(id, user.id, dto);
  }

  @Patch(":id/pause")
  @ApiOperation({ summary: "Pausar sesión de estudio" })
  @ApiResponse({ status: 200, description: "Sesión pausada" })
  pauseSession(@CurrentUser() user: User, @Param("id") id: string) {
    return this.sessionsService.pauseSession(id, user.id);
  }

  @Patch(":id/resume")
  @ApiOperation({ summary: "Reanudar sesión de estudio" })
  @ApiResponse({ status: 200, description: "Sesión reanudada" })
  resumeSession(@CurrentUser() user: User, @Param("id") id: string) {
    return this.sessionsService.resumeSession(id, user.id);
  }

  @Patch(":id/abandon")
  @ApiOperation({ summary: "Abandonar sesión de estudio" })
  @ApiResponse({ status: 200, description: "Sesión abandonada" })
  abandonSession(@CurrentUser() user: User, @Param("id") id: string) {
    return this.sessionsService.abandonSession(id, user.id);
  }

  @Get("active")
  @ApiOperation({ summary: "Obtener sesión activa" })
  @ApiResponse({ status: 200, description: "Sesión activa o null" })
  getActiveSession(@CurrentUser() user: User) {
    return this.sessionsService.getActiveSession(user.id);
  }

  @Get("history")
  @ApiOperation({ summary: "Obtener historial de sesiones" })
  @ApiQuery({ name: "subjectId", required: false })
  @ApiQuery({ name: "type", required: false, enum: StudySessionType })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Historial de sesiones" })
  getHistory(
    @CurrentUser() user: User,
    @Query("subjectId") subjectId?: string,
    @Query("type") type?: StudySessionType,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("limit") limit?: number,
  ) {
    return this.sessionsService.getSessionHistory(user.id, {
      subjectId,
      type,
      startDate,
      endDate,
      limit,
    });
  }

  @Get("stats")
  @ApiOperation({ summary: "Obtener estadísticas de sesiones" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiResponse({ status: 200, description: "Estadísticas" })
  getStats(
    @CurrentUser() user: User,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.sessionsService.getStats(user.id, { startDate, endDate });
  }

  @Get("stats/today")
  @ApiOperation({ summary: "Obtener estadísticas de hoy" })
  @ApiResponse({ status: 200, description: "Estadísticas de hoy" })
  getTodayStats(@CurrentUser() user: User) {
    return this.sessionsService.getTodayStats(user.id);
  }

  @Get("stats/week")
  @ApiOperation({ summary: "Obtener estadísticas de la semana" })
  @ApiResponse({ status: 200, description: "Estadísticas semanales" })
  getWeekStats(@CurrentUser() user: User) {
    return this.sessionsService.getWeekStats(user.id);
  }
}

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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { CalendarService } from "./calendar.service";
import {
  CreateStudyEventDto,
  UpdateStudyEventDto,
  StudyEventType,
} from "./dto/create-study-event.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

// Tipo User local para evitar dependencia de Prisma
interface User {
  id: string;
  email: string;
}

@ApiTags("calendar")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post("events")
  @ApiOperation({ summary: "Crear evento de estudio" })
  @ApiResponse({ status: 201, description: "Evento creado" })
  create(@CurrentUser() user: User, @Body() dto: CreateStudyEventDto) {
    return this.calendarService.create(user.id, dto);
  }

  @Get("events")
  @ApiOperation({ summary: "Obtener eventos por rango de fechas" })
  @ApiQuery({ name: "startDate", type: String, required: true })
  @ApiQuery({ name: "endDate", type: String, required: true })
  @ApiQuery({ name: "subjectId", required: false })
  @ApiQuery({ name: "type", enum: StudyEventType, required: false })
  @ApiQuery({ name: "includeCompleted", type: Boolean, required: false })
  @ApiResponse({ status: 200, description: "Lista de eventos" })
  getEvents(
    @CurrentUser() user: User,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("subjectId") subjectId?: string,
    @Query("type") type?: StudyEventType,
    @Query("includeCompleted") includeCompleted?: boolean,
  ) {
    return this.calendarService.getByDateRange(
      user.id,
      new Date(startDate),
      new Date(endDate),
      { subjectId, type, includeCompleted },
    );
  }

  @Get("events/today")
  @ApiOperation({ summary: "Obtener eventos de hoy" })
  @ApiResponse({ status: 200, description: "Eventos de hoy" })
  getTodayEvents(@CurrentUser() user: User) {
    return this.calendarService.getTodayEvents(user.id);
  }

  @Get("events/week")
  @ApiOperation({ summary: "Obtener eventos de la semana" })
  @ApiResponse({ status: 200, description: "Eventos de la semana" })
  getWeekEvents(@CurrentUser() user: User) {
    return this.calendarService.getWeekEvents(user.id);
  }

  @Get("events/:id")
  @ApiOperation({ summary: "Obtener evento por ID" })
  @ApiResponse({ status: 200, description: "Evento encontrado" })
  @ApiResponse({ status: 404, description: "Evento no encontrado" })
  getEvent(@CurrentUser() user: User, @Param("id") id: string) {
    return this.calendarService.getById(id, user.id);
  }

  @Patch("events/:id")
  @ApiOperation({ summary: "Actualizar evento" })
  @ApiResponse({ status: 200, description: "Evento actualizado" })
  updateEvent(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateStudyEventDto,
  ) {
    return this.calendarService.update(id, user.id, dto);
  }

  @Patch("events/:id/complete")
  @ApiOperation({ summary: "Marcar evento como completado" })
  @ApiResponse({ status: 200, description: "Evento marcado como completado" })
  markComplete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.calendarService.markCompleted(id, user.id);
  }

  @Delete("events/:id")
  @ApiOperation({ summary: "Eliminar evento" })
  @ApiResponse({ status: 200, description: "Evento eliminado" })
  deleteEvent(@CurrentUser() user: User, @Param("id") id: string) {
    return this.calendarService.delete(id, user.id);
  }

  @Get("reminders")
  @ApiOperation({ summary: "Obtener próximos recordatorios" })
  @ApiQuery({ name: "withinMinutes", type: Number, required: false })
  @ApiResponse({ status: 200, description: "Recordatorios próximos" })
  getReminders(
    @CurrentUser() user: User,
    @Query("withinMinutes") withinMinutes?: number,
  ) {
    return this.calendarService.getUpcomingReminders(user.id, withinMinutes);
  }

  @Get("stats")
  @ApiOperation({ summary: "Obtener estadísticas de estudio" })
  @ApiQuery({ name: "startDate", type: String, required: true })
  @ApiQuery({ name: "endDate", type: String, required: true })
  @ApiResponse({ status: 200, description: "Estadísticas de estudio" })
  getStats(
    @CurrentUser() user: User,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.calendarService.getStudyStats(
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post("events/:examId/suggest-study-plan")
  @ApiOperation({ summary: "Generar plan de estudio para un examen" })
  @ApiResponse({
    status: 200,
    description: "Sugerencias de sesiones de estudio",
  })
  suggestStudyPlan(@CurrentUser() user: User, @Param("examId") examId: string) {
    return this.calendarService.generateStudySuggestions(user.id, examId);
  }
}

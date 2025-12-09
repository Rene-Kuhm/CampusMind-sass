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
import { TasksService } from "./tasks.service";
import { CreateTaskDto, TaskStatus, TaskPriority } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

interface User {
  id: string;
  email: string;
}

@ApiTags("tasks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: "Crear nueva tarea" })
  @ApiResponse({ status: 201, description: "Tarea creada" })
  create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar tareas del usuario" })
  @ApiQuery({ name: "subjectId", required: false })
  @ApiQuery({ name: "status", required: false, enum: TaskStatus })
  @ApiQuery({ name: "priority", required: false, enum: TaskPriority })
  @ApiQuery({ name: "dueBefore", required: false })
  @ApiQuery({ name: "dueAfter", required: false })
  @ApiResponse({ status: 200, description: "Lista de tareas" })
  findAll(
    @CurrentUser() user: User,
    @Query("subjectId") subjectId?: string,
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("dueBefore") dueBefore?: string,
    @Query("dueAfter") dueAfter?: string,
  ) {
    return this.tasksService.findAll(user.id, {
      subjectId,
      status,
      priority,
      dueBefore,
      dueAfter,
    });
  }

  @Get("upcoming")
  @ApiOperation({ summary: "Obtener tareas próximas" })
  @ApiQuery({ name: "days", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Tareas próximas" })
  getUpcoming(
    @CurrentUser() user: User,
    @Query("days") days?: number,
  ) {
    return this.tasksService.getUpcoming(user.id, days || 7);
  }

  @Get("overdue")
  @ApiOperation({ summary: "Obtener tareas vencidas" })
  @ApiResponse({ status: 200, description: "Tareas vencidas" })
  getOverdue(@CurrentUser() user: User) {
    return this.tasksService.getOverdue(user.id);
  }

  @Get("stats")
  @ApiOperation({ summary: "Obtener estadísticas de tareas" })
  @ApiResponse({ status: 200, description: "Estadísticas" })
  getStats(@CurrentUser() user: User) {
    return this.tasksService.getStats(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener tarea por ID" })
  @ApiResponse({ status: 200, description: "Tarea encontrada" })
  @ApiResponse({ status: 404, description: "Tarea no encontrada" })
  findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.tasksService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar tarea" })
  @ApiResponse({ status: 200, description: "Tarea actualizada" })
  update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.id, dto);
  }

  @Patch(":id/complete")
  @ApiOperation({ summary: "Marcar tarea como completada" })
  @ApiResponse({ status: 200, description: "Tarea completada" })
  markComplete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.tasksService.markComplete(id, user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar tarea" })
  @ApiResponse({ status: 200, description: "Tarea eliminada" })
  delete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.tasksService.delete(id, user.id);
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  @Patch("bulk/status")
  @ApiOperation({ summary: "Actualizar estado de múltiples tareas" })
  @ApiResponse({ status: 200, description: "Tareas actualizadas" })
  bulkUpdateStatus(
    @CurrentUser() user: User,
    @Body() body: { ids: string[]; status: string },
  ) {
    return this.tasksService.bulkUpdateStatus(body.ids, user.id, body.status);
  }

  @Delete("bulk")
  @ApiOperation({ summary: "Eliminar múltiples tareas" })
  @ApiResponse({ status: 200, description: "Tareas eliminadas" })
  bulkDelete(
    @CurrentUser() user: User,
    @Body() body: { ids: string[] },
  ) {
    return this.tasksService.bulkDelete(body.ids, user.id);
  }
}

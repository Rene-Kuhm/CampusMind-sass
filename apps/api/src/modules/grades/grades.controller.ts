import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { GradesService } from "./grades.service";
import { CreateGradeDto } from "./dto/create-grade.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

interface User {
  id: string;
  email: string;
}

@ApiTags("grades")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("grades")
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // ============================================
  // GRADES
  // ============================================

  @Post("subject/:subjectId")
  @ApiOperation({ summary: "Crear nueva nota en una materia" })
  @ApiResponse({ status: 201, description: "Nota creada" })
  createGrade(
    @CurrentUser() user: User,
    @Param("subjectId") subjectId: string,
    @Body() dto: CreateGradeDto,
  ) {
    return this.gradesService.createGrade(subjectId, user.id, dto);
  }

  @Get("subject/:subjectId")
  @ApiOperation({ summary: "Listar notas de una materia" })
  @ApiResponse({ status: 200, description: "Lista de notas" })
  findAllGrades(
    @CurrentUser() user: User,
    @Param("subjectId") subjectId: string,
  ) {
    return this.gradesService.findAllGrades(subjectId, user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener nota por ID" })
  @ApiResponse({ status: 200, description: "Nota encontrada" })
  @ApiResponse({ status: 404, description: "Nota no encontrada" })
  findOneGrade(@CurrentUser() user: User, @Param("id") id: string) {
    return this.gradesService.findOneGrade(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar nota" })
  @ApiResponse({ status: 200, description: "Nota actualizada" })
  updateGrade(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradesService.updateGrade(id, user.id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar nota" })
  @ApiResponse({ status: 200, description: "Nota eliminada" })
  deleteGrade(@CurrentUser() user: User, @Param("id") id: string) {
    return this.gradesService.deleteGrade(id, user.id);
  }

  // ============================================
  // CATEGORIES
  // ============================================

  @Post("categories/subject/:subjectId")
  @ApiOperation({ summary: "Crear categoría de notas" })
  @ApiResponse({ status: 201, description: "Categoría creada" })
  createCategory(
    @CurrentUser() user: User,
    @Param("subjectId") subjectId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.gradesService.createCategory(subjectId, user.id, dto);
  }

  @Get("categories/subject/:subjectId")
  @ApiOperation({ summary: "Listar categorías de una materia" })
  @ApiResponse({ status: 200, description: "Lista de categorías" })
  findAllCategories(
    @CurrentUser() user: User,
    @Param("subjectId") subjectId: string,
  ) {
    return this.gradesService.findAllCategories(subjectId, user.id);
  }

  @Delete("categories/:id")
  @ApiOperation({ summary: "Eliminar categoría" })
  @ApiResponse({ status: 200, description: "Categoría eliminada" })
  deleteCategory(@CurrentUser() user: User, @Param("id") id: string) {
    return this.gradesService.deleteCategory(id, user.id);
  }

  // ============================================
  // STATISTICS
  // ============================================

  @Get("stats/subject/:subjectId")
  @ApiOperation({ summary: "Obtener estadísticas de notas de una materia" })
  @ApiResponse({ status: 200, description: "Estadísticas de notas" })
  getSubjectStats(
    @CurrentUser() user: User,
    @Param("subjectId") subjectId: string,
  ) {
    return this.gradesService.getSubjectStats(subjectId, user.id);
  }

  @Get("stats/overall")
  @ApiOperation({ summary: "Obtener estadísticas generales del usuario" })
  @ApiResponse({ status: 200, description: "Estadísticas generales" })
  getUserOverallStats(@CurrentUser() user: User) {
    return this.gradesService.getUserOverallStats(user.id);
  }
}

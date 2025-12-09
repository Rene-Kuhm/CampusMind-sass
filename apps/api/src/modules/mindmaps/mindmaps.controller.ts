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
import { MindMapsService } from "./mindmaps.service";
import { CreateMindMapDto, UpdateMindMapDto } from "./dto/mindmap.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

interface User {
  id: string;
  email: string;
}

@ApiTags("mindmaps")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("mindmaps")
export class MindMapsController {
  constructor(private readonly mindMapsService: MindMapsService) {}

  @Post()
  @ApiOperation({ summary: "Crear nuevo mapa mental" })
  @ApiResponse({ status: 201, description: "Mapa mental creado" })
  create(@CurrentUser() user: User, @Body() dto: CreateMindMapDto) {
    return this.mindMapsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar mapas mentales del usuario" })
  @ApiQuery({ name: "subjectId", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiResponse({ status: 200, description: "Lista de mapas mentales" })
  findAll(
    @CurrentUser() user: User,
    @Query("subjectId") subjectId?: string,
    @Query("search") search?: string,
  ) {
    return this.mindMapsService.findAll(user.id, { subjectId, search });
  }

  @Get("public")
  @ApiOperation({ summary: "Listar mapas mentales publicos" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "offset", required: false })
  @ApiResponse({ status: 200, description: "Lista de mapas mentales publicos" })
  findPublic(
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.mindMapsService.findPublic({
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get("stats")
  @ApiOperation({ summary: "Obtener estadisticas de mapas mentales" })
  @ApiResponse({ status: 200, description: "Estadisticas del usuario" })
  getStats(@CurrentUser() user: User) {
    return this.mindMapsService.getStats(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener mapa mental por ID" })
  @ApiResponse({ status: 200, description: "Mapa mental encontrado" })
  @ApiResponse({ status: 404, description: "Mapa mental no encontrado" })
  findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.mindMapsService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar mapa mental" })
  @ApiResponse({ status: 200, description: "Mapa mental actualizado" })
  update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateMindMapDto,
  ) {
    return this.mindMapsService.update(id, user.id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar mapa mental" })
  @ApiResponse({ status: 200, description: "Mapa mental eliminado" })
  remove(@CurrentUser() user: User, @Param("id") id: string) {
    return this.mindMapsService.remove(id, user.id);
  }

  @Post(":id/duplicate")
  @ApiOperation({ summary: "Duplicar mapa mental" })
  @ApiResponse({ status: 201, description: "Mapa mental duplicado" })
  duplicate(@CurrentUser() user: User, @Param("id") id: string) {
    return this.mindMapsService.duplicate(id, user.id);
  }
}

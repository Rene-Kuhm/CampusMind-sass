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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, ResourceType, ResourceLevel } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

// Definir tipo User localmente para evitar dependencia de Prisma
interface User {
  id: string;
  email: string;
}

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subjects/:subjectId/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar recurso a una materia' })
  @ApiResponse({ status: 201, description: 'Recurso creado' })
  create(
    @CurrentUser() user: User,
    @Param('subjectId') subjectId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourcesService.create(subjectId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recursos de una materia' })
  @ApiQuery({ name: 'type', required: false, enum: ResourceType })
  @ApiQuery({ name: 'level', required: false, enum: ResourceLevel })
  @ApiQuery({ name: 'isOpenAccess', required: false, type: Boolean })
  @ApiQuery({ name: 'isIndexed', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de recursos' })
  findAll(
    @CurrentUser() user: User,
    @Param('subjectId') subjectId: string,
    @Query('type') type?: ResourceType,
    @Query('level') level?: ResourceLevel,
    @Query('isOpenAccess') isOpenAccess?: boolean,
    @Query('isIndexed') isIndexed?: boolean,
  ) {
    return this.resourcesService.findAllBySubject(subjectId, user.id, {
      type,
      level,
      isOpenAccess,
      isIndexed,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener recurso por ID' })
  @ApiResponse({ status: 200, description: 'Recurso encontrado' })
  @ApiResponse({ status: 404, description: 'Recurso no encontrado' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.resourcesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar recurso' })
  @ApiResponse({ status: 200, description: 'Recurso actualizado' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar recurso' })
  @ApiResponse({ status: 200, description: 'Recurso eliminado' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.resourcesService.delete(id, user.id);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Agregar nota a un recurso' })
  @ApiResponse({ status: 201, description: 'Nota creada' })
  addNote(
    @CurrentUser() user: User,
    @Param('id') resourceId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.resourcesService.addNote(resourceId, user.id, dto.content);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Eliminar nota' })
  @ApiResponse({ status: 200, description: 'Nota eliminada' })
  deleteNote(@CurrentUser() user: User, @Param('noteId') noteId: string) {
    return this.resourcesService.deleteNote(noteId, user.id);
  }
}

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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

// Definir tipo User localmente para evitar dependencia de Prisma
interface User {
  id: string;
  email: string;
}

@ApiTags('subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva materia' })
  @ApiResponse({ status: 201, description: 'Materia creada' })
  create(@CurrentUser() user: User, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar materias del usuario' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de materias' })
  findAll(
    @CurrentUser() user: User,
    @Query('includeArchived') includeArchived?: boolean,
  ) {
    return this.subjectsService.findAllByUser(user.id, includeArchived);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener materia por ID' })
  @ApiResponse({ status: 200, description: 'Materia encontrada' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.subjectsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar materia' })
  @ApiResponse({ status: 200, description: 'Materia actualizada' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, user.id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archivar materia' })
  @ApiResponse({ status: 200, description: 'Materia archivada' })
  archive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.subjectsService.archive(id, user.id);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Desarchivar materia' })
  @ApiResponse({ status: 200, description: 'Materia desarchivada' })
  unarchive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.subjectsService.unarchive(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar materia' })
  @ApiResponse({ status: 200, description: 'Materia eliminada' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.subjectsService.delete(id, user.id);
  }
}

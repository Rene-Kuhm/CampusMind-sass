import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AcademicSource, AcademicResourceType } from './interfaces/academic-resource.interface';

@ApiTags('academic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar recursos académicos en APIs externas' })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda', required: true })
  @ApiQuery({ name: 'source', enum: ['openalex', 'semantic_scholar'], required: false })
  @ApiQuery({ name: 'type', enum: ['paper', 'book', 'article', 'thesis', 'conference'], required: false })
  @ApiQuery({ name: 'yearFrom', type: Number, required: false })
  @ApiQuery({ name: 'yearTo', type: Number, required: false })
  @ApiQuery({ name: 'openAccessOnly', type: Boolean, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'perPage', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  async search(
    @Query('q') query: string,
    @Query('source') source?: AcademicSource,
    @Query('type') type?: AcademicResourceType,
    @Query('yearFrom') yearFrom?: number,
    @Query('yearTo') yearTo?: number,
    @Query('openAccessOnly') openAccessOnly?: boolean,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.academicService.search(
      {
        query,
        filters: {
          type,
          yearFrom,
          yearTo,
          isOpenAccess: openAccessOnly,
        },
        pagination: {
          page: page || 1,
          perPage: perPage || 25,
        },
      },
      source || 'openalex',
    );
  }

  @Get('search/multi')
  @ApiOperation({ summary: 'Buscar en múltiples fuentes académicas' })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda', required: true })
  @ApiQuery({ name: 'openAccessOnly', type: Boolean, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'perPage', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Resultados combinados' })
  async searchMultiple(
    @Query('q') query: string,
    @Query('openAccessOnly') openAccessOnly?: boolean,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.academicService.searchMultiple({
      query,
      filters: {
        isOpenAccess: openAccessOnly,
      },
      pagination: {
        page: page || 1,
        perPage: perPage || 25,
      },
    });
  }

  @Get('resource/:source/:externalId')
  @ApiOperation({ summary: 'Obtener recurso académico por ID externo' })
  @ApiResponse({ status: 200, description: 'Recurso encontrado' })
  @ApiResponse({ status: 404, description: 'Recurso no encontrado' })
  async getById(
    @Param('source') source: AcademicSource,
    @Param('externalId') externalId: string,
  ) {
    const resource = await this.academicService.getById(externalId, source);
    if (!resource) {
      return { error: 'Recurso no encontrado' };
    }
    return resource;
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Obtener recomendaciones basadas en topics' })
  @ApiQuery({ name: 'topics', description: 'Topics separados por coma', required: true })
  @ApiQuery({ name: 'openAccessOnly', type: Boolean, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Recursos recomendados' })
  async getRecommendations(
    @Query('topics') topicsStr: string,
    @Query('openAccessOnly') openAccessOnly?: boolean,
    @Query('limit') limit?: number,
  ) {
    const topics = topicsStr.split(',').map((t) => t.trim());
    return this.academicService.getRecommendations(topics, {
      isOpenAccess: openAccessOnly ?? true,
      limit: limit || 10,
    });
  }
}

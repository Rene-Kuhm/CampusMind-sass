import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AcademicService, SearchCategory } from './academic.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AcademicSource, AcademicResourceType } from './interfaces/academic-resource.interface';

/** Academic resources controller - searches books, videos, papers across multiple sources */
@ApiTags('academic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // NOTE: More specific routes must come BEFORE less specific ones
  // /search/all and /search/multi must be defined before /search

  @Get('search/all')
  @ApiOperation({
    summary: 'Búsqueda unificada en todas las fuentes',
    description: 'Busca libros, videos, papers, manuales y más en múltiples fuentes en paralelo'
  })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda', required: true })
  @ApiQuery({
    name: 'category',
    enum: ['all', 'papers', 'books', 'videos', 'courses'],
    required: false,
    description: 'Categoría de recursos (default: all)'
  })
  @ApiQuery({ name: 'openAccessOnly', type: Boolean, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'perPage', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Resultados combinados de todas las fuentes' })
  async searchAll(
    @Query('q') query: string,
    @Query('category') category?: SearchCategory,
    @Query('openAccessOnly') openAccessOnly?: boolean,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.academicService.searchAll(
      {
        query,
        filters: {
          isOpenAccess: openAccessOnly,
        },
        pagination: {
          page: page || 1,
          perPage: perPage || 25,
        },
      },
      category || 'all',
    );
  }

  @Get('search/multi')
  @ApiOperation({ summary: 'Buscar en múltiples fuentes académicas (papers)' })
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

  @Get('search')
  @ApiOperation({ summary: 'Buscar recursos en una fuente específica' })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda', required: true })
  @ApiQuery({
    name: 'source',
    enum: ['openalex', 'semantic_scholar', 'crossref', 'youtube', 'google_books', 'archive_org', 'libgen', 'web'],
    required: false,
    description: 'Fuente de búsqueda (default: openalex)'
  })
  @ApiQuery({ name: 'type', enum: ['paper', 'book', 'video', 'course', 'article', 'thesis', 'manual'], required: false })
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

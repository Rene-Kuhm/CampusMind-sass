import { Controller, Get, Post, Body, Query, Param, UseGuards, Request, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AcademicService, SearchCategory } from './academic.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AcademicSource, AcademicResourceType, AcademicResource } from './interfaces/academic-resource.interface';

/** Academic resources controller - searches books, videos, papers across multiple sources */
@ApiTags('academic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academic')
export class AcademicController {
  private readonly logger = new Logger(AcademicController.name);

  constructor(private readonly academicService: AcademicService) {}

  @Post('import')
  @ApiOperation({
    summary: 'Importar recurso académico a una materia',
    description: 'Importa un recurso de búsqueda académica a una materia del usuario'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['subjectId', 'resource'],
      properties: {
        subjectId: { type: 'string', description: 'ID de la materia' },
        resource: { type: 'object', description: 'Recurso académico a importar' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Recurso importado exitosamente' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  async importResource(
    @Body() body: { subjectId: string; resource: AcademicResource },
    @Request() req: any,
  ) {
    this.logger.log(`Import request received - subjectId: ${body.subjectId}, userId: ${req.user?.id}`);
    this.logger.log(`Resource to import: ${JSON.stringify(body.resource?.title || 'no title')}`);

    try {
      const result = await this.academicService.importToSubject(
        body.subjectId,
        req.user.id,
        body.resource,
      );
      this.logger.log(`Import successful: ${result.id}`);
      return result;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Import failed: ${err.message}`, err.stack);
      throw error;
    }
  }

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
    enum: ['all', 'papers', 'books', 'videos', 'courses', 'medical'],
    required: false,
    description: 'Categoría de recursos (default: all). Medical incluye PubMed, NCBI Bookshelf y OpenStax.'
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
    enum: ['openalex', 'semantic_scholar', 'crossref', 'youtube', 'google_books', 'archive_org', 'libgen', 'web', 'medical_books'],
    required: false,
    description: 'Fuente de búsqueda (default: openalex). medical_books incluye PubMed Central, NCBI Bookshelf y OpenStax.'
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

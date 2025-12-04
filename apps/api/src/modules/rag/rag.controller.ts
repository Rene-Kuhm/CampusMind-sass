import {
  Controller,
  Post,
  Get,
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
import { RagService } from './rag.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { QueryRagDto } from './dto/query-rag.dto';

@ApiTags('rag')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  @ApiOperation({ summary: 'Consultar al copiloto académico' })
  @ApiResponse({ status: 200, description: 'Respuesta generada con citas' })
  async query(@CurrentUser() user: User, @Body() dto: QueryRagDto) {
    return this.ragService.queryRAG(user.id, dto.query, {
      subjectId: dto.subjectId,
      resourceIds: dto.resourceIds,
      topK: dto.topK,
      minScore: dto.minScore,
      style: dto.style,
      depth: dto.depth,
    });
  }

  @Post('ingest/:resourceId')
  @ApiOperation({ summary: 'Indexar un recurso para búsqueda semántica' })
  @ApiResponse({ status: 200, description: 'Recurso indexado' })
  async ingestResource(@Param('resourceId') resourceId: string) {
    return this.ragService.ingestResource(resourceId);
  }

  @Get('summary/:resourceId')
  @ApiOperation({ summary: 'Generar resumen estilo Harvard de un recurso' })
  @ApiQuery({ name: 'depth', enum: ['basic', 'intermediate', 'advanced'], required: false })
  @ApiResponse({ status: 200, description: 'Resumen generado' })
  async generateSummary(
    @CurrentUser() user: User,
    @Param('resourceId') resourceId: string,
    @Query('depth') depth?: 'basic' | 'intermediate' | 'advanced',
  ) {
    return this.ragService.generateSummary(resourceId, user.id, { depth });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de uso del usuario' })
  @ApiResponse({ status: 200, description: 'Estadísticas de uso' })
  async getStats(@CurrentUser() user: User) {
    return this.ragService.getUserStats(user.id);
  }
}

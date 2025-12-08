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
import { CacheService } from './services/cache.service';
import { LlmService } from './services/llm.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { QueryRagDto } from './dto/query-rag.dto';

// DTOs para generación con IA
class GenerateFlashcardsDto {
  topic: string;
  count?: number;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  language?: string;
  content?: string;
}

class GenerateQuizDto {
  topic: string;
  questionCount?: number;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer')[];
  language?: string;
  content?: string;
}

class GenerateSummaryDto {
  content: string;
  style?: 'bullet_points' | 'paragraph' | 'outline';
  length?: 'short' | 'medium' | 'long';
  language?: string;
}

@ApiTags('rag')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly cacheService: CacheService,
    private readonly llmService: LlmService,
  ) {}

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
      skipCache: dto.skipCache,
      provider: dto.provider,
      useFreeProvider: dto.useFreeProvider,
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

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del cache RAG' })
  @ApiResponse({ status: 200, description: 'Estadísticas de cache' })
  async getCacheStats() {
    const stats = this.cacheService.getStats();
    const hitRate = this.cacheService.getCacheHitRate();

    return {
      ...stats,
      hitRate: {
        embedding: `${(hitRate.embedding * 100).toFixed(1)}%`,
        rag: `${(hitRate.rag * 100).toFixed(1)}%`,
      },
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Obtener proveedores de IA disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de proveedores configurados' })
  async getProviders() {
    const configured = this.llmService.getConfiguredProviders();
    const current = this.llmService.getCurrentProviderInfo();

    return {
      current: {
        type: current.type,
        name: current.name,
        isFree: current.isFree,
      },
      available: configured.map((p) => ({
        type: p.type,
        name: p.name,
        isFree: p.isFree,
        description: p.description,
      })),
    };
  }

  @Post('generate/flashcards')
  @ApiOperation({ summary: 'Generar flashcards con IA a partir de un tema' })
  @ApiResponse({ status: 200, description: 'Flashcards generadas' })
  async generateFlashcards(@Body() dto: GenerateFlashcardsDto) {
    return this.ragService.generateFlashcards(dto.topic, {
      count: dto.count,
      difficulty: dto.difficulty,
      language: dto.language,
      content: dto.content,
    });
  }

  @Post('generate/quiz')
  @ApiOperation({ summary: 'Generar quiz/examen de práctica con IA' })
  @ApiResponse({ status: 200, description: 'Quiz generado' })
  async generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.ragService.generateQuiz(dto.topic, {
      questionCount: dto.questionCount,
      difficulty: dto.difficulty,
      questionTypes: dto.questionTypes,
      language: dto.language,
      content: dto.content,
    });
  }

  @Post('generate/summary')
  @ApiOperation({ summary: 'Generar resumen automático con IA' })
  @ApiResponse({ status: 200, description: 'Resumen generado' })
  async generateSummary(@Body() dto: GenerateSummaryDto) {
    return this.ragService.generateAutoSummary(dto.content, {
      style: dto.style,
      length: dto.length,
      language: dto.language,
    });
  }
}

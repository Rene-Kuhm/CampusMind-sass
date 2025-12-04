import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { LlmService } from './services/llm.service';
import {
  RagQueryOptions,
  RagResponse,
  HarvardSummary,
} from './interfaces/rag.interface';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunking: ChunkingService,
    private readonly embedding: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly llm: LlmService,
  ) {}

  /**
   * Ingesta un recurso: chunking + embeddings + almacenamiento
   */
  async ingestResource(resourceId: string): Promise<{
    chunksCreated: number;
    tokensUsed: number;
  }> {
    const startTime = Date.now();

    // Obtener el recurso
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // Por ahora, usamos la descripción/abstract como contenido
    // En el futuro, aquí se procesarían PDFs, videos, etc.
    const content = resource.description || '';

    if (!content || content.length < 50) {
      this.logger.warn(`Resource ${resourceId} has insufficient content for indexing`);
      return { chunksCreated: 0, tokensUsed: 0 };
    }

    // Eliminar chunks anteriores si existen
    await this.vectorStore.deleteByResource(resourceId);

    // Dividir en chunks
    const chunks = this.chunking.chunkText(content, {
      resourceId,
      resourceTitle: resource.title,
    });

    this.logger.log(`Created ${chunks.length} chunks for resource ${resourceId}`);

    // Generar embeddings en batch
    const embeddings = await this.embedding.generateEmbeddings(
      chunks.map((c) => c.content),
    );

    // Almacenar chunks con embeddings
    const chunkData = chunks.map((chunk, i) => ({
      resourceId,
      content: chunk.content,
      embedding: embeddings[i].embedding,
      metadata: chunk.metadata,
    }));

    await this.vectorStore.storeChunks(chunkData);

    // Actualizar estado del recurso
    await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        isIndexed: true,
        indexedAt: new Date(),
        chunkCount: chunks.length,
      },
    });

    const totalTokens = embeddings.reduce((sum, e) => sum + e.tokenCount, 0);

    this.logger.log(
      `Ingested resource ${resourceId} in ${Date.now() - startTime}ms`,
    );

    return {
      chunksCreated: chunks.length,
      tokensUsed: totalTokens,
    };
  }

  /**
   * Consulta RAG: busca contexto relevante y genera respuesta
   */
  async queryRAG(
    userId: string,
    query: string,
    options?: RagQueryOptions,
  ): Promise<RagResponse> {
    const startTime = Date.now();

    // Generar embedding de la consulta
    const queryEmbedding = await this.embedding.generateEmbedding(query);

    // Buscar chunks similares
    const similarChunks = await this.vectorStore.searchSimilar(
      queryEmbedding.embedding,
      {
        subjectId: options?.subjectId,
        resourceIds: options?.resourceIds,
        topK: options?.topK || 5,
        minScore: options?.minScore || 0.7,
      },
    );

    if (similarChunks.length === 0) {
      return {
        answer:
          'No encontré información relevante en tus recursos para responder esta pregunta. Intenta agregar más recursos sobre el tema o reformular tu consulta.',
        citations: [],
        tokensUsed: queryEmbedding.tokenCount,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Preparar contexto para el LLM
    const contextTexts = similarChunks.map((chunk) => chunk.content);

    // Generar respuesta con LLM
    const llmResponse = await this.llm.generateWithContext(query, contextTexts, {
      style: options?.style,
      depth: options?.depth,
    });

    // Construir citas
    const citations = similarChunks.map((chunk) => ({
      resourceId: chunk.metadata.resourceId,
      resourceTitle: chunk.metadata.resourceTitle,
      chunkContent:
        chunk.content.length > 200
          ? chunk.content.substring(0, 200) + '...'
          : chunk.content,
      page: chunk.metadata.page,
      section: chunk.metadata.section,
      relevanceScore: chunk.score,
    }));

    // Guardar query en el log
    await this.prisma.ragQuery.create({
      data: {
        userId,
        subjectId: options?.subjectId,
        query,
        response: llmResponse.content,
        chunksUsed: similarChunks.map((c) => ({ id: c.id, score: c.score })),
        tokensUsed: queryEmbedding.tokenCount + llmResponse.tokensUsed,
        responseTimeMs: Date.now() - startTime,
      },
    });

    return {
      answer: llmResponse.content,
      citations,
      tokensUsed: queryEmbedding.tokenCount + llmResponse.tokensUsed,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Genera un resumen estilo Harvard de un recurso
   */
  async generateSummary(
    resourceId: string,
    userId: string,
    options?: {
      depth?: 'basic' | 'intermediate' | 'advanced';
    },
  ): Promise<HarvardSummary> {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId },
      include: {
        subject: true,
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          take: 10, // Limitar chunks para el resumen
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // Verificar ownership a través de la materia
    if (resource.subject.userId !== userId) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // Usar contenido de chunks o descripción
    let content =
      resource.chunks.length > 0
        ? resource.chunks.map((c) => c.content).join('\n\n')
        : resource.description || '';

    if (!content) {
      throw new Error('El recurso no tiene contenido para resumir');
    }

    // Limitar contenido para no exceder contexto del LLM
    if (content.length > 15000) {
      content = content.substring(0, 15000) + '...';
    }

    const response = await this.llm.generateHarvardSummary(content, {
      depth: options?.depth,
    });

    try {
      return JSON.parse(response.content) as HarvardSummary;
    } catch {
      this.logger.error('Failed to parse Harvard summary JSON');
      // Retornar estructura básica si falla el parsing
      return {
        theoreticalContext: response.content,
        keyIdeas: [],
        definitions: [],
        examples: [],
        commonMistakes: [],
        reviewChecklist: [],
        references: [],
      };
    }
  }

  /**
   * Obtiene estadísticas de uso RAG del usuario
   */
  async getUserStats(userId: string) {
    const [queryCount, totalTokens, recentQueries] = await Promise.all([
      this.prisma.ragQuery.count({ where: { userId } }),
      this.prisma.ragQuery.aggregate({
        where: { userId },
        _sum: { tokensUsed: true },
      }),
      this.prisma.ragQuery.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          query: true,
          createdAt: true,
          tokensUsed: true,
          subject: {
            select: { name: true },
          },
        },
      }),
    ]);

    return {
      totalQueries: queryCount,
      totalTokensUsed: totalTokens._sum.tokensUsed || 0,
      recentQueries,
    };
  }
}

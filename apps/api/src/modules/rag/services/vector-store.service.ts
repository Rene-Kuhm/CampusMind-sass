import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { SimilarChunk, ChunkMetadata } from '../interfaces/rag.interface';

/**
 * Servicio de almacenamiento vectorial
 * Soporta pgvector (PostgreSQL) con abstracción para Qdrant
 */
@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly provider: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.provider = this.config.get<string>('VECTOR_DB_PROVIDER', 'pgvector');
  }

  /**
   * Almacena un chunk con su embedding
   */
  async storeChunk(
    resourceId: string,
    content: string,
    embedding: number[],
    metadata: Partial<ChunkMetadata>,
  ): Promise<string> {
    switch (this.provider) {
      case 'pgvector':
        return this.storePgVector(resourceId, content, embedding, metadata);
      case 'qdrant':
        return this.storeQdrant(resourceId, content, embedding, metadata);
      default:
        return this.storePgVector(resourceId, content, embedding, metadata);
    }
  }

  /**
   * Almacena múltiples chunks en batch
   */
  async storeChunks(
    chunks: Array<{
      resourceId: string;
      content: string;
      embedding: number[];
      metadata: Partial<ChunkMetadata>;
    }>,
  ): Promise<string[]> {
    const ids: string[] = [];

    // Por ahora, insertar uno a uno (se puede optimizar con raw SQL)
    for (const chunk of chunks) {
      const id = await this.storeChunk(
        chunk.resourceId,
        chunk.content,
        chunk.embedding,
        chunk.metadata,
      );
      ids.push(id);
    }

    return ids;
  }

  /**
   * Busca chunks similares a un embedding dado
   */
  async searchSimilar(
    queryEmbedding: number[],
    options: {
      subjectId?: string;
      resourceIds?: string[];
      topK?: number;
      minScore?: number;
    },
  ): Promise<SimilarChunk[]> {
    switch (this.provider) {
      case 'pgvector':
        return this.searchPgVector(queryEmbedding, options);
      case 'qdrant':
        return this.searchQdrant(queryEmbedding, options);
      default:
        return this.searchPgVector(queryEmbedding, options);
    }
  }

  /**
   * Elimina todos los chunks de un recurso
   */
  async deleteByResource(resourceId: string): Promise<void> {
    await this.prisma.resourceChunk.deleteMany({
      where: { resourceId },
    });
  }

  // ============================================
  // PGVECTOR IMPLEMENTATION
  // ============================================

  private async storePgVector(
    resourceId: string,
    content: string,
    embedding: number[],
    metadata: Partial<ChunkMetadata>,
  ): Promise<string> {
    // Usar raw query para insertar el vector
    const embeddingStr = `[${embedding.join(',')}]`;

    const result = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO resource_chunks (id, resource_id, content, metadata, chunk_index, embedding, created_at)
      VALUES (
        gen_random_uuid(),
        ${resourceId},
        ${content},
        ${JSON.stringify(metadata)}::jsonb,
        ${metadata.chunkIndex || 0},
        ${embeddingStr}::vector,
        NOW()
      )
      RETURNING id
    `;

    return result[0].id;
  }

  private async searchPgVector(
    queryEmbedding: number[],
    options: {
      subjectId?: string;
      resourceIds?: string[];
      topK?: number;
      minScore?: number;
    },
  ): Promise<SimilarChunk[]> {
    const topK = options.topK || 5;
    const minScore = options.minScore || 0.7;
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Construir condiciones WHERE dinámicamente
    let whereConditions = '';
    const params: any[] = [];

    if (options.resourceIds && options.resourceIds.length > 0) {
      whereConditions = `WHERE rc.resource_id = ANY($1)`;
      params.push(options.resourceIds);
    } else if (options.subjectId) {
      whereConditions = `WHERE r.subject_id = $1`;
      params.push(options.subjectId);
    }

    // Query con similitud coseno (1 - distancia coseno)
    const query = `
      SELECT
        rc.id,
        rc.content,
        rc.metadata,
        r.id as resource_id,
        r.title as resource_title,
        1 - (rc.embedding <=> '${embeddingStr}'::vector) as score
      FROM resource_chunks rc
      JOIN resources r ON r.id = rc.resource_id
      ${whereConditions}
      ORDER BY rc.embedding <=> '${embeddingStr}'::vector
      LIMIT ${topK}
    `;

    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        metadata: any;
        resource_id: string;
        resource_title: string;
        score: number;
      }>
    >(query, ...params);

    return results
      .filter((r) => r.score >= minScore)
      .map((r) => ({
        id: r.id,
        content: r.content,
        metadata: {
          resourceId: r.resource_id,
          resourceTitle: r.resource_title,
          chunkIndex: r.metadata?.chunkIndex || 0,
          page: r.metadata?.page,
          section: r.metadata?.section,
        },
        score: r.score,
      }));
  }

  // ============================================
  // QDRANT IMPLEMENTATION (PLACEHOLDER)
  // ============================================

  private async storeQdrant(
    resourceId: string,
    content: string,
    embedding: number[],
    metadata: Partial<ChunkMetadata>,
  ): Promise<string> {
    // TODO: Implementar cuando se use Qdrant
    this.logger.warn('Qdrant storage not implemented yet');
    throw new Error('Qdrant not implemented');
  }

  private async searchQdrant(
    queryEmbedding: number[],
    options: {
      subjectId?: string;
      resourceIds?: string[];
      topK?: number;
      minScore?: number;
    },
  ): Promise<SimilarChunk[]> {
    // TODO: Implementar cuando se use Qdrant
    this.logger.warn('Qdrant search not implemented yet');
    throw new Error('Qdrant not implemented');
  }
}

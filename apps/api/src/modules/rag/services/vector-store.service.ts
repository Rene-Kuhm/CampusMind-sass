import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/database/prisma.service";
import { QdrantClient } from "@qdrant/js-client-rest";
import { SimilarChunk, ChunkMetadata } from "../interfaces/rag.interface";
import { v4 as uuidv4 } from "uuid";

/**
 * Servicio de almacenamiento vectorial
 * Soporta pgvector (PostgreSQL) y Qdrant
 */
@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly provider: string;
  private qdrantClient: QdrantClient | null = null;
  private readonly qdrantCollectionName = "campusmind_chunks";
  private readonly vectorDimension = 1536; // OpenAI embedding dimension

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.provider = this.config.get<string>("VECTOR_DB_PROVIDER", "pgvector");
  }

  async onModuleInit(): Promise<void> {
    if (this.provider === "qdrant") {
      await this.initializeQdrant();
    }
  }

  /**
   * Inicializa el cliente de Qdrant y crea la colección si no existe
   */
  private async initializeQdrant(): Promise<void> {
    try {
      const qdrantUrl = this.config.get<string>(
        "QDRANT_URL",
        "http://localhost:6333",
      );
      const qdrantApiKey = this.config.get<string>("QDRANT_API_KEY");

      this.qdrantClient = new QdrantClient({
        url: qdrantUrl,
        apiKey: qdrantApiKey,
      });

      // Verificar si la colección existe
      const collections = await this.qdrantClient.getCollections();
      const collectionExists = collections.collections.some(
        (c) => c.name === this.qdrantCollectionName,
      );

      if (!collectionExists) {
        await this.qdrantClient.createCollection(this.qdrantCollectionName, {
          vectors: {
            size: this.vectorDimension,
            distance: "Cosine",
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });

        // Crear índices para filtrado eficiente
        await this.qdrantClient.createPayloadIndex(this.qdrantCollectionName, {
          field_name: "resourceId",
          field_schema: "keyword",
        });

        await this.qdrantClient.createPayloadIndex(this.qdrantCollectionName, {
          field_name: "subjectId",
          field_schema: "keyword",
        });

        this.logger.log(
          `Created Qdrant collection: ${this.qdrantCollectionName}`,
        );
      }

      this.logger.log("Qdrant client initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Qdrant client", error);
      throw error;
    }
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
      case "pgvector":
        return this.storePgVector(resourceId, content, embedding, metadata);
      case "qdrant":
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
    // Usar batch para Qdrant (más eficiente)
    if (this.provider === "qdrant") {
      return this.storeQdrantBatch(chunks);
    }

    // Para pgvector, insertar uno a uno
    const ids: string[] = [];
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
      case "pgvector":
        return this.searchPgVector(queryEmbedding, options);
      case "qdrant":
        return this.searchQdrant(queryEmbedding, options);
      default:
        return this.searchPgVector(queryEmbedding, options);
    }
  }

  /**
   * Elimina todos los chunks de un recurso
   */
  async deleteByResource(resourceId: string): Promise<void> {
    if (this.provider === "qdrant") {
      await this.deleteQdrantByResource(resourceId);
    } else {
      await this.prisma.resourceChunk.deleteMany({
        where: { resourceId },
      });
    }
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
    const embeddingStr = `[${embedding.join(",")}]`;

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
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Construir condiciones WHERE dinámicamente
    let whereConditions = "";
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

    type QueryResult = {
      id: string;
      content: string;
      metadata: any;
      resource_id: string;
      resource_title: string;
      score: number;
    };

    return results
      .filter((r: QueryResult) => r.score >= minScore)
      .map((r: QueryResult) => ({
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
  // QDRANT IMPLEMENTATION
  // ============================================

  private async storeQdrant(
    resourceId: string,
    content: string,
    embedding: number[],
    metadata: Partial<ChunkMetadata>,
  ): Promise<string> {
    if (!this.qdrantClient) {
      throw new Error("Qdrant client not initialized");
    }

    const pointId = uuidv4();

    await this.qdrantClient.upsert(this.qdrantCollectionName, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            resourceId,
            content,
            chunkIndex: metadata.chunkIndex || 0,
            resourceTitle: metadata.resourceTitle || "",
            page: metadata.page,
            section: metadata.section,
            timestamp: metadata.timestamp,
            createdAt: new Date().toISOString(),
          },
        },
      ],
    });

    return pointId;
  }

  /**
   * Almacena múltiples chunks en Qdrant en batch (más eficiente)
   */
  private async storeQdrantBatch(
    chunks: Array<{
      resourceId: string;
      content: string;
      embedding: number[];
      metadata: Partial<ChunkMetadata>;
    }>,
  ): Promise<string[]> {
    if (!this.qdrantClient) {
      throw new Error("Qdrant client not initialized");
    }

    const points = chunks.map((chunk) => ({
      id: uuidv4(),
      vector: chunk.embedding,
      payload: {
        resourceId: chunk.resourceId,
        content: chunk.content,
        chunkIndex: chunk.metadata.chunkIndex || 0,
        resourceTitle: chunk.metadata.resourceTitle || "",
        page: chunk.metadata.page,
        section: chunk.metadata.section,
        timestamp: chunk.metadata.timestamp,
        createdAt: new Date().toISOString(),
      },
    }));

    await this.qdrantClient.upsert(this.qdrantCollectionName, {
      wait: true,
      points,
    });

    return points.map((p) => p.id as string);
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
    if (!this.qdrantClient) {
      throw new Error("Qdrant client not initialized");
    }

    const topK = options.topK || 5;
    const minScore = options.minScore || 0.7;

    // Construir filtros
    const filter: any = { must: [] };

    if (options.resourceIds && options.resourceIds.length > 0) {
      filter.must.push({
        key: "resourceId",
        match: { any: options.resourceIds },
      });
    }

    if (options.subjectId) {
      filter.must.push({
        key: "subjectId",
        match: { value: options.subjectId },
      });
    }

    const searchResult = await this.qdrantClient.search(
      this.qdrantCollectionName,
      {
        vector: queryEmbedding,
        limit: topK,
        score_threshold: minScore,
        filter: filter.must.length > 0 ? filter : undefined,
        with_payload: true,
      },
    );

    return searchResult.map((result) => ({
      id: result.id as string,
      content: (result.payload?.content as string) || "",
      metadata: {
        resourceId: (result.payload?.resourceId as string) || "",
        resourceTitle: (result.payload?.resourceTitle as string) || "",
        chunkIndex: (result.payload?.chunkIndex as number) || 0,
        page: result.payload?.page as number | undefined,
        section: result.payload?.section as string | undefined,
      },
      score: result.score,
    }));
  }

  /**
   * Elimina todos los chunks de un recurso en Qdrant
   */
  private async deleteQdrantByResource(resourceId: string): Promise<void> {
    if (!this.qdrantClient) {
      throw new Error("Qdrant client not initialized");
    }

    await this.qdrantClient.delete(this.qdrantCollectionName, {
      wait: true,
      filter: {
        must: [
          {
            key: "resourceId",
            match: { value: resourceId },
          },
        ],
      },
    });
  }

  /**
   * Obtiene estadísticas de la colección de Qdrant
   */
  async getQdrantStats(): Promise<{
    vectorsCount: number;
    pointsCount: number;
    segmentsCount: number;
    status: string;
  } | null> {
    if (!this.qdrantClient || this.provider !== "qdrant") {
      return null;
    }

    try {
      const collectionInfo = await this.qdrantClient.getCollection(
        this.qdrantCollectionName,
      );

      return {
        vectorsCount: collectionInfo.indexed_vectors_count ?? 0,
        pointsCount: collectionInfo.points_count ?? 0,
        segmentsCount: collectionInfo.segments_count ?? 0,
        status: collectionInfo.status,
      };
    } catch (error) {
      this.logger.error("Error getting Qdrant stats", error);
      return null;
    }
  }
}

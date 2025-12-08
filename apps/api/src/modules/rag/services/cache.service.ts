import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

interface EmbeddingCacheEntry {
  embedding: number[];
  tokenCount: number;
}

interface RagCacheEntry {
  answer: string;
  citations: any[];
  tokensUsed: number;
}

interface CacheStats {
  embeddingHits: number;
  embeddingMisses: number;
  ragHits: number;
  ragMisses: number;
  embeddingCacheSize: number;
  ragCacheSize: number;
}

/**
 * Servicio de cache en memoria para optimizar el pipeline RAG
 *
 * Implementa:
 * - Cache de embeddings para queries frecuentes
 * - Cache de respuestas RAG para consultas similares
 * - TTL configurable por tipo de cache
 * - Limpieza automática de entradas expiradas
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // Caches en memoria
  private embeddingCache = new Map<string, CacheEntry<EmbeddingCacheEntry>>();
  private ragCache = new Map<string, CacheEntry<RagCacheEntry>>();

  // Configuración
  private readonly embeddingTTL = 24 * 60 * 60 * 1000; // 24 horas
  private readonly ragTTL = 1 * 60 * 60 * 1000; // 1 hora
  private readonly maxEmbeddingCacheSize = 1000;
  private readonly maxRagCacheSize = 500;

  // Estadísticas
  private stats: CacheStats = {
    embeddingHits: 0,
    embeddingMisses: 0,
    ragHits: 0,
    ragMisses: 0,
    embeddingCacheSize: 0,
    ragCacheSize: 0,
  };

  constructor() {
    // Limpiar cache expirado cada 5 minutos
    setInterval(() => this.cleanExpiredEntries(), 5 * 60 * 1000);
  }

  /**
   * Genera una clave de cache normalizada para un texto
   */
  private hashText(text: string): string {
    const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
    return createHash("md5").update(normalized).digest("hex");
  }

  /**
   * Genera clave para cache RAG que incluye opciones
   */
  private hashRagQuery(
    query: string,
    options?: { subjectId?: string; resourceIds?: string[] },
  ): string {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
    const optionsStr = JSON.stringify({
      s: options?.subjectId || "",
      r: (options?.resourceIds || []).sort().join(","),
    });
    return createHash("md5")
      .update(normalized + optionsStr)
      .digest("hex");
  }

  // ==================== Embedding Cache ====================

  getEmbedding(text: string): EmbeddingCacheEntry | null {
    const key = this.hashText(text);
    const entry = this.embeddingCache.get(key);

    if (!entry) {
      this.stats.embeddingMisses++;
      return null;
    }

    // Verificar TTL
    if (Date.now() - entry.timestamp > this.embeddingTTL) {
      this.embeddingCache.delete(key);
      this.stats.embeddingMisses++;
      return null;
    }

    entry.hits++;
    this.stats.embeddingHits++;
    return entry.value;
  }

  setEmbedding(text: string, embedding: number[], tokenCount: number): void {
    // Evitar cache overflow
    if (this.embeddingCache.size >= this.maxEmbeddingCacheSize) {
      this.evictLeastUsed(this.embeddingCache);
    }

    const key = this.hashText(text);
    this.embeddingCache.set(key, {
      value: { embedding, tokenCount },
      timestamp: Date.now(),
      hits: 0,
    });
    this.stats.embeddingCacheSize = this.embeddingCache.size;
  }

  // ==================== RAG Response Cache ====================

  getRagResponse(
    query: string,
    options?: { subjectId?: string; resourceIds?: string[] },
  ): RagCacheEntry | null {
    const key = this.hashRagQuery(query, options);
    const entry = this.ragCache.get(key);

    if (!entry) {
      this.stats.ragMisses++;
      return null;
    }

    // Verificar TTL
    if (Date.now() - entry.timestamp > this.ragTTL) {
      this.ragCache.delete(key);
      this.stats.ragMisses++;
      return null;
    }

    entry.hits++;
    this.stats.ragHits++;
    this.logger.debug(
      `RAG cache hit for query: "${query.substring(0, 50)}..."`,
    );
    return entry.value;
  }

  setRagResponse(
    query: string,
    response: RagCacheEntry,
    options?: { subjectId?: string; resourceIds?: string[] },
  ): void {
    // Evitar cache overflow
    if (this.ragCache.size >= this.maxRagCacheSize) {
      this.evictLeastUsed(this.ragCache);
    }

    const key = this.hashRagQuery(query, options);
    this.ragCache.set(key, {
      value: response,
      timestamp: Date.now(),
      hits: 0,
    });
    this.stats.ragCacheSize = this.ragCache.size;
  }

  /**
   * Invalida cache relacionado a un recurso específico
   */
  invalidateByResource(resourceId: string): void {
    // Los embeddings no dependen de recursos, solo el RAG cache
    // Invalidamos todo el RAG cache ya que podría contener respuestas con ese recurso
    this.ragCache.clear();
    this.stats.ragCacheSize = 0;
    this.logger.log(`RAG cache cleared due to resource update: ${resourceId}`);
  }

  /**
   * Invalida cache relacionado a una materia
   */
  invalidateBySubject(subjectId: string): void {
    // Invalidar entradas que usan esta materia
    for (const [key, entry] of this.ragCache.entries()) {
      // No tenemos forma directa de saber qué entradas usan esta materia
      // sin guardar metadata adicional, así que por ahora limpiamos todo
    }
    this.ragCache.clear();
    this.stats.ragCacheSize = 0;
    this.logger.log(`RAG cache cleared due to subject update: ${subjectId}`);
  }

  // ==================== Utilities ====================

  private evictLeastUsed<T>(cache: Map<string, CacheEntry<T>>): void {
    // Eliminar el 10% de las entradas menos usadas
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].hits - b[1].hits)
      .slice(0, Math.ceil(cache.size * 0.1));

    for (const [key] of entries) {
      cache.delete(key);
    }

    this.logger.debug(`Evicted ${entries.length} least used cache entries`);
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    let embeddingCleaned = 0;
    let ragCleaned = 0;

    for (const [key, entry] of this.embeddingCache.entries()) {
      if (now - entry.timestamp > this.embeddingTTL) {
        this.embeddingCache.delete(key);
        embeddingCleaned++;
      }
    }

    for (const [key, entry] of this.ragCache.entries()) {
      if (now - entry.timestamp > this.ragTTL) {
        this.ragCache.delete(key);
        ragCleaned++;
      }
    }

    if (embeddingCleaned > 0 || ragCleaned > 0) {
      this.logger.debug(
        `Cache cleanup: removed ${embeddingCleaned} embedding entries, ${ragCleaned} RAG entries`,
      );
    }

    this.stats.embeddingCacheSize = this.embeddingCache.size;
    this.stats.ragCacheSize = this.ragCache.size;
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      embeddingCacheSize: this.embeddingCache.size,
      ragCacheSize: this.ragCache.size,
    };
  }

  getCacheHitRate(): { embedding: number; rag: number } {
    const embeddingTotal =
      this.stats.embeddingHits + this.stats.embeddingMisses;
    const ragTotal = this.stats.ragHits + this.stats.ragMisses;

    return {
      embedding:
        embeddingTotal > 0 ? this.stats.embeddingHits / embeddingTotal : 0,
      rag: ragTotal > 0 ? this.stats.ragHits / ragTotal : 0,
    };
  }

  clearAll(): void {
    this.embeddingCache.clear();
    this.ragCache.clear();
    this.stats = {
      embeddingHits: 0,
      embeddingMisses: 0,
      ragHits: 0,
      ragMisses: 0,
      embeddingCacheSize: 0,
      ragCacheSize: 0,
    };
    this.logger.log("All caches cleared");
  }
}

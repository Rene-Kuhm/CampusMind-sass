import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { EmbeddingResult } from '../interfaces/rag.interface';
import { CacheService } from './cache.service';

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

/**
 * Servicio de embeddings con abstracción para múltiples proveedores
 * Incluye cache en memoria para optimizar costos y latencia
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly provider: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly dimensions = 1536; // text-embedding-3-small default

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    @Inject(forwardRef(() => CacheService))
    private readonly cache: CacheService,
  ) {
    this.provider = this.config.get<string>('LLM_PROVIDER', 'openai');
    this.model = this.config.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small');
    this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
  }

  /**
   * Genera embedding para un texto (con cache)
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Verificar cache primero
    const cached = this.cache.getEmbedding(text);
    if (cached) {
      return cached;
    }

    let result: EmbeddingResult;
    switch (this.provider) {
      case 'openai':
        result = await this.generateOpenAIEmbedding(text);
        break;
      // Agregar más proveedores aquí (Cohere, HuggingFace, etc.)
      default:
        result = await this.generateOpenAIEmbedding(text);
    }

    // Guardar en cache
    this.cache.setEmbedding(text, result.embedding, result.tokenCount);
    return result;
  }

  /**
   * Genera embeddings para múltiples textos en batch (con cache)
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = new Array(texts.length);
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];

    // Verificar cache para cada texto
    for (let i = 0; i < texts.length; i++) {
      const cached = this.cache.getEmbedding(texts[i]);
      if (cached) {
        results[i] = cached;
      } else {
        uncachedTexts.push(texts[i]);
        uncachedIndices.push(i);
      }
    }

    this.logger.debug(
      `Embedding batch: ${texts.length - uncachedTexts.length} cached, ${uncachedTexts.length} to generate`,
    );

    // Generar embeddings solo para los no cacheados
    if (uncachedTexts.length > 0) {
      const batchSize = 100;

      for (let i = 0; i < uncachedTexts.length; i += batchSize) {
        const batch = uncachedTexts.slice(i, i + batchSize);
        const batchIndices = uncachedIndices.slice(i, i + batchSize);
        const batchResults = await this.generateOpenAIEmbeddingBatch(batch);

        // Guardar en cache y en resultados
        for (let j = 0; j < batchResults.length; j++) {
          const originalIndex = batchIndices[j];
          const text = uncachedTexts[i + j];
          results[originalIndex] = batchResults[j];
          this.cache.setEmbedding(text, batchResults[j].embedding, batchResults[j].tokenCount);
        }
      }
    }

    return results;
  }

  private async generateOpenAIEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response: AxiosResponse<OpenAIEmbeddingResponse> = await firstValueFrom(
        this.http.post<OpenAIEmbeddingResponse>(
          'https://api.openai.com/v1/embeddings',
          {
            input: text,
            model: this.model,
            dimensions: this.dimensions,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data: OpenAIEmbeddingResponse = response.data;

      return {
        embedding: data.data[0].embedding,
        tokenCount: data.usage.total_tokens,
      };
    } catch (error) {
      this.logger.error(`OpenAI embedding failed: ${error}`);
      throw new Error('Failed to generate embedding');
    }
  }

  private async generateOpenAIEmbeddingBatch(
    texts: string[],
  ): Promise<EmbeddingResult[]> {
    try {
      const response: AxiosResponse<OpenAIEmbeddingResponse> = await firstValueFrom(
        this.http.post<OpenAIEmbeddingResponse>(
          'https://api.openai.com/v1/embeddings',
          {
            input: texts,
            model: this.model,
            dimensions: this.dimensions,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data: OpenAIEmbeddingResponse = response.data;
      const tokensPerItem = Math.ceil(data.usage.total_tokens / texts.length);

      return data.data.map((item) => ({
        embedding: item.embedding,
        tokenCount: tokensPerItem,
      }));
    } catch (error) {
      this.logger.error(`OpenAI batch embedding failed: ${error}`);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Calcula similitud coseno entre dos embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

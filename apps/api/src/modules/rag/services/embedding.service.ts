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

interface GeminiEmbeddingResponse {
  embedding: {
    values: number[];
  };
}

interface GeminiBatchEmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

/**
 * Servicio de embeddings con soporte para múltiples proveedores
 * Soporta: OpenAI, Google Gemini (FREE)
 * Incluye cache en memoria para optimizar costos y latencia
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly provider: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly geminiApiKey: string;
  private readonly dimensions: number;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    @Inject(forwardRef(() => CacheService))
    private readonly cache: CacheService,
  ) {
    this.provider = this.config.get<string>('EMBEDDING_PROVIDER', 'auto');
    this.model = this.config.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small');
    this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
    this.geminiApiKey = this.config.get<string>('GEMINI_API_KEY', '');

    // Determine dimensions based on provider
    // OpenAI text-embedding-3-small: 1536
    // Gemini text-embedding-004: 768
    this.dimensions = this.getEffectiveProvider() === 'gemini' ? 768 : 1536;

    this.logger.log(`Embedding service initialized with provider: ${this.getEffectiveProvider()}`);
  }

  /**
   * Get the effective provider to use
   * If 'auto', picks based on available API keys
   */
  private getEffectiveProvider(): string {
    if (this.provider !== 'auto') {
      return this.provider;
    }

    // Auto-select: prefer Gemini (free) if available
    if (this.geminiApiKey && this.geminiApiKey !== 'your-gemini-api-key') {
      return 'gemini';
    }
    if (this.apiKey && this.apiKey !== 'your-openai-api-key') {
      return 'openai';
    }

    // Default to gemini if we have a key
    return this.geminiApiKey ? 'gemini' : 'openai';
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
    const effectiveProvider = this.getEffectiveProvider();

    switch (effectiveProvider) {
      case 'gemini':
        result = await this.generateGeminiEmbedding(text);
        break;
      case 'openai':
        result = await this.generateOpenAIEmbedding(text);
        break;
      default:
        // Try Gemini first, fallback to OpenAI
        if (this.geminiApiKey) {
          result = await this.generateGeminiEmbedding(text);
        } else {
          result = await this.generateOpenAIEmbedding(text);
        }
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
      const effectiveProvider = this.getEffectiveProvider();
      const batchSize = effectiveProvider === 'gemini' ? 100 : 100;

      for (let i = 0; i < uncachedTexts.length; i += batchSize) {
        const batch = uncachedTexts.slice(i, i + batchSize);
        const batchIndices = uncachedIndices.slice(i, i + batchSize);

        let batchResults: EmbeddingResult[];
        if (effectiveProvider === 'gemini') {
          batchResults = await this.generateGeminiEmbeddingBatch(batch);
        } else {
          batchResults = await this.generateOpenAIEmbeddingBatch(batch);
        }

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

  // ============================================
  // GEMINI EMBEDDINGS (FREE!)
  // ============================================

  private async generateGeminiEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response: AxiosResponse<GeminiEmbeddingResponse> = await firstValueFrom(
        this.http.post<GeminiEmbeddingResponse>(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiApiKey}`,
          {
            content: {
              parts: [{ text }],
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        embedding: response.data.embedding.values,
        tokenCount: Math.ceil(text.length / 4), // Approximate token count
      };
    } catch (error) {
      this.logger.error(`Gemini embedding failed: ${error}`);
      throw new Error('Failed to generate Gemini embedding');
    }
  }

  private async generateGeminiEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]> {
    // Gemini doesn't have a true batch API, so we process sequentially
    // but could be parallelized with Promise.all for better performance
    const results: EmbeddingResult[] = [];

    // Process in parallel batches of 10 for better performance
    const parallelBatchSize = 10;
    for (let i = 0; i < texts.length; i += parallelBatchSize) {
      const batch = texts.slice(i, i + parallelBatchSize);
      const batchPromises = batch.map(text => this.generateGeminiEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // ============================================
  // OPENAI EMBEDDINGS
  // ============================================

  private async generateOpenAIEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response: AxiosResponse<OpenAIEmbeddingResponse> = await firstValueFrom(
        this.http.post<OpenAIEmbeddingResponse>(
          'https://api.openai.com/v1/embeddings',
          {
            input: text,
            model: this.model,
            dimensions: 1536,
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
            dimensions: 1536,
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

  // ============================================
  // UTILS
  // ============================================

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

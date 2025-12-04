import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EmbeddingResult } from '../interfaces/rag.interface';

/**
 * Servicio de embeddings con abstracción para múltiples proveedores
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
  ) {
    this.provider = this.config.get<string>('LLM_PROVIDER', 'openai');
    this.model = this.config.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small');
    this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
  }

  /**
   * Genera embedding para un texto
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    switch (this.provider) {
      case 'openai':
        return this.generateOpenAIEmbedding(text);
      // Agregar más proveedores aquí (Cohere, HuggingFace, etc.)
      default:
        return this.generateOpenAIEmbedding(text);
    }
  }

  /**
   * Genera embeddings para múltiples textos en batch
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    // OpenAI soporta batch de hasta 2048 inputs
    const batchSize = 100;
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await this.generateOpenAIEmbeddingBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  private async generateOpenAIEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await firstValueFrom(
        this.http.post(
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

      const data = response.data;

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
      const response = await firstValueFrom(
        this.http.post(
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

      const data = response.data;
      const tokensPerItem = Math.ceil(data.usage.total_tokens / texts.length);

      return data.data.map((item: any) => ({
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

import { Injectable, Logger } from '@nestjs/common';
import { OpenAlexProvider } from './providers/openalex.provider';
import { SemanticScholarProvider } from './providers/semantic-scholar.provider';
import { CrossrefProvider } from './providers/crossref.provider';
import {
  AcademicResource,
  SearchQuery,
  SearchResult,
  AcademicSource,
} from './interfaces/academic-resource.interface';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(
    private readonly openAlex: OpenAlexProvider,
    private readonly semanticScholar: SemanticScholarProvider,
    private readonly crossref: CrossrefProvider,
  ) {}

  /**
   * Busca en una fuente académica específica
   */
  async search(
    query: SearchQuery,
    source: AcademicSource = 'openalex',
  ): Promise<SearchResult> {
    this.logger.log(`Searching ${source} for: ${query.query}`);

    switch (source) {
      case 'semantic_scholar':
        return this.semanticScholar.search(query);
      case 'crossref':
        return this.crossref.search(query);
      case 'openalex':
      default:
        return this.openAlex.search(query);
    }
  }

  /**
   * Busca en múltiples fuentes y combina resultados
   */
  async searchMultiple(
    query: SearchQuery,
    sources: AcademicSource[] = ['openalex', 'semantic_scholar', 'crossref'],
  ): Promise<{
    results: AcademicResource[];
    totalBySource: Record<AcademicSource, number>;
  }> {
    const searchPromises = sources.map((source) =>
      this.search(query, source).catch((error) => {
        this.logger.error(`Error searching ${source}: ${error}`);
        return {
          items: [],
          total: 0,
          page: 1,
          perPage: 25,
          source,
        } as SearchResult;
      }),
    );

    const results = await Promise.all(searchPromises);

    // Combinar y deduplicar por DOI si existe
    const seen = new Set<string>();
    const combined: AcademicResource[] = [];
    const totalBySource: Record<string, number> = {};

    for (const result of results) {
      totalBySource[result.source] = result.total;

      for (const item of result.items) {
        const key = item.doi || `${item.source}:${item.externalId}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }
    }

    return {
      results: combined,
      totalBySource: totalBySource as Record<AcademicSource, number>,
    };
  }

  /**
   * Obtiene un recurso por ID de una fuente específica
   */
  async getById(
    externalId: string,
    source: AcademicSource,
  ): Promise<AcademicResource | null> {
    switch (source) {
      case 'semantic_scholar':
        return this.semanticScholar.getById(externalId);
      case 'crossref':
        return this.crossref.getById(externalId);
      case 'openalex':
        return this.openAlex.getById(externalId);
      default:
        return null;
    }
  }

  /**
   * Obtiene recursos recomendados basados en topics
   */
  async getRecommendations(
    topics: string[],
    options?: {
      isOpenAccess?: boolean;
      limit?: number;
    },
  ): Promise<AcademicResource[]> {
    if (topics.length === 0) return [];

    const query: SearchQuery = {
      query: topics.join(' OR '),
      filters: {
        isOpenAccess: options?.isOpenAccess ?? true,
      },
      pagination: {
        page: 1,
        perPage: options?.limit || 10,
      },
      sort: 'relevance',
    };

    const result = await this.search(query, 'openalex');
    return result.items;
  }
}

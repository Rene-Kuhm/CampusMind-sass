import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { OpenAlexProvider } from './providers/openalex.provider';
import { SemanticScholarProvider } from './providers/semantic-scholar.provider';
import { CrossrefProvider } from './providers/crossref.provider';
import { YouTubeProvider } from './providers/youtube.provider';
import { GoogleBooksProvider } from './providers/google-books.provider';
import { ArchiveOrgProvider } from './providers/archive-org.provider';
import { LibGenProvider } from './providers/libgen.provider';
import { WebSearchProvider } from './providers/web-search.provider';
import { MedicalBooksProvider } from './providers/medical-books.provider';
import {
  AcademicResource,
  AcademicResourceType,
  SearchQuery,
  SearchResult,
  AcademicSource,
} from './interfaces/academic-resource.interface';

// Categorías de búsqueda
export type SearchCategory = 'all' | 'papers' | 'books' | 'videos' | 'courses' | 'medical';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAlex: OpenAlexProvider,
    private readonly semanticScholar: SemanticScholarProvider,
    private readonly crossref: CrossrefProvider,
    private readonly youtube: YouTubeProvider,
    private readonly googleBooks: GoogleBooksProvider,
    private readonly archiveOrg: ArchiveOrgProvider,
    private readonly libgen: LibGenProvider,
    private readonly webSearch: WebSearchProvider,
    private readonly medicalBooks: MedicalBooksProvider,
  ) {}

  /**
   * Busca en una fuente académica específica
   */
  async search(
    query: SearchQuery,
    source: AcademicSource = 'openalex',
  ): Promise<SearchResult> {
    this.logger.log(`Searching ${source} for: ${query.query}`);

    try {
      switch (source) {
        case 'semantic_scholar':
          return await this.semanticScholar.search(query);
        case 'crossref':
          return await this.crossref.search(query);
        case 'youtube':
          return await this.youtube.search(query);
        case 'google_books':
          return await this.googleBooks.search(query);
        case 'archive_org':
          return await this.archiveOrg.search(query);
        case 'libgen':
          return await this.libgen.search(query);
        case 'web':
          return await this.webSearch.search(query);
        case 'medical_books':
          return await this.medicalBooks.search(query);
        case 'openalex':
        default:
          return await this.openAlex.search(query);
      }
    } catch (error) {
      this.logger.error(`Error searching ${source}: ${error}`);
      return {
        items: [],
        total: 0,
        page: query.pagination?.page || 1,
        perPage: query.pagination?.perPage || 25,
        source,
      };
    }
  }

  /**
   * Búsqueda unificada en todas las fuentes
   * Busca en paralelo y combina resultados
   */
  async searchAll(
    query: SearchQuery,
    category: SearchCategory = 'all',
  ): Promise<{
    results: AcademicResource[];
    totalBySource: Record<string, number>;
  }> {
    const sources = this.getSourcesByCategory(category);
    return this.searchMultiple(query, sources);
  }

  /**
   * Obtiene las fuentes según la categoría
   */
  private getSourcesByCategory(category: SearchCategory): AcademicSource[] {
    switch (category) {
      case 'papers':
        return ['openalex', 'semantic_scholar', 'crossref'];
      case 'books':
        return ['google_books', 'archive_org', 'libgen', 'medical_books'];
      case 'videos':
        return ['youtube'];
      case 'courses':
        return ['archive_org', 'web'];
      case 'medical':
        return ['medical_books', 'openalex', 'semantic_scholar'];
      case 'all':
      default:
        return [
          'openalex',
          'google_books',
          'youtube',
          'archive_org',
          'crossref',
          'medical_books',
        ];
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
    this.logger.log(`Searching multiple sources: ${sources.join(', ')}`);

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

    // Combinar y deduplicar por DOI/URL si existe
    const seen = new Set<string>();
    const combined: AcademicResource[] = [];
    const totalBySource: Record<string, number> = {};

    for (const result of results) {
      totalBySource[result.source] = result.total;

      for (const item of result.items) {
        // Use DOI, URL, or source:id as unique key
        const key = item.doi || item.url || `${item.source}:${item.externalId}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }
    }

    // Sort by relevance (items with thumbnails and abstracts first)
    combined.sort((a, b) => {
      const scoreA = (a.thumbnailUrl ? 2 : 0) + (a.abstract ? 1 : 0);
      const scoreB = (b.thumbnailUrl ? 2 : 0) + (b.abstract ? 1 : 0);
      return scoreB - scoreA;
    });

    this.logger.log(`Found ${combined.length} unique results from ${sources.length} sources`);

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
    try {
      switch (source) {
        case 'semantic_scholar':
          return await this.semanticScholar.getById(externalId);
        case 'crossref':
          return await this.crossref.getById(externalId);
        case 'openalex':
          return await this.openAlex.getById(externalId);
        case 'google_books':
          return await this.googleBooks.getById(externalId);
        case 'archive_org':
          return await this.archiveOrg.getById(externalId);
        default:
          return null;
      }
    } catch (error) {
      this.logger.error(`Error getting ${source}:${externalId}: ${error}`);
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
      category?: SearchCategory;
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

    const { results } = await this.searchAll(query, options?.category || 'all');
    return results.slice(0, options?.limit || 10);
  }

  /**
   * Importa un recurso académico a una materia del usuario
   */
  async importToSubject(
    subjectId: string,
    userId: string,
    resource: AcademicResource,
  ) {
    // Verify subject ownership
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new Error('Materia no encontrada');
    }

    // Map AcademicResourceType to internal ResourceType
    const typeMap: Record<AcademicResourceType | string, string> = {
      paper: 'PAPER',
      book: 'BOOK',
      book_chapter: 'BOOK',
      article: 'ARTICLE',
      thesis: 'PAPER',
      conference: 'PAPER',
      preprint: 'PAPER',
      dataset: 'OTHER',
      course: 'COURSE',
      video: 'VIDEO',
      manual: 'MANUAL',
      notes: 'NOTES',
      report: 'PAPER',
      standard: 'OTHER',
      reference: 'OTHER',
      other: 'OTHER',
    };

    const resourceType = typeMap[resource.type] || 'OTHER';

    // Create the resource
    return this.prisma.resource.create({
      data: {
        subjectId,
        title: resource.title,
        authors: resource.authors || [],
        description: resource.abstract || null,
        url: resource.url || resource.pdfUrl || null,
        type: resourceType as any,
        level: 'INTERMEDIATE',
        language: resource.language || 'en',
        isOpenAccess: resource.isOpenAccess,
        license: resource.license || null,
        externalId: resource.externalId,
        externalSource: resource.source as string,
      },
    });
  }
}

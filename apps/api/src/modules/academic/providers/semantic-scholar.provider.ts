import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import {
  AcademicProvider,
  AcademicResource,
  SearchQuery,
  SearchResult,
  AcademicResourceType,
} from "../interfaces/academic-resource.interface";

/**
 * Semantic Scholar Provider
 * API gratuita con datos de 200M+ papers
 * Docs: https://api.semanticscholar.org/
 */
@Injectable()
export class SemanticScholarProvider implements AcademicProvider {
  readonly name = "semantic_scholar" as const;
  private readonly baseUrl = "https://api.semanticscholar.org/graph/v1";
  private readonly logger = new Logger(SemanticScholarProvider.name);
  private readonly apiKey?: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>("SEMANTIC_SCHOLAR_API_KEY");
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const fields = [
        "paperId",
        "title",
        "abstract",
        "authors",
        "year",
        "publicationDate",
        "venue",
        "isOpenAccess",
        "openAccessPdf",
        "citationCount",
        "referenceCount",
        "publicationTypes",
        "externalIds",
      ].join(",");

      const offset =
        ((query.pagination?.page || 1) - 1) * (query.pagination?.perPage || 25);
      const limit = Math.min(query.pagination?.perPage || 25, 100);

      let url = `${this.baseUrl}/paper/search?query=${encodeURIComponent(query.query)}&fields=${fields}&offset=${offset}&limit=${limit}`;

      // Filtros
      if (query.filters?.year) {
        url += `&year=${query.filters.year}`;
      } else if (query.filters?.yearFrom || query.filters?.yearTo) {
        const from = query.filters.yearFrom || 1900;
        const to = query.filters.yearTo || new Date().getFullYear();
        url += `&year=${from}-${to}`;
      }

      if (query.filters?.isOpenAccess) {
        url += "&openAccessPdf";
      }

      const response = await firstValueFrom(
        this.http.get(url, {
          headers: this.apiKey ? { "x-api-key": this.apiKey } : {},
        }),
      );

      const data = response.data;

      return {
        items: (data.data || []).map((paper: any) =>
          this.normalizePaper(paper),
        ),
        total: data.total || 0,
        page: query.pagination?.page || 1,
        perPage: limit,
        source: this.name,
      };
    } catch (error) {
      this.logger.error(`Semantic Scholar search failed: ${error}`);
      return {
        items: [],
        total: 0,
        page: 1,
        perPage: 25,
        source: this.name,
      };
    }
  }

  async getById(externalId: string): Promise<AcademicResource | null> {
    try {
      const fields = [
        "paperId",
        "title",
        "abstract",
        "authors",
        "year",
        "publicationDate",
        "venue",
        "isOpenAccess",
        "openAccessPdf",
        "citationCount",
        "referenceCount",
        "publicationTypes",
        "externalIds",
      ].join(",");

      const url = `${this.baseUrl}/paper/${externalId}?fields=${fields}`;

      const response = await firstValueFrom(
        this.http.get(url, {
          headers: this.apiKey ? { "x-api-key": this.apiKey } : {},
        }),
      );

      return this.normalizePaper(response.data);
    } catch (error) {
      this.logger.error(
        `Semantic Scholar getById failed for ${externalId}: ${error}`,
      );
      return null;
    }
  }

  private normalizePaper(paper: any): AcademicResource {
    return {
      externalId: paper.paperId || "",
      source: this.name,
      title: paper.title || "Sin título",
      authors: (paper.authors || [])
        .map((a: any) => a.name)
        .filter(Boolean)
        .slice(0, 10),
      abstract: paper.abstract,
      publicationDate: paper.publicationDate,
      publicationYear: paper.year,
      type: this.mapPaperType(paper.publicationTypes),
      url: paper.openAccessPdf?.url,
      pdfUrl: paper.openAccessPdf?.url,
      isOpenAccess: paper.isOpenAccess || false,
      citationCount: paper.citationCount,
      referenceCount: paper.referenceCount,
      doi: paper.externalIds?.DOI,
      venue: paper.venue,
    };
  }

  private mapPaperType(types: string[] | null): AcademicResourceType {
    if (!types || types.length === 0) return "paper";

    const typeMap: Record<string, AcademicResourceType> = {
      JournalArticle: "article",
      Conference: "conference",
      Book: "book",
      BookSection: "book_chapter",
      Dataset: "dataset",
      Review: "article",
    };

    for (const type of types) {
      if (typeMap[type]) return typeMap[type];
    }

    return "paper";
  }
}

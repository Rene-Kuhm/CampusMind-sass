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
 * OpenAlex Provider
 * API gratuita con datos de 250M+ trabajos académicos
 * Docs: https://docs.openalex.org/
 */
@Injectable()
export class OpenAlexProvider implements AcademicProvider {
  readonly name = "openalex" as const;
  private readonly baseUrl = "https://api.openalex.org";
  private readonly logger = new Logger(OpenAlexProvider.name);
  private readonly email?: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    // OpenAlex recomienda pasar email para mejor rate limiting
    this.email = this.config.get<string>("OPENALEX_EMAIL");
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const params = this.buildSearchParams(query);
      const url = `${this.baseUrl}/works?${params}`;

      const response = await firstValueFrom(
        this.http.get(url, {
          headers: this.email
            ? { "User-Agent": `CampusMind (${this.email})` }
            : {},
        }),
      );

      const data = response.data;

      return {
        items: data.results.map((work: any) => this.normalizeWork(work)),
        total: data.meta.count,
        page: query.pagination?.page || 1,
        perPage: query.pagination?.perPage || 25,
        source: this.name,
      };
    } catch (error) {
      this.logger.error(`OpenAlex search failed: ${error}`);
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
      // OpenAlex IDs look like: W2741809807
      const url = `${this.baseUrl}/works/${externalId}`;

      const response = await firstValueFrom(
        this.http.get(url, {
          headers: this.email
            ? { "User-Agent": `CampusMind (${this.email})` }
            : {},
        }),
      );

      return this.normalizeWork(response.data);
    } catch (error) {
      this.logger.error(`OpenAlex getById failed for ${externalId}: ${error}`);
      return null;
    }
  }

  private buildSearchParams(query: SearchQuery): string {
    const params = new URLSearchParams();

    // Búsqueda principal
    params.set("search", query.query);

    // Filtros
    const filters: string[] = [];

    if (query.filters?.isOpenAccess) {
      filters.push("is_oa:true");
    }

    if (query.filters?.yearFrom) {
      filters.push(`publication_year:>${query.filters.yearFrom - 1}`);
    }

    if (query.filters?.yearTo) {
      filters.push(`publication_year:<${query.filters.yearTo + 1}`);
    }

    if (query.filters?.year) {
      filters.push(`publication_year:${query.filters.year}`);
    }

    if (filters.length > 0) {
      params.set("filter", filters.join(","));
    }

    // Paginación
    const page = query.pagination?.page || 1;
    const perPage = query.pagination?.perPage || 25;
    params.set("page", page.toString());
    params.set("per_page", Math.min(perPage, 200).toString());

    // Ordenamiento
    if (query.sort === "date") {
      params.set("sort", "publication_date:desc");
    } else if (query.sort === "citations") {
      params.set("sort", "cited_by_count:desc");
    }
    // relevance es el default

    return params.toString();
  }

  private normalizeWork(work: any): AcademicResource {
    return {
      externalId: work.id?.replace("https://openalex.org/", "") || "",
      source: this.name,
      title: work.title || "Sin título",
      authors: (work.authorships || [])
        .map((a: any) => a.author?.display_name)
        .filter(Boolean)
        .slice(0, 10),
      abstract: this.reconstructAbstract(work.abstract_inverted_index),
      publicationDate: work.publication_date,
      publicationYear: work.publication_year,
      type: this.mapWorkType(work.type),
      topics: (work.topics || []).map((t: any) => t.display_name).slice(0, 5),
      keywords: (work.keywords || [])
        .map((k: any) => k.display_name)
        .slice(0, 10),
      url: work.primary_location?.landing_page_url || work.doi,
      pdfUrl: work.primary_location?.pdf_url || work.open_access?.oa_url,
      isOpenAccess: work.open_access?.is_oa || false,
      license: work.primary_location?.license,
      citationCount: work.cited_by_count,
      referenceCount: work.referenced_works_count,
      doi: work.doi,
      journal: work.primary_location?.source?.display_name,
      publisher: work.primary_location?.source?.host_organization_name,
    };
  }

  private reconstructAbstract(
    invertedIndex: Record<string, number[]> | null,
  ): string | undefined {
    if (!invertedIndex) return undefined;

    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words.push([word, pos]);
      }
    }

    words.sort((a, b) => a[1] - b[1]);
    return words.map((w) => w[0]).join(" ");
  }

  private mapWorkType(type: string): AcademicResourceType {
    const typeMap: Record<string, AcademicResourceType> = {
      "journal-article": "article",
      "book-chapter": "book_chapter",
      book: "book",
      "proceedings-article": "conference",
      dissertation: "thesis",
      preprint: "preprint",
      dataset: "dataset",
    };
    return typeMap[type] || "paper";
  }
}

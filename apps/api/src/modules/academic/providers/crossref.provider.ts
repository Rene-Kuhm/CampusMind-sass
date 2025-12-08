import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import {
  AcademicProvider,
  AcademicResource,
  SearchQuery,
  SearchResult,
  AcademicResourceType,
} from "../interfaces/academic-resource.interface";

interface CrossrefWork {
  DOI: string;
  title?: string[];
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
  }>;
  abstract?: string;
  published?: {
    "date-parts"?: number[][];
  };
  "published-online"?: {
    "date-parts"?: number[][];
  };
  "published-print"?: {
    "date-parts"?: number[][];
  };
  type?: string;
  subject?: string[];
  "is-referenced-by-count"?: number;
  "references-count"?: number;
  URL?: string;
  link?: Array<{
    URL: string;
    "content-type"?: string;
    "intended-application"?: string;
  }>;
  license?: Array<{
    URL: string;
    "content-version"?: string;
  }>;
  "container-title"?: string[];
  publisher?: string;
  ISSN?: string[];
  ISBN?: string[];
}

interface CrossrefResponse {
  status: string;
  "message-type": string;
  message: {
    items?: CrossrefWork[];
    "total-results"?: number;
    "items-per-page"?: number;
  } & CrossrefWork;
}

/**
 * Crossref Provider
 * API para metadatos de publicaciones científicas con DOI
 * Docs: https://api.crossref.org/swagger-ui/index.html
 */
@Injectable()
export class CrossrefProvider implements AcademicProvider {
  readonly name = "crossref" as const;
  private readonly baseUrl = "https://api.crossref.org";
  private readonly logger = new Logger(CrossrefProvider.name);
  private readonly email?: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    // Crossref "polite pool" para mejor rate limiting
    this.email =
      this.config.get<string>("CROSSREF_EMAIL") ||
      this.config.get<string>("OPENALEX_EMAIL");
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const params = this.buildSearchParams(query);
      const url = `${this.baseUrl}/works?${params}`;

      const response: AxiosResponse<CrossrefResponse> = await firstValueFrom(
        this.http.get<CrossrefResponse>(url, {
          headers: this.getHeaders(),
        }),
      );

      const data = response.data;

      if (data.status !== "ok" || !data.message.items) {
        return this.emptyResult(query);
      }

      return {
        items: data.message.items.map((work) => this.normalizeWork(work)),
        total: data.message["total-results"] || 0,
        page: query.pagination?.page || 1,
        perPage: query.pagination?.perPage || 25,
        source: this.name,
      };
    } catch (error) {
      this.logger.error(`Crossref search failed: ${error}`);
      return this.emptyResult(query);
    }
  }

  async getById(externalId: string): Promise<AcademicResource | null> {
    try {
      // Crossref IDs are DOIs (e.g., 10.1000/xyz123)
      const doi = externalId.startsWith("10.")
        ? externalId
        : `10.${externalId}`;
      const url = `${this.baseUrl}/works/${encodeURIComponent(doi)}`;

      const response: AxiosResponse<CrossrefResponse> = await firstValueFrom(
        this.http.get<CrossrefResponse>(url, {
          headers: this.getHeaders(),
        }),
      );

      if (response.data.status !== "ok") {
        return null;
      }

      return this.normalizeWork(response.data.message as CrossrefWork);
    } catch (error) {
      this.logger.error(`Crossref getById failed for ${externalId}: ${error}`);
      return null;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Crossref "polite pool" para mejor rate limiting
    if (this.email) {
      headers["User-Agent"] = `CampusMind/1.0 (mailto:${this.email})`;
    }

    return headers;
  }

  private buildSearchParams(query: SearchQuery): string {
    const params = new URLSearchParams();

    // Búsqueda en query.bibliographic (título, abstract, autores)
    params.set("query.bibliographic", query.query);

    // Filtros
    const filters: string[] = [];

    if (query.filters?.isOpenAccess) {
      filters.push("is-oa:true");
    }

    if (query.filters?.yearFrom) {
      filters.push(`from-pub-date:${query.filters.yearFrom}`);
    }

    if (query.filters?.yearTo) {
      filters.push(`until-pub-date:${query.filters.yearTo}`);
    }

    if (query.filters?.year) {
      filters.push(`from-pub-date:${query.filters.year}`);
      filters.push(`until-pub-date:${query.filters.year}`);
    }

    if (query.filters?.type) {
      const crossrefType = this.mapToCrossrefType(query.filters.type);
      if (crossrefType) {
        filters.push(`type:${crossrefType}`);
      }
    }

    if (filters.length > 0) {
      params.set("filter", filters.join(","));
    }

    // Paginación
    const page = query.pagination?.page || 1;
    const perPage = Math.min(query.pagination?.perPage || 25, 100);
    params.set("offset", ((page - 1) * perPage).toString());
    params.set("rows", perPage.toString());

    // Ordenamiento
    if (query.sort === "date") {
      params.set("sort", "published");
      params.set("order", "desc");
    } else if (query.sort === "citations") {
      params.set("sort", "is-referenced-by-count");
      params.set("order", "desc");
    } else {
      params.set("sort", "relevance");
    }

    // Seleccionar campos para respuesta más liviana
    params.set(
      "select",
      "DOI,title,author,abstract,published,published-online,published-print,type,subject,is-referenced-by-count,references-count,URL,link,license,container-title,publisher",
    );

    return params.toString();
  }

  private normalizeWork(work: CrossrefWork): AcademicResource {
    const pubDate = this.extractPublicationDate(work);

    return {
      externalId: work.DOI || "",
      source: this.name,
      title: work.title?.[0] || "Sin título",
      authors: this.extractAuthors(work),
      abstract: work.abstract?.replace(/<[^>]*>/g, ""), // Strip HTML tags
      publicationDate: pubDate?.full,
      publicationYear: pubDate?.year,
      type: this.mapWorkType(work.type),
      topics: (work.subject || []).slice(0, 5),
      keywords: [],
      url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
      pdfUrl: this.extractPdfUrl(work),
      isOpenAccess: this.checkOpenAccess(work),
      license: work.license?.[0]?.URL,
      citationCount: work["is-referenced-by-count"],
      referenceCount: work["references-count"],
      doi: work.DOI ? `https://doi.org/${work.DOI}` : undefined,
      journal: work["container-title"]?.[0],
      publisher: work.publisher,
    };
  }

  private extractAuthors(work: CrossrefWork): string[] {
    if (!work.author) return [];

    return work.author
      .map((a) => {
        if (a.name) return a.name;
        if (a.given && a.family) return `${a.given} ${a.family}`;
        if (a.family) return a.family;
        return null;
      })
      .filter((name): name is string => name !== null)
      .slice(0, 10);
  }

  private extractPublicationDate(
    work: CrossrefWork,
  ): { full?: string; year?: number } | undefined {
    const dateParts =
      work.published?.["date-parts"]?.[0] ||
      work["published-online"]?.["date-parts"]?.[0] ||
      work["published-print"]?.["date-parts"]?.[0];

    if (!dateParts || dateParts.length === 0) return undefined;

    const [year, month, day] = dateParts;

    let full: string | undefined;
    if (year && month && day) {
      full = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    } else if (year && month) {
      full = `${year}-${String(month).padStart(2, "0")}`;
    } else if (year) {
      full = `${year}`;
    }

    return { full, year };
  }

  private extractPdfUrl(work: CrossrefWork): string | undefined {
    if (!work.link) return undefined;

    const pdfLink = work.link.find(
      (l) =>
        l["content-type"] === "application/pdf" ||
        l["intended-application"] === "text-mining" ||
        l.URL?.endsWith(".pdf"),
    );

    return pdfLink?.URL;
  }

  private checkOpenAccess(work: CrossrefWork): boolean {
    // Check if any license is open access
    if (
      work.license?.some(
        (l) =>
          l.URL?.includes("creativecommons.org") ||
          l["content-version"] === "vor",
      )
    ) {
      return true;
    }

    // Check if there's a free PDF link
    if (
      work.link?.some(
        (l) =>
          l["intended-application"] === "text-mining" ||
          l["content-type"] === "application/pdf",
      )
    ) {
      return true;
    }

    return false;
  }

  private mapWorkType(type?: string): AcademicResourceType {
    if (!type) return "paper";

    const typeMap: Record<string, AcademicResourceType> = {
      "journal-article": "article",
      "book-chapter": "book_chapter",
      book: "book",
      monograph: "book",
      "edited-book": "book",
      "proceedings-article": "conference",
      proceedings: "conference",
      dissertation: "thesis",
      "posted-content": "preprint",
      dataset: "dataset",
      report: "report",
      standard: "standard",
      "reference-entry": "reference",
    };

    return typeMap[type] || "paper";
  }

  private mapToCrossrefType(type: AcademicResourceType): string | null {
    const reverseMap: Partial<Record<AcademicResourceType, string>> = {
      article: "journal-article",
      book: "book",
      book_chapter: "book-chapter",
      conference: "proceedings-article",
      thesis: "dissertation",
      preprint: "posted-content",
      dataset: "dataset",
      paper: "journal-article",
      report: "report",
      standard: "standard",
      reference: "reference-entry",
      // course and other don't have direct Crossref equivalents
    };

    return reverseMap[type] || null;
  }

  private emptyResult(query: SearchQuery): SearchResult {
    return {
      items: [],
      total: 0,
      page: query.pagination?.page || 1,
      perPage: query.pagination?.perPage || 25,
      source: this.name,
    };
  }
}

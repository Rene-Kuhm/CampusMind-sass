import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import {
  AcademicResource,
  SearchQuery,
  SearchResult,
} from "../interfaces/academic-resource.interface";

/**
 * Library Genesis (LibGen) mirror provider for academic books
 * Note: This searches public mirrors that index freely available academic content
 */
@Injectable()
export class LibGenProvider {
  private readonly logger = new Logger(LibGenProvider.name);
  // Use a stable mirror - these can change
  private readonly mirrors = [
    "https://libgen.is",
    "https://libgen.rs",
    "https://libgen.st",
  ];
  private currentMirror = 0;

  constructor(private readonly http: HttpService) {}

  private get baseUrl(): string {
    return this.mirrors[this.currentMirror];
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, pagination } = query;
    const page = pagination?.page || 1;
    const perPage = pagination?.perPage || 25;

    try {
      // LibGen search API
      const params = new URLSearchParams({
        req: searchTerm,
        lg_topic: "libgen", // General library
        open: "0",
        view: "simple",
        res: String(perPage),
        phrase: "1",
        column: "def", // Search in all columns
      });

      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/search.php?${params}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 10000,
        }),
      );

      const items = this.parseSearchResults(response.data, perPage);

      return {
        items,
        total: items.length, // LibGen doesn't provide total count easily
        page,
        perPage,
        source: "libgen",
      };
    } catch (error) {
      this.logger.error(`LibGen search error: ${error}`);
      // Try next mirror on failure
      this.currentMirror = (this.currentMirror + 1) % this.mirrors.length;
      return {
        items: [],
        total: 0,
        page,
        perPage,
        source: "libgen",
      };
    }
  }

  private parseSearchResults(html: string, limit: number): AcademicResource[] {
    const items: AcademicResource[] = [];

    try {
      // Parse the HTML table results
      // LibGen returns results in a table format
      const tableMatch = html.match(
        /<table[^>]*class="c"[^>]*>([\s\S]*?)<\/table>/,
      );
      if (!tableMatch) return items;

      const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];

      for (const row of rows.slice(1, limit + 1)) {
        // Skip header row
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
        if (cells.length < 10) continue;

        // Extract data from cells
        const id = this.extractText(cells[0] || "");
        const authors = this.extractText(cells[1] || "");
        const titleCell = cells[2] || "";
        const title = this.extractLinkText(titleCell);
        const publisher = this.extractText(cells[3] || "");
        const year = this.extractText(cells[4] || "");
        const pages = this.extractText(cells[5] || "");
        const language = this.extractText(cells[6] || "");
        const size = this.extractText(cells[7] || "");
        const extension = this.extractText(cells[8] || "");

        // Extract MD5 hash from link for download
        const md5Match = titleCell.match(/md5=([a-fA-F0-9]+)/);
        const md5 = md5Match ? md5Match[1] : null;

        if (title && md5) {
          items.push({
            externalId: md5,
            source: "libgen" as const,
            title,
            authors: authors
              ? authors.split(",").map((a) => a.trim())
              : ["Desconocido"],
            abstract: `${publisher ? `Editorial: ${publisher}. ` : ""}${pages ? `${pages} páginas. ` : ""}Formato: ${extension}. Tamaño: ${size}`,
            publicationDate: year || null,
            citationCount: null,
            url: `${this.baseUrl}/book/index.php?md5=${md5}`,
            pdfUrl: null, // Don't provide direct download links
            doi: null,
            type: "book",
            isOpenAccess: true,
            language,
            extension,
            fileSize: size,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error parsing LibGen HTML: ${error}`);
    }

    return items;
  }

  private extractText(cell: string): string {
    return cell
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }

  private extractLinkText(cell: string): string {
    const match = cell.match(/<a[^>]*>([^<]+)<\/a>/);
    return match ? match[1].trim() : this.extractText(cell);
  }
}

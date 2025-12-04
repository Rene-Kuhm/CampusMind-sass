import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  AcademicResource,
  SearchQuery,
  SearchResult,
} from '../interfaces/academic-resource.interface';

/**
 * Google Books API provider for books and manuals
 */
@Injectable()
export class GoogleBooksProvider {
  private readonly logger = new Logger(GoogleBooksProvider.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://www.googleapis.com/books/v1';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.apiKey = this.config.get<string>('GOOGLE_BOOKS_API_KEY');
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, filters, pagination } = query;
    const page = pagination?.page || 1;
    const perPage = pagination?.perPage || 25;
    const startIndex = (page - 1) * perPage;

    try {
      const params = new URLSearchParams({
        q: searchTerm,
        startIndex: String(startIndex),
        maxResults: String(Math.min(perPage, 40)), // Google Books max is 40
        printType: 'books',
        langRestrict: 'es', // Spanish language preference
        orderBy: 'relevance',
      });

      // Add API key if available (increases quota)
      if (this.apiKey) {
        params.append('key', this.apiKey);
      }

      // Filter for free books if openAccessOnly
      if (filters?.isOpenAccess) {
        params.append('filter', 'free-ebooks');
      }

      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/volumes?${params}`),
      );

      const items: AcademicResource[] = (response.data.items || []).map(
        (item: any) => this.mapToAcademicResource(item),
      );

      return {
        items,
        total: response.data.totalItems || 0,
        page,
        perPage,
        source: 'google_books',
      };
    } catch (error) {
      this.logger.error(`Google Books search error: ${error}`);
      return {
        items: [],
        total: 0,
        page,
        perPage,
        source: 'google_books',
      };
    }
  }

  private mapToAcademicResource(item: any): AcademicResource {
    const volumeInfo = item.volumeInfo || {};
    const accessInfo = item.accessInfo || {};

    // Get the best available link
    let url = volumeInfo.infoLink || volumeInfo.previewLink;
    let pdfUrl = null;

    if (accessInfo.pdf?.isAvailable && accessInfo.pdf?.acsTokenLink) {
      pdfUrl = accessInfo.pdf.acsTokenLink;
    } else if (accessInfo.epub?.isAvailable && accessInfo.epub?.acsTokenLink) {
      pdfUrl = accessInfo.epub.acsTokenLink;
    }

    // Check if it's free/open access
    const isOpenAccess = accessInfo.accessViewStatus === 'FULL_PUBLIC_DOMAIN' ||
      accessInfo.viewability === 'ALL_PAGES' ||
      item.saleInfo?.saleability === 'FREE';

    return {
      externalId: item.id,
      source: 'google_books' as const,
      title: volumeInfo.title || 'Sin título',
      authors: volumeInfo.authors || ['Autor desconocido'],
      abstract: volumeInfo.description || null,
      publicationDate: volumeInfo.publishedDate || null,
      citationCount: null,
      url,
      pdfUrl,
      doi: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || null,
      type: 'book',
      isOpenAccess,
      thumbnailUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
      publisher: volumeInfo.publisher,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories,
    };
  }

  /**
   * Get a specific book by ID
   */
  async getById(bookId: string): Promise<AcademicResource | null> {
    try {
      const params = this.apiKey ? `?key=${this.apiKey}` : '';
      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/volumes/${bookId}${params}`),
      );

      return this.mapToAcademicResource(response.data);
    } catch (error) {
      this.logger.error(`Google Books getById error: ${error}`);
      return null;
    }
  }
}

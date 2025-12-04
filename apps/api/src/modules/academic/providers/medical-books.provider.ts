import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  AcademicResource,
  SearchQuery,
  SearchResult,
} from '../interfaces/academic-resource.interface';

/**
 * Medical Books Provider
 * Searches multiple medical/scientific book sources:
 * - PubMed Central (free full-text medical articles and books)
 * - NCBI Bookshelf (medical textbooks)
 * - OpenStax (free textbooks including anatomy, biology, etc.)
 * - BooksMediacos.org (Spanish medical books - diccionarios, atlas, manuales)
 */
@Injectable()
export class MedicalBooksProvider {
  private readonly logger = new Logger(MedicalBooksProvider.name);

  constructor(private readonly http: HttpService) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, pagination } = query;
    const page = pagination?.page || 1;
    const perPage = pagination?.perPage || 25;

    // Search multiple sources in parallel
    const [pubmedResults, ncbiBooks, openStaxResults, booksMedicosResults] = await Promise.all([
      this.searchPubMedCentral(searchTerm, page, perPage),
      this.searchNCBIBookshelf(searchTerm, page, perPage),
      this.searchOpenStax(searchTerm),
      this.searchBooksMedicos(searchTerm, perPage),
    ]);

    // Combine and deduplicate results
    const allItems = [...booksMedicosResults, ...pubmedResults, ...ncbiBooks, ...openStaxResults];
    const seen = new Set<string>();
    const uniqueItems: AcademicResource[] = [];

    for (const item of allItems) {
      const key = item.doi || item.url || item.externalId;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    }

    return {
      items: uniqueItems.slice(0, perPage),
      total: uniqueItems.length,
      page,
      perPage,
      source: 'medical_books',
    };
  }

  /**
   * Search PubMed Central for free full-text articles and books
   */
  private async searchPubMedCentral(
    searchTerm: string,
    page: number,
    perPage: number,
  ): Promise<AcademicResource[]> {
    try {
      // First, search for IDs
      const searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
      const searchParams = new URLSearchParams({
        db: 'pmc',
        term: `${searchTerm} AND free fulltext[filter]`,
        retmax: String(perPage),
        retstart: String((page - 1) * perPage),
        retmode: 'json',
        sort: 'relevance',
      });

      const searchResponse = await firstValueFrom(
        this.http.get(`${searchUrl}?${searchParams}`, { timeout: 10000 }),
      );

      const ids = searchResponse.data?.esearchresult?.idlist || [];
      if (ids.length === 0) return [];

      // Fetch details for each ID
      const summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
      const summaryParams = new URLSearchParams({
        db: 'pmc',
        id: ids.join(','),
        retmode: 'json',
      });

      const summaryResponse = await firstValueFrom(
        this.http.get(`${summaryUrl}?${summaryParams}`, { timeout: 10000 }),
      );

      const results = summaryResponse.data?.result || {};
      const items: AcademicResource[] = [];

      for (const id of ids) {
        const article = results[id];
        if (!article) continue;

        items.push({
          externalId: `pmc-${id}`,
          source: 'medical_books',
          title: article.title || 'Sin título',
          authors: this.parseAuthors(article.authors || []),
          abstract: article.source || null,
          publicationDate: article.pubdate || null,
          publicationYear: article.pubdate ? parseInt(article.pubdate.substring(0, 4)) : undefined,
          citationCount: null,
          url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/`,
          pdfUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/pdf/`,
          doi: article.doi || null,
          isOpenAccess: true,
          type: 'article',
          language: 'en',
          journal: article.fulljournalname || article.source || null,
        });
      }

      return items;
    } catch (error) {
      this.logger.error(`PubMed Central search error: ${error}`);
      return [];
    }
  }

  /**
   * Search NCBI Bookshelf for medical textbooks
   */
  private async searchNCBIBookshelf(
    searchTerm: string,
    page: number,
    perPage: number,
  ): Promise<AcademicResource[]> {
    try {
      const searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
      const searchParams = new URLSearchParams({
        db: 'books',
        term: searchTerm,
        retmax: String(Math.min(perPage, 10)), // Limit books to 10
        retstart: String((page - 1) * perPage),
        retmode: 'json',
      });

      const searchResponse = await firstValueFrom(
        this.http.get(`${searchUrl}?${searchParams}`, { timeout: 10000 }),
      );

      const ids = searchResponse.data?.esearchresult?.idlist || [];
      if (ids.length === 0) return [];

      const summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
      const summaryParams = new URLSearchParams({
        db: 'books',
        id: ids.join(','),
        retmode: 'json',
      });

      const summaryResponse = await firstValueFrom(
        this.http.get(`${summaryUrl}?${summaryParams}`, { timeout: 10000 }),
      );

      const results = summaryResponse.data?.result || {};
      const items: AcademicResource[] = [];

      for (const id of ids) {
        const book = results[id];
        if (!book) continue;

        items.push({
          externalId: `ncbi-book-${id}`,
          source: 'medical_books',
          title: book.title || 'Sin título',
          authors: this.parseAuthors(book.authors || []),
          abstract: book.description || book.subtitle || null,
          publicationDate: book.pubdate || null,
          publicationYear: book.pubdate ? parseInt(book.pubdate.substring(0, 4)) : undefined,
          citationCount: null,
          url: `https://www.ncbi.nlm.nih.gov/books/${book.bookaccession || id}/`,
          pdfUrl: null,
          doi: null,
          isOpenAccess: true,
          type: 'book',
          language: 'en',
          publisher: book.publisher || 'NCBI Bookshelf',
        });
      }

      return items;
    } catch (error) {
      this.logger.error(`NCBI Bookshelf search error: ${error}`);
      return [];
    }
  }

  /**
   * Search OpenStax for free textbooks (anatomy, biology, chemistry, physics)
   * Great for pre-med students
   */
  private async searchOpenStax(searchTerm: string): Promise<AcademicResource[]> {
    try {
      // OpenStax has a limited set of books, we'll match against medical-related ones
      const medicalBooks = [
        {
          id: 'anatomy-and-physiology',
          title: 'Anatomy and Physiology',
          authors: ['OpenStax'],
          subjects: ['anatomy', 'physiology', 'body', 'human', 'organ', 'tissue', 'cell'],
          url: 'https://openstax.org/details/books/anatomy-and-physiology-2e',
          pdfUrl: 'https://assets.openstax.org/oscms-prodcms/media/documents/AnatomyandPhysiology2e-WEB.pdf',
        },
        {
          id: 'biology',
          title: 'Biology 2e',
          authors: ['OpenStax'],
          subjects: ['biology', 'cell', 'genetics', 'evolution', 'organism', 'life'],
          url: 'https://openstax.org/details/books/biology-2e',
          pdfUrl: 'https://assets.openstax.org/oscms-prodcms/media/documents/Biology2e-WEB.pdf',
        },
        {
          id: 'microbiology',
          title: 'Microbiology',
          authors: ['OpenStax'],
          subjects: ['microbiology', 'bacteria', 'virus', 'pathogen', 'infection', 'immune'],
          url: 'https://openstax.org/details/books/microbiology',
          pdfUrl: 'https://assets.openstax.org/oscms-prodcms/media/documents/Microbiology-WEB.pdf',
        },
        {
          id: 'chemistry',
          title: 'Chemistry 2e',
          authors: ['OpenStax'],
          subjects: ['chemistry', 'organic', 'biochemistry', 'molecular', 'compound'],
          url: 'https://openstax.org/details/books/chemistry-2e',
          pdfUrl: 'https://assets.openstax.org/oscms-prodcms/media/documents/Chemistry2e-WEB.pdf',
        },
        {
          id: 'psychology',
          title: 'Psychology 2e',
          authors: ['OpenStax'],
          subjects: ['psychology', 'mental', 'brain', 'behavior', 'cognitive', 'psychiatric'],
          url: 'https://openstax.org/details/books/psychology-2e',
          pdfUrl: 'https://assets.openstax.org/oscms-prodcms/media/documents/Psychology2e-WEB.pdf',
        },
        {
          id: 'concepts-biology',
          title: 'Concepts of Biology',
          authors: ['OpenStax'],
          subjects: ['biology', 'cell', 'genetics', 'ecosystem', 'organism'],
          url: 'https://openstax.org/details/books/concepts-biology',
          pdfUrl: 'https://assets.openstax.org/oscms-prodcms/media/documents/ConceptsofBiology-WEB.pdf',
        },
      ];

      const searchLower = searchTerm.toLowerCase();
      const matchedBooks = medicalBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          book.subjects.some((s) => searchLower.includes(s) || s.includes(searchLower)),
      );

      return matchedBooks.map((book) => ({
        externalId: `openstax-${book.id}`,
        source: 'medical_books',
        title: book.title,
        authors: book.authors,
        abstract: `Libro de texto gratuito de OpenStax. Ideal para estudiantes de ciencias de la salud y medicina.`,
        publicationDate: null,
        citationCount: null,
        url: book.url,
        pdfUrl: book.pdfUrl,
        doi: null,
        isOpenAccess: true,
        type: 'book',
        language: 'en',
        publisher: 'OpenStax',
        license: 'CC BY 4.0',
      }));
    } catch (error) {
      this.logger.error(`OpenStax search error: ${error}`);
      return [];
    }
  }

  /**
   * Search BooksMediacos.org for Spanish medical books
   * Includes: diccionarios, atlas, manuales, tratados médicos
   */
  private async searchBooksMedicos(
    searchTerm: string,
    limit: number,
  ): Promise<AcademicResource[]> {
    try {
      const searchUrl = `https://booksmedicos.org/?s=${encodeURIComponent(searchTerm)}`;

      const response = await firstValueFrom(
        this.http.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          },
          timeout: 15000,
        }),
      );

      const html = response.data as string;
      const items: AcademicResource[] = [];

      // Parse search results from HTML
      // Pattern: <h2 class="entry-title"><a href="URL">TITLE</a></h2>
      const articlePattern = /<article[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      const articles = html.match(articlePattern) || [];

      for (const article of articles.slice(0, Math.min(limit, 15))) {
        try {
          // Extract title and URL
          const titleMatch = article.match(/<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
          if (!titleMatch) continue;

          const url = titleMatch[1];
          const title = this.decodeHtmlEntities(titleMatch[2].trim());

          // Extract thumbnail image
          const imgMatch = article.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
          const thumbnailUrl = imgMatch ? imgMatch[1] : null;

          // Extract categories (e.g., "Diccionarios", "Atlas", "Anatomía")
          const categoryMatches = article.match(/<a[^>]*rel="category[^"]*"[^>]*>([^<]+)<\/a>/gi) || [];
          const categories = categoryMatches
            .map(cat => {
              const match = cat.match(/>([^<]+)</);
              return match ? match[1].trim() : '';
            })
            .filter(c => c.length > 0);

          // Extract date
          const dateMatch = article.match(/<time[^>]*datetime="([^"]+)"[^>]*>/i);
          const publicationDate = dateMatch ? dateMatch[1].split('T')[0] : null;

          // Generate unique ID from URL
          const urlParts = url.split('/').filter(p => p.length > 0);
          const externalId = `booksmedicos-${urlParts[urlParts.length - 1] || Date.now()}`;

          items.push({
            externalId,
            source: 'medical_books',
            title,
            authors: ['BooksMediacos.org'],
            abstract: categories.length > 0
              ? `Categorías: ${categories.join(', ')}. Libro médico en español disponible en BooksMediacos.org.`
              : 'Libro médico en español disponible en BooksMediacos.org.',
            publicationDate,
            publicationYear: publicationDate ? parseInt(publicationDate.substring(0, 4)) : undefined,
            citationCount: undefined,
            url,
            pdfUrl: undefined,
            doi: undefined,
            isOpenAccess: true,
            type: 'book',
            language: 'es',
            publisher: 'BooksMediacos.org',
            thumbnailUrl,
            categories,
          });
        } catch (parseError) {
          // Skip malformed articles
          continue;
        }
      }

      this.logger.log(`BooksMediacos found ${items.length} results for: ${searchTerm}`);
      return items;
    } catch (error) {
      this.logger.error(`BooksMediacos search error: ${error}`);
      return [];
    }
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&aacute;/gi, 'á')
      .replace(/&eacute;/gi, 'é')
      .replace(/&iacute;/gi, 'í')
      .replace(/&oacute;/gi, 'ó')
      .replace(/&uacute;/gi, 'ú')
      .replace(/&ntilde;/gi, 'ñ')
      .replace(/&Ntilde;/gi, 'Ñ');
  }

  /**
   * Get resource by ID
   */
  async getById(externalId: string): Promise<AcademicResource | null> {
    try {
      if (externalId.startsWith('pmc-')) {
        const pmcId = externalId.replace('pmc-', '');
        const summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
        const params = new URLSearchParams({
          db: 'pmc',
          id: pmcId,
          retmode: 'json',
        });

        const response = await firstValueFrom(
          this.http.get(`${summaryUrl}?${params}`, { timeout: 10000 }),
        );

        const article = response.data?.result?.[pmcId];
        if (!article) return null;

        return {
          externalId,
          source: 'medical_books',
          title: article.title || 'Sin título',
          authors: this.parseAuthors(article.authors || []),
          abstract: article.source || null,
          publicationDate: article.pubdate || null,
          citationCount: null,
          url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/`,
          pdfUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/`,
          doi: article.doi || null,
          isOpenAccess: true,
          type: 'article',
          language: 'en',
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting medical book by ID: ${error}`);
      return null;
    }
  }

  private parseAuthors(authors: Array<{ name?: string } | string>): string[] {
    if (!Array.isArray(authors)) return ['Desconocido'];

    return authors
      .map((a) => (typeof a === 'string' ? a : a?.name || ''))
      .filter((name) => name.length > 0)
      .slice(0, 5);
  }
}

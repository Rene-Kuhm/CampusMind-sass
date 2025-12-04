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
 * Web search provider using DuckDuckGo for general educational resources
 * Searches for PDFs, educational sites, tutorials, etc.
 */
@Injectable()
export class WebSearchProvider {
  private readonly logger = new Logger(WebSearchProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, pagination } = query;
    const page = pagination?.page || 1;
    const perPage = pagination?.perPage || 25;

    try {
      // Use DuckDuckGo HTML search (no API key needed)
      const educationalQuery = this.buildEducationalQuery(searchTerm);
      const items = await this.searchDuckDuckGo(educationalQuery, perPage);

      return {
        items,
        total: items.length,
        page,
        perPage,
        source: 'web',
      };
    } catch (error) {
      this.logger.error(`Web search error: ${error}`);
      return {
        items: [],
        total: 0,
        page,
        perPage,
        source: 'web',
      };
    }
  }

  private buildEducationalQuery(searchTerm: string): string {
    // Add educational filters to the query
    const educationalSites = [
      'site:edu',
      'site:coursera.org',
      'site:edx.org',
      'site:khanacademy.org',
      'site:ocw.mit.edu',
      'site:academia.edu',
      'site:researchgate.net',
    ];

    // Search for educational content or PDFs
    return `${searchTerm} (tutorial OR curso OR manual OR apuntes OR PDF OR "material educativo") (${educationalSites.join(' OR ')})`;
  }

  private async searchDuckDuckGo(query: string, limit: number): Promise<AcademicResource[]> {
    const items: AcademicResource[] = [];

    try {
      // DuckDuckGo HTML search
      const params = new URLSearchParams({
        q: query,
        kl: 'es-es', // Spanish results
      });

      const response = await firstValueFrom(
        this.http.get(`https://html.duckduckgo.com/html/?${params}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
          },
          timeout: 10000,
        }),
      );

      const html = response.data;
      const results = this.parseDuckDuckGoResults(html, limit);
      items.push(...results);
    } catch (error) {
      this.logger.error(`DuckDuckGo search error: ${error}`);
    }

    return items;
  }

  private parseDuckDuckGoResults(html: string, limit: number): AcademicResource[] {
    const items: AcademicResource[] = [];

    try {
      // Parse DuckDuckGo HTML results
      const resultMatches = html.match(/<div class="result[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g) || [];

      for (const result of resultMatches.slice(0, limit)) {
        // Extract URL
        const urlMatch = result.match(/href="([^"]+)"/);
        if (!urlMatch) continue;

        let url = urlMatch[1];
        // DuckDuckGo uses redirect URLs, extract actual URL
        const actualUrlMatch = url.match(/uddg=([^&]+)/);
        if (actualUrlMatch) {
          url = decodeURIComponent(actualUrlMatch[1]);
        }

        // Extract title
        const titleMatch = result.match(/<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/);
        const title = titleMatch ? this.cleanHtml(titleMatch[1]) : 'Sin título';

        // Extract description
        const descMatch = result.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
        const description = descMatch ? this.cleanHtml(descMatch[1]) : null;

        // Determine type based on URL/content
        const type = this.determineResourceType(url, title, description || '');

        // Skip non-educational results
        if (this.isEducationalResource(url, title)) {
          items.push({
            externalId: this.generateId(url),
            source: 'web' as const,
            title,
            authors: [this.extractDomain(url)],
            abstract: description,
            publicationDate: null,
            citationCount: null,
            url,
            pdfUrl: url.endsWith('.pdf') ? url : null,
            doi: null,
            type,
            isOpenAccess: true,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error parsing DuckDuckGo results: ${error}`);
    }

    return items;
  }

  private cleanHtml(text: string): string {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  private determineResourceType(url: string, title: string, description: string): string {
    const content = `${url} ${title} ${description}`.toLowerCase();

    if (url.endsWith('.pdf')) return 'manual';
    if (content.includes('video') || content.includes('youtube')) return 'video';
    if (content.includes('course') || content.includes('curso')) return 'course';
    if (content.includes('book') || content.includes('libro')) return 'book';
    if (content.includes('tutorial')) return 'notes';
    if (content.includes('paper') || content.includes('research')) return 'paper';

    return 'article';
  }

  private isEducationalResource(url: string, title: string): boolean {
    const educationalDomains = [
      '.edu',
      'coursera.org',
      'edx.org',
      'khanacademy.org',
      'mit.edu',
      'academia.edu',
      'researchgate.net',
      'springer.com',
      'sciencedirect.com',
      'wiley.com',
      'scholar.google',
    ];

    const lowercaseUrl = url.toLowerCase();
    return educationalDomains.some(domain => lowercaseUrl.includes(domain)) ||
      url.endsWith('.pdf') ||
      title.toLowerCase().includes('tutorial') ||
      title.toLowerCase().includes('curso') ||
      title.toLowerCase().includes('manual');
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'web';
    }
  }

  private generateId(url: string): string {
    // Simple hash of URL for ID
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `web_${Math.abs(hash).toString(16)}`;
  }
}

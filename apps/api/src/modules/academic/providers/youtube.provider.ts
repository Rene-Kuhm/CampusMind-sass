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
 * YouTube Data API provider for educational videos
 * Falls back to scraping if no API key is configured
 */
@Injectable()
export class YouTubeProvider {
  private readonly logger = new Logger(YouTubeProvider.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.apiKey = this.config.get<string>('YOUTUBE_API_KEY');
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, pagination } = query;
    const page = pagination?.page || 1;
    const perPage = pagination?.perPage || 25;

    // Add educational keywords to improve results
    const educationalQuery = `${searchTerm} tutorial educativo curso clase explicación`;

    try {
      if (this.apiKey) {
        return this.searchWithApi(educationalQuery, page, perPage);
      } else {
        return this.searchWithScraping(educationalQuery, page, perPage);
      }
    } catch (error) {
      this.logger.error(`YouTube search error: ${error}`);
      return {
        items: [],
        total: 0,
        page,
        perPage,
        source: 'youtube',
      };
    }
  }

  private async searchWithApi(
    query: string,
    page: number,
    perPage: number,
  ): Promise<SearchResult> {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoDuration: 'medium', // Filter for medium-length videos (4-20 min)
      videoDefinition: 'high',
      relevanceLanguage: 'es',
      maxResults: String(perPage),
      key: this.apiKey!,
      // Educational categories
      videoCategoryId: '27', // Education category
    });

    const response = await firstValueFrom(
      this.http.get(`${this.baseUrl}/search?${params}`),
    );

    const items: AcademicResource[] = response.data.items.map((item: any) => ({
      externalId: item.id.videoId,
      source: 'youtube' as const,
      title: item.snippet.title,
      authors: [item.snippet.channelTitle],
      abstract: item.snippet.description,
      publicationDate: item.snippet.publishedAt?.split('T')[0] || null,
      citationCount: null,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      pdfUrl: null,
      doi: null,
      type: 'video',
      isOpenAccess: true,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
    }));

    return {
      items,
      total: response.data.pageInfo?.totalResults || items.length,
      page,
      perPage,
      source: 'youtube',
    };
  }

  private async searchWithScraping(
    query: string,
    page: number,
    perPage: number,
  ): Promise<SearchResult> {
    // Use YouTube's search page without API
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;

    try {
      const response = await firstValueFrom(
        this.http.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          },
        }),
      );

      const html = response.data;
      const items = this.parseYouTubeHtml(html, perPage);

      return {
        items,
        total: items.length,
        page,
        perPage,
        source: 'youtube',
      };
    } catch (error) {
      this.logger.error(`YouTube scraping error: ${error}`);
      return {
        items: [],
        total: 0,
        page,
        perPage,
        source: 'youtube',
      };
    }
  }

  private parseYouTubeHtml(html: string, limit: number): AcademicResource[] {
    const items: AcademicResource[] = [];

    // Extract ytInitialData JSON from HTML
    const dataMatch = html.match(/var ytInitialData = ({.+?});<\/script>/);
    if (!dataMatch) return items;

    try {
      const data = JSON.parse(dataMatch[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

      for (const content of contents.slice(0, limit)) {
        const video = content.videoRenderer;
        if (!video) continue;

        items.push({
          externalId: video.videoId,
          source: 'youtube' as const,
          title: video.title?.runs?.[0]?.text || 'Sin título',
          authors: [video.ownerText?.runs?.[0]?.text || 'Desconocido'],
          abstract: video.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || null,
          publicationDate: video.publishedTimeText?.simpleText || null,
          citationCount: null,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          pdfUrl: null,
          doi: null,
          type: 'video',
          isOpenAccess: true,
          thumbnailUrl: video.thumbnail?.thumbnails?.[0]?.url,
        });
      }
    } catch (error) {
      this.logger.error(`Error parsing YouTube HTML: ${error}`);
    }

    return items;
  }
}

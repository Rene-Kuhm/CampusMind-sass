import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  AcademicResource,
  SearchQuery,
  SearchResult,
} from '../interfaces/academic-resource.interface';

/**
 * Archive.org (Internet Archive) provider for free books, manuals, and educational content
 */
@Injectable()
export class ArchiveOrgProvider {
  private readonly logger = new Logger(ArchiveOrgProvider.name);
  private readonly baseUrl = 'https://archive.org';

  constructor(private readonly http: HttpService) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, filters, pagination } = query;
    const page = pagination?.page || 1;
    const perPage = pagination?.perPage || 25;

    try {
      // Build search query for educational content
      // mediatype:texts includes books, manuals, documents
      // mediatype:movies includes educational videos
      const mediaTypes = ['texts', 'education'];
      const mediaTypeQuery = mediaTypes.map(t => `mediatype:${t}`).join(' OR ');

      const params = new URLSearchParams({
        q: `(${searchTerm}) AND (${mediaTypeQuery})`,
        output: 'json',
        rows: String(perPage),
        page: String(page),
        'fl[]': 'identifier,title,creator,description,date,mediatype,downloads,subject,language',
      });

      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/advancedsearch.php?${params}`),
      );

      const docs = response.data.response?.docs || [];
      const items: AcademicResource[] = docs.map((doc: any) =>
        this.mapToAcademicResource(doc),
      );

      return {
        items,
        total: response.data.response?.numFound || 0,
        page,
        perPage,
        source: 'archive_org',
      };
    } catch (error) {
      this.logger.error(`Archive.org search error: ${error}`);
      return {
        items: [],
        total: 0,
        page,
        perPage,
        source: 'archive_org',
      };
    }
  }

  private mapToAcademicResource(doc: any): AcademicResource {
    const identifier = doc.identifier;
    const isBook = doc.mediatype === 'texts';

    // Determine the type based on mediatype
    let type: string = 'other';
    if (doc.mediatype === 'texts') {
      type = 'book';
    } else if (doc.mediatype === 'movies' || doc.mediatype === 'education') {
      type = 'video';
    } else if (doc.mediatype === 'audio') {
      type = 'course';
    }

    // Build URLs
    const url = `${this.baseUrl}/details/${identifier}`;
    const pdfUrl = isBook ? `${this.baseUrl}/download/${identifier}/${identifier}.pdf` : null;
    const thumbnailUrl = `${this.baseUrl}/services/img/${identifier}`;

    // Parse authors
    let authors: string[] = [];
    if (doc.creator) {
      authors = Array.isArray(doc.creator) ? doc.creator : [doc.creator];
    }

    // Parse subjects/tags
    let subjects: string[] = [];
    if (doc.subject) {
      subjects = Array.isArray(doc.subject) ? doc.subject : [doc.subject];
    }

    return {
      externalId: identifier,
      source: 'archive_org' as const,
      title: doc.title || 'Sin título',
      authors: authors.length > 0 ? authors : ['Autor desconocido'],
      abstract: doc.description || null,
      publicationDate: doc.date || null,
      citationCount: doc.downloads || null, // Use downloads as a popularity metric
      url,
      pdfUrl,
      doi: null,
      type,
      isOpenAccess: true, // Archive.org content is free
      thumbnailUrl,
      subjects,
      language: doc.language,
    };
  }

  /**
   * Get metadata for a specific item
   */
  async getById(identifier: string): Promise<AcademicResource | null> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/metadata/${identifier}`),
      );

      const metadata = response.data.metadata;
      if (!metadata) return null;

      return this.mapToAcademicResource({
        identifier,
        ...metadata,
      });
    } catch (error) {
      this.logger.error(`Archive.org getById error: ${error}`);
      return null;
    }
  }

  /**
   * Search specifically for textbooks
   */
  async searchTextbooks(query: SearchQuery): Promise<SearchResult> {
    const modifiedQuery = {
      ...query,
      query: `${query.query} (textbook OR manual OR "course material" OR apuntes)`,
    };
    return this.search(modifiedQuery);
  }
}

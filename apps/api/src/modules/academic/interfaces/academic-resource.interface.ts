// Modelo normalizado para recursos académicos de cualquier fuente
export interface AcademicResource {
  // Identificación
  externalId: string;
  source: AcademicSource | string;

  // Metadata básica
  title: string;
  authors: string[];
  abstract?: string | null;
  publicationDate?: string | null;
  publicationYear?: number;

  // Clasificación
  type: AcademicResourceType | string;
  topics?: string[];
  keywords?: string[];
  subjects?: string[];
  categories?: string[];

  // Acceso
  url?: string | null;
  pdfUrl?: string | null;
  isOpenAccess: boolean;
  license?: string;

  // Métricas (si disponibles)
  citationCount?: number | null;
  referenceCount?: number;

  // Fuente específica
  doi?: string | null;
  journal?: string;
  publisher?: string;
  venue?: string;

  // Multimedia
  thumbnailUrl?: string | null;
  duration?: string; // For videos
  pageCount?: number; // For books

  // File info
  language?: string;
  extension?: string;
  fileSize?: string;
}

export type AcademicSource =
  | 'openalex'
  | 'semantic_scholar'
  | 'crossref'
  | 'youtube'
  | 'google_books'
  | 'archive_org'
  | 'libgen'
  | 'web'
  | 'oer_commons'
  | 'manual';

export type AcademicResourceType =
  | 'paper'
  | 'book'
  | 'book_chapter'
  | 'article'
  | 'thesis'
  | 'conference'
  | 'preprint'
  | 'dataset'
  | 'course'
  | 'video'
  | 'manual'
  | 'notes'
  | 'report'
  | 'standard'
  | 'reference'
  | 'other';

// Interfaz para proveedores de APIs académicas
export interface AcademicProvider {
  readonly name: string;

  search(query: SearchQuery): Promise<SearchResult>;
  getById(externalId: string): Promise<AcademicResource | null>;
}

export interface SearchQuery {
  query: string;
  filters?: {
    type?: AcademicResourceType;
    year?: number;
    yearFrom?: number;
    yearTo?: number;
    isOpenAccess?: boolean;
    language?: string;
    topics?: string[];
  };
  pagination?: {
    page: number;
    perPage: number;
  };
  sort?: 'relevance' | 'date' | 'citations';
}

export interface SearchResult {
  items: AcademicResource[];
  total: number;
  page: number;
  perPage: number;
  source: string;
}

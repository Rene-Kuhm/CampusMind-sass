// Modelo normalizado para recursos académicos de cualquier fuente
export interface AcademicResource {
  // Identificación
  externalId: string;
  source: AcademicSource;

  // Metadata básica
  title: string;
  authors: string[];
  abstract?: string;
  publicationDate?: string;
  publicationYear?: number;

  // Clasificación
  type: AcademicResourceType;
  topics?: string[];
  keywords?: string[];

  // Acceso
  url?: string;
  pdfUrl?: string;
  isOpenAccess: boolean;
  license?: string;

  // Métricas (si disponibles)
  citationCount?: number;
  referenceCount?: number;

  // Fuente específica
  doi?: string;
  journal?: string;
  publisher?: string;
  venue?: string;
}

export type AcademicSource =
  | 'openalex'
  | 'semantic_scholar'
  | 'crossref'
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
  | 'other';

// Interfaz para proveedores de APIs académicas
export interface AcademicProvider {
  readonly name: AcademicSource;

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
  source: AcademicSource;
}

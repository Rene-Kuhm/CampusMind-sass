/**
 * Academic Search & External API Types
 */

import { ResourceType, ResourceLevel } from './resource.types';

export type AcademicSource = 'openalex' | 'semantic_scholar' | 'crossref';

export interface AcademicResource {
  externalId: string;
  source: AcademicSource;
  title: string;
  authors: string[];
  abstract: string | null;
  publicationDate: string | null;
  citationCount: number | null;
  url: string | null;
  pdfUrl: string | null;
  doi: string | null;
  isOpenAccess: boolean;
  type: ResourceType;
  level: ResourceLevel;
}

export interface AcademicSearchParams {
  query: string;
  type?: ResourceType;
  level?: ResourceLevel;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
  limit?: number;
  page?: number;
}

export interface AcademicSearchResult {
  results: AcademicResource[];
  total: number;
  page: number;
  limit: number;
}

export interface ImportResourceInput {
  subjectId: string;
  resource: AcademicResource;
}

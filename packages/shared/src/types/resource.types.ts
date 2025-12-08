/**
 * Resource Types
 */

export type ResourceType =
  | 'BOOK'
  | 'PAPER'
  | 'ARTICLE'
  | 'VIDEO'
  | 'COURSE'
  | 'MANUAL'
  | 'NOTES'
  | 'OTHER';

export type ResourceLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export interface Resource {
  id: string;
  subjectId: string;
  title: string;
  authors: string[];
  description: string | null;
  url: string | null;
  type: ResourceType;
  level: ResourceLevel;
  language: string;
  isOpenAccess: boolean;
  license: string | null;
  externalId: string | null;
  externalSource: string | null;
  isIndexed: boolean;
  indexedAt: Date | null;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// CreateResourceInput and UpdateResourceInput are exported from schemas/resource.schemas.ts

export interface ResourceNote {
  id: string;
  resourceId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// CreateNoteInput is exported from schemas/resource.schemas.ts

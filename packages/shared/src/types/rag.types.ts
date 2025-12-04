/**
 * RAG (Retrieval-Augmented Generation) Types
 */

import { StudyStyle, ContentDepth } from './user.types';

// Query Options
export interface RagQueryOptions {
  subjectId?: string;
  resourceIds?: string[];
  topK?: number;
  minScore?: number;
  style?: StudyStyle;
  depth?: ContentDepth;
}

// Citation from source chunks
export interface Citation {
  resourceId: string;
  resourceTitle: string;
  chunkContent: string;
  page?: number;
  section?: string;
  relevanceScore: number;
}

// RAG Query Response
export interface RagResponse {
  answer: string;
  citations: Citation[];
  tokensUsed: number;
  processingTimeMs: number;
}

// Harvard-style Summary Structure
export interface HarvardSummary {
  theoreticalContext: string;
  keyIdeas: string[];
  definitions: Array<{
    term: string;
    definition: string;
  }>;
  examples: string[];
  commonMistakes: string[];
  reviewChecklist: string[];
  references: string[];
}

// Chunk for vector storage
export interface DocumentChunk {
  id: string;
  resourceId: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface ChunkMetadata {
  resourceId: string;
  resourceTitle: string;
  chunkIndex: number;
  page?: number;
  section?: string;
  timestamp?: number;
}

// Ingest Result
export interface IngestResult {
  resourceId: string;
  chunksCreated: number;
  tokensUsed: number;
}

// RAG Stats
export interface RagStats {
  totalQueries: number;
  totalTokensUsed: number;
  recentQueries: Array<{
    id: string;
    query: string;
    createdAt: Date;
    tokensUsed: number | null;
    subject: { name: string } | null;
  }>;
}

// Summary Generation Options
export interface SummaryOptions {
  type: 'executive' | 'extended' | 'exam_sheet' | 'concept_map';
  depth?: ContentDepth;
  includeExamples?: boolean;
  citationStyle?: 'APA' | 'IEEE' | 'Vancouver' | 'Chicago';
}

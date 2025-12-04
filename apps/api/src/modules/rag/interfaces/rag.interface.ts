// Interfaces para el motor RAG

export interface ChunkMetadata {
  resourceId: string;
  resourceTitle: string;
  chunkIndex: number;
  page?: number;
  section?: string;
  timestamp?: string; // Para videos
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export interface SimilarChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  score: number; // Similarity score
}

export interface RagQueryOptions {
  subjectId?: string;
  resourceIds?: string[];
  topK?: number; // Number of chunks to retrieve
  minScore?: number; // Minimum similarity score
  style?: 'formal' | 'practical' | 'balanced';
  depth?: 'basic' | 'intermediate' | 'advanced';
  skipCache?: boolean; // Force fresh query, skip cache
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  tokensUsed: number;
  processingTimeMs: number;
  fromCache?: boolean; // Indicates if response was served from cache
}

export interface Citation {
  resourceId: string;
  resourceTitle: string;
  chunkContent: string;
  page?: number;
  section?: string;
  relevanceScore: number;
}

// Template para resúmenes estilo Harvard
export interface HarvardSummary {
  theoreticalContext: string;
  keyIdeas: string[];
  definitions: DefinitionItem[];
  examples: ExampleItem[];
  commonMistakes: string[];
  reviewChecklist: string[];
  references: string[];
}

export interface DefinitionItem {
  term: string;
  definition: string;
  formula?: string;
}

export interface ExampleItem {
  description: string;
  solution?: string;
}

// LLM Provider Interface
export interface LlmProvider {
  generateCompletion(prompt: string, options?: LlmOptions): Promise<LlmResponse>;
  generateEmbedding(text: string): Promise<EmbeddingResult>;
}

export interface LlmOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LlmResponse {
  content: string;
  tokensUsed: number;
  finishReason: string;
}

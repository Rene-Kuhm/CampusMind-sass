// Interfaces para el motor RAG (modo híbrido local + general)

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
  style?: "formal" | "practical" | "balanced";
  depth?: "basic" | "intermediate" | "advanced";
  skipCache?: boolean; // Force fresh query, skip cache
  provider?: LlmProviderType; // Specific provider to use
  useFreeProvider?: boolean; // Auto-select a free provider
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  tokensUsed: number;
  processingTimeMs: number;
  fromCache?: boolean; // Indicates if response was served from cache
  source?: "local" | "general"; // 'local' = from indexed resources, 'general' = from LLM knowledge
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

// LLM Provider Types
export type LlmProviderType = "openai" | "gemini" | "deepseek" | "groq";

export interface LlmProviderConfig {
  type: LlmProviderType;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

// Available providers with their models (updated December 2025)
// Models are ordered by preference: latest/best first
export const LLM_PROVIDERS: Record<
  LlmProviderType,
  {
    name: string;
    models: string[];
    defaultModel: string;
    isFree: boolean;
    description: string;
    apiEndpoint?: string; // For model discovery
  }
> = {
  openai: {
    name: "OpenAI",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    isFree: false,
    description: "GPT-4 y GPT-3.5 de OpenAI",
    apiEndpoint: "https://api.openai.com/v1/models",
  },
  gemini: {
    name: "Google Gemini",
    // Latest free models: 2.5-flash is the newest free tier
    models: [
      "gemini-2.5-flash-preview-05-20", // Latest 2.5 Flash preview
      "gemini-2.0-flash", // Stable 2.0 Flash
      "gemini-2.0-flash-lite", // Lightweight 2.0
      "gemini-1.5-flash", // Fallback 1.5
      "gemini-1.5-flash-8b", // Smaller 1.5
    ],
    defaultModel: "gemini-2.5-flash-preview-05-20",
    isFree: true,
    description: "Gemini de Google - Gratis con límites generosos (2.5 Flash)",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models",
  },
  deepseek: {
    name: "DeepSeek",
    models: ["deepseek-chat", "deepseek-coder"],
    defaultModel: "deepseek-chat",
    isFree: true,
    description: "DeepSeek - Muy económico ($0.14/1M tokens)",
  },
  groq: {
    name: "Groq",
    // Latest free models from Groq (December 2025)
    models: [
      "llama-3.3-70b-versatile", // Best quality, 280 tok/s
      "llama-3.1-70b-versatile", // Alternative 70B
      "llama-3.1-8b-instant", // Fast, 560 tok/s
      "mixtral-8x7b-32768", // Mixtral MoE
      "gemma2-9b-it", // Google Gemma
    ],
    defaultModel: "llama-3.3-70b-versatile",
    isFree: true,
    description: "Groq - Inferencia ultrarrápida, modelos open source gratis",
    apiEndpoint: "https://api.groq.com/openai/v1/models",
  },
};

// Model fallback order for auto-selection
export const FREE_MODEL_PRIORITY: Array<{
  provider: LlmProviderType;
  model: string;
}> = [
  { provider: "groq", model: "llama-3.3-70b-versatile" },
  { provider: "gemini", model: "gemini-2.5-flash-preview-05-20" },
  { provider: "groq", model: "llama-3.1-8b-instant" },
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "deepseek", model: "deepseek-chat" },
];

// LLM Provider Interface
export interface ILlmProvider {
  readonly providerType: LlmProviderType;
  generateCompletion(
    prompt: string,
    options?: LlmOptions,
  ): Promise<LlmResponse>;
}

export interface LlmOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  model?: string; // Override model for this request
}

export interface LlmResponse {
  content: string;
  tokensUsed: number;
  finishReason: string;
  provider?: LlmProviderType;
  model?: string;
}

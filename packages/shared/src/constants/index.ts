/**
 * Shared Constants
 */

// Resource Types
export const RESOURCE_TYPES = {
  BOOK: 'BOOK',
  PAPER: 'PAPER',
  ARTICLE: 'ARTICLE',
  VIDEO: 'VIDEO',
  COURSE: 'COURSE',
  MANUAL: 'MANUAL',
  NOTES: 'NOTES',
  OTHER: 'OTHER',
} as const;

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  BOOK: 'Libro',
  PAPER: 'Paper',
  ARTICLE: 'Artículo',
  VIDEO: 'Video',
  COURSE: 'Curso',
  MANUAL: 'Manual',
  NOTES: 'Apuntes',
  OTHER: 'Otro',
};

// Resource Levels
export const RESOURCE_LEVELS = {
  BASIC: 'BASIC',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;

export const RESOURCE_LEVEL_LABELS: Record<string, string> = {
  BASIC: 'Básico',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

// Study Styles
export const STUDY_STYLES = {
  FORMAL: 'FORMAL',
  PRACTICAL: 'PRACTICAL',
  BALANCED: 'BALANCED',
} as const;

export const STUDY_STYLE_LABELS: Record<string, string> = {
  FORMAL: 'Formal/Académico',
  PRACTICAL: 'Práctico/Ejemplos',
  BALANCED: 'Equilibrado',
};

// Content Depth
export const CONTENT_DEPTHS = {
  BASIC: 'BASIC',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;

export const CONTENT_DEPTH_LABELS: Record<string, string> = {
  BASIC: 'Introductorio',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

// Citation Styles
export const CITATION_STYLES = {
  APA: 'APA',
  IEEE: 'IEEE',
  VANCOUVER: 'Vancouver',
  CHICAGO: 'Chicago',
} as const;

// Academic Sources
export const ACADEMIC_SOURCES = {
  OPENALEX: 'openalex',
  SEMANTIC_SCHOLAR: 'semantic_scholar',
  CROSSREF: 'crossref',
} as const;

export const ACADEMIC_SOURCE_LABELS: Record<string, string> = {
  openalex: 'OpenAlex',
  semantic_scholar: 'Semantic Scholar',
  crossref: 'CrossRef',
};

// Summary Types
export const SUMMARY_TYPES = {
  EXECUTIVE: 'executive',
  EXTENDED: 'extended',
  EXAM_SHEET: 'exam_sheet',
  CONCEPT_MAP: 'concept_map',
} as const;

export const SUMMARY_TYPE_LABELS: Record<string, string> = {
  executive: 'Resumen Ejecutivo (1 página)',
  extended: 'Resumen Extendido (3-5 páginas)',
  exam_sheet: 'Ficha de Examen',
  concept_map: 'Mapa Conceptual',
};

// Subject Colors
export const SUBJECT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
] as const;

// RAG Defaults
export const RAG_DEFAULTS = {
  CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 50,
  TOP_K: 5,
  MIN_SCORE: 0.7,
  EMBEDDING_DIMENSION: 1536, // OpenAI text-embedding-3-small
} as const;

// API Limits
export const API_LIMITS = {
  MAX_QUERY_LENGTH: 1000,
  MAX_RESULTS_PER_PAGE: 100,
  MAX_FILE_SIZE_MB: 10,
  MAX_RESOURCES_PER_SUBJECT: 500,
} as const;

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'Inglés' },
  { code: 'pt', name: 'Portugués' },
] as const;

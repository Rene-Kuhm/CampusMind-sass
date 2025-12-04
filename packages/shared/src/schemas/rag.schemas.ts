import { z } from 'zod';

export const ragQuerySchema = z.object({
  query: z
    .string()
    .min(3, 'La consulta debe tener al menos 3 caracteres')
    .max(1000, 'La consulta no puede exceder 1000 caracteres'),
  subjectId: z.string().cuid().optional(),
  resourceIds: z.array(z.string().cuid()).optional(),
  topK: z.number().int().min(1).max(20).default(5),
  minScore: z.number().min(0).max(1).default(0.7),
  style: z.enum(['FORMAL', 'PRACTICAL', 'BALANCED']).optional(),
  depth: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
});

export const generateSummarySchema = z.object({
  resourceId: z.string().cuid(),
  type: z.enum(['executive', 'extended', 'exam_sheet', 'concept_map']).default('executive'),
  depth: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
  includeExamples: z.boolean().default(true),
  citationStyle: z.enum(['APA', 'IEEE', 'Vancouver', 'Chicago']).default('APA'),
});

export const academicSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'La búsqueda debe tener al menos 2 caracteres')
    .max(200),
  type: z.enum([
    'BOOK',
    'PAPER',
    'ARTICLE',
    'VIDEO',
    'COURSE',
    'MANUAL',
    'NOTES',
    'OTHER',
  ]).optional(),
  level: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  language: z.string().min(2).max(5).optional(),
  yearFrom: z.number().int().min(1900).max(2100).optional(),
  yearTo: z.number().int().min(1900).max(2100).optional(),
  openAccessOnly: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(20),
});

export type RagQueryInput = z.infer<typeof ragQuerySchema>;
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;
export type AcademicSearchInput = z.infer<typeof academicSearchSchema>;

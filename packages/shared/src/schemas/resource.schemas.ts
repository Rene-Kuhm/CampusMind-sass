import { z } from 'zod';

export const resourceTypeEnum = z.enum([
  'BOOK',
  'PAPER',
  'ARTICLE',
  'VIDEO',
  'COURSE',
  'MANUAL',
  'NOTES',
  'OTHER',
]);

export const resourceLevelEnum = z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']);

export const createResourceSchema = z.object({
  subjectId: z.string().cuid(),
  title: z
    .string()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(300, 'El título no puede exceder 300 caracteres'),
  authors: z.array(z.string()).default([]),
  description: z.string().max(5000).optional(),
  url: z.string().url('URL inválida').optional().or(z.literal('')),
  type: resourceTypeEnum,
  level: resourceLevelEnum.default('INTERMEDIATE'),
  language: z.string().min(2).max(5).default('es'),
  isOpenAccess: z.boolean().default(true),
  license: z.string().max(50).optional(),
});

export const updateResourceSchema = createResourceSchema
  .omit({ subjectId: true })
  .partial();

export const createNoteSchema = z.object({
  resourceId: z.string().cuid(),
  content: z
    .string()
    .min(1, 'El contenido no puede estar vacío')
    .max(10000, 'El contenido no puede exceder 10000 caracteres'),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

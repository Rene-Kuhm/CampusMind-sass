import { z } from 'zod';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().max(500).optional(),
  career: z.string().max(100).optional(),
  year: z.number().int().min(1).max(10).optional(),
  semester: z.string().max(20).optional(),
  color: z.string().regex(hexColorRegex, 'Color hexadecimal inválido').optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

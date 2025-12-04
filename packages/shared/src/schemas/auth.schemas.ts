import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  career: z.string().optional(),
  year: z.number().int().min(1).max(10).optional(),
  university: z.string().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  career: z.string().nullable().optional(),
  year: z.number().int().min(1).max(10).nullable().optional(),
  university: z.string().nullable().optional(),
  studyStyle: z.enum(['FORMAL', 'PRACTICAL', 'BALANCED']).optional(),
  contentDepth: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  preferredLang: z.string().min(2).max(5).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

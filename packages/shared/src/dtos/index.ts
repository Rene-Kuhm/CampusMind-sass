/**
 * Shared DTOs (Data Transfer Objects)
 * Re-export schema inferred types as DTOs
 */

export type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../schemas/auth.schemas';

export type {
  CreateSubjectInput,
  UpdateSubjectInput,
} from '../schemas/subject.schemas';

export type {
  CreateResourceInput,
  UpdateResourceInput,
  CreateNoteInput,
} from '../schemas/resource.schemas';

export type {
  RagQueryInput,
  GenerateSummaryInput,
  AcademicSearchInput,
} from '../schemas/rag.schemas';

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

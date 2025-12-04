/**
 * Subject (Materia) Types
 */

export interface Subject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  career: string | null;
  year: number | null;
  semester: string | null;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectWithCounts extends Subject {
  _count: {
    resources: number;
    queries: number;
  };
}

export interface CreateSubjectInput {
  name: string;
  description?: string;
  career?: string;
  year?: number;
  semester?: string;
  color?: string;
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {
  isArchived?: boolean;
}

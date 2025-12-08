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

// CreateSubjectInput and UpdateSubjectInput are exported from schemas/subject.schemas.ts

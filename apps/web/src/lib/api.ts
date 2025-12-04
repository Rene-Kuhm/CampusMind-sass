/**
 * CampusMind API Client
 * Handles all HTTP requests to the NestJS backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${API_PREFIX}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || 'Error en la solicitud',
      errorData.errors
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  career?: string;
  year?: number;
  university?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface User {
  id: string;
  email: string;
  profile: UserProfile | null;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  career: string | null;
  year: number | null;
  university: string | null;
  studyStyle: 'FORMAL' | 'PRACTICAL' | 'BALANCED';
  contentDepth: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  preferredLang: string;
}

export const auth = {
  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  me: (token: string) =>
    request<User>('/auth/me', { token }),

  updateProfile: (token: string, data: Partial<UserProfile>) =>
    request<User>('/auth/profile', { method: 'PATCH', body: data, token }),
};

// ============================================
// SUBJECTS ENDPOINTS
// ============================================

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  career: string | null;
  year: number | null;
  semester: string | null;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    resources: number;
    queries: number;
  };
}

export interface CreateSubjectRequest {
  name: string;
  description?: string;
  career?: string;
  year?: number;
  semester?: string;
  color?: string;
}

export interface UpdateSubjectRequest extends Partial<CreateSubjectRequest> {
  isArchived?: boolean;
}

export const subjects = {
  list: (token: string, includeArchived = false) =>
    request<Subject[]>(`/subjects?includeArchived=${includeArchived}`, { token }),

  get: (token: string, id: string) =>
    request<Subject>(`/subjects/${id}`, { token }),

  create: (token: string, data: CreateSubjectRequest) =>
    request<Subject>('/subjects', { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: UpdateSubjectRequest) =>
    request<Subject>(`/subjects/${id}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, id: string) =>
    request<void>(`/subjects/${id}`, { method: 'DELETE', token }),
};

// ============================================
// RESOURCES ENDPOINTS
// ============================================

export type ResourceType = 'BOOK' | 'PAPER' | 'ARTICLE' | 'VIDEO' | 'COURSE' | 'MANUAL' | 'NOTES' | 'OTHER';
export type ResourceLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export interface Resource {
  id: string;
  subjectId: string;
  title: string;
  authors: string[];
  description: string | null;
  url: string | null;
  type: ResourceType;
  level: ResourceLevel;
  language: string;
  isOpenAccess: boolean;
  license: string | null;
  externalId: string | null;
  externalSource: string | null;
  isIndexed: boolean;
  indexedAt: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceRequest {
  subjectId: string;
  title: string;
  authors?: string[];
  description?: string;
  url?: string;
  type: ResourceType;
  level?: ResourceLevel;
  language?: string;
  isOpenAccess?: boolean;
  license?: string;
}

export interface UpdateResourceRequest extends Partial<Omit<CreateResourceRequest, 'subjectId'>> {}

export const resources = {
  listBySubject: (token: string, subjectId: string) =>
    request<Resource[]>(`/resources/subject/${subjectId}`, { token }),

  get: (token: string, id: string) =>
    request<Resource>(`/resources/${id}`, { token }),

  create: (token: string, data: CreateResourceRequest) =>
    request<Resource>('/resources', { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: UpdateResourceRequest) =>
    request<Resource>(`/resources/${id}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, id: string) =>
    request<void>(`/resources/${id}`, { method: 'DELETE', token }),

  index: (token: string, id: string) =>
    request<{ chunksCreated: number; tokensUsed: number }>(
      `/resources/${id}/index`,
      { method: 'POST', token }
    ),
};

// ============================================
// ACADEMIC SEARCH ENDPOINTS
// ============================================

export interface AcademicResource {
  externalId: string;
  source: 'openalex' | 'semantic_scholar' | 'crossref';
  title: string;
  authors: string[];
  abstract: string | null;
  publicationDate: string | null;
  citationCount: number | null;
  url: string | null;
  pdfUrl: string | null;
  doi: string | null;
  isOpenAccess: boolean;
  type: ResourceType;
  level: ResourceLevel;
}

export interface AcademicSearchParams {
  query: string;
  type?: ResourceType;
  level?: ResourceLevel;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
  limit?: number;
}

export const academic = {
  search: (token: string, params: AcademicSearchParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return request<AcademicResource[]>(`/academic/search?${searchParams}`, { token });
  },

  importToSubject: (token: string, subjectId: string, resource: AcademicResource) =>
    request<Resource>('/academic/import', {
      method: 'POST',
      body: { subjectId, resource },
      token,
    }),
};

// ============================================
// RAG ENDPOINTS
// ============================================

export interface RagQueryRequest {
  query: string;
  subjectId?: string;
  resourceIds?: string[];
  topK?: number;
  minScore?: number;
  style?: 'FORMAL' | 'PRACTICAL' | 'BALANCED';
  depth?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface Citation {
  resourceId: string;
  resourceTitle: string;
  chunkContent: string;
  page?: number;
  section?: string;
  relevanceScore: number;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  tokensUsed: number;
  processingTimeMs: number;
}

export interface HarvardSummary {
  theoreticalContext: string;
  keyIdeas: string[];
  definitions: Array<{ term: string; definition: string }>;
  examples: string[];
  commonMistakes: string[];
  reviewChecklist: string[];
  references: string[];
}

export interface RagStats {
  totalQueries: number;
  totalTokensUsed: number;
  recentQueries: Array<{
    id: string;
    query: string;
    createdAt: string;
    tokensUsed: number | null;
    subject: { name: string } | null;
  }>;
}

export const rag = {
  query: (token: string, data: RagQueryRequest) =>
    request<RagResponse>('/rag/query', { method: 'POST', body: data, token }),

  generateSummary: (token: string, resourceId: string, depth?: 'basic' | 'intermediate' | 'advanced') =>
    request<HarvardSummary>(`/rag/summary/${resourceId}`, {
      method: 'POST',
      body: { depth },
      token,
    }),

  getStats: (token: string) =>
    request<RagStats>('/rag/stats', { token }),
};

// Export everything
export { ApiError };
export default {
  auth,
  subjects,
  resources,
  academic,
  rag,
};

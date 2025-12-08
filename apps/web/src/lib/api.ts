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
    flashcards: number;
    quizzes: number;
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
    request<Resource[]>(`/subjects/${subjectId}/resources`, { token }),

  get: (token: string, subjectId: string, id: string) =>
    request<Resource>(`/subjects/${subjectId}/resources/${id}`, { token }),

  create: (token: string, subjectId: string, data: Omit<CreateResourceRequest, 'subjectId'>) =>
    request<Resource>(`/subjects/${subjectId}/resources`, { method: 'POST', body: data, token }),

  update: (token: string, subjectId: string, id: string, data: UpdateResourceRequest) =>
    request<Resource>(`/subjects/${subjectId}/resources/${id}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, subjectId: string, id: string) =>
    request<void>(`/subjects/${subjectId}/resources/${id}`, { method: 'DELETE', token }),

  addNote: (token: string, subjectId: string, resourceId: string, content: string) =>
    request<{ id: string; content: string }>(`/subjects/${subjectId}/resources/${resourceId}/notes`, {
      method: 'POST',
      body: { content },
      token,
    }),

  deleteNote: (token: string, subjectId: string, noteId: string) =>
    request<void>(`/subjects/${subjectId}/resources/notes/${noteId}`, { method: 'DELETE', token }),

  index: (token: string, resourceId: string) =>
    request<{ chunksCreated: number; tokensUsed: number }>(
      `/rag/ingest/${resourceId}`,
      { method: 'POST', token }
    ),
};

// ============================================
// ACADEMIC SEARCH ENDPOINTS
// ============================================

export type AcademicSource =
  | 'openalex'
  | 'semantic_scholar'
  | 'crossref'
  | 'youtube'
  | 'google_books'
  | 'archive_org'
  | 'libgen'
  | 'web'
  | 'oer_commons'
  | 'medical_books'
  | 'manual';

export type AcademicResourceType =
  | 'paper'
  | 'book'
  | 'book_chapter'
  | 'article'
  | 'thesis'
  | 'conference'
  | 'preprint'
  | 'dataset'
  | 'course'
  | 'video'
  | 'manual'
  | 'notes'
  | 'report'
  | 'standard'
  | 'reference'
  | 'other';

export type SearchCategory = 'all' | 'papers' | 'books' | 'videos' | 'courses' | 'medical';

export interface AcademicResource {
  externalId: string;
  source: AcademicSource;
  title: string;
  authors: string[];
  abstract: string | null;
  publicationDate: string | null;
  publicationYear?: number;
  citationCount: number | null;
  url: string | null;
  pdfUrl: string | null;
  doi: string | null;
  isOpenAccess: boolean;
  type: AcademicResourceType | string;
  // Extended fields for multimedia
  thumbnailUrl?: string | null;
  duration?: string; // For videos
  pageCount?: number; // For books
  language?: string;
  extension?: string;
  fileSize?: string;
  // Additional metadata
  topics?: string[];
  keywords?: string[];
  subjects?: string[];
  categories?: string[];
  journal?: string;
  publisher?: string;
  venue?: string;
  license?: string;
  referenceCount?: number;
}

export interface AcademicSearchParams {
  query: string;
  source?: AcademicSource;
  category?: SearchCategory;
  type?: ResourceType;
  level?: ResourceLevel;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
  limit?: number;
  page?: number;
}

export interface AcademicSearchResult {
  items: AcademicResource[];
  total: number;
  page: number;
  perPage: number;
  source: string;
}

export interface UnifiedSearchResult {
  results: AcademicResource[];
  totalBySource: Record<AcademicSource, number>;
}

export interface Career {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  categories: string[];
  keywords: string[];
}

export const academic = {
  // Single source search
  search: async (token: string, params: AcademicSearchParams): Promise<AcademicResource[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.query);
    if (params.source) searchParams.append('source', params.source);
    if (params.yearFrom) searchParams.append('yearFrom', String(params.yearFrom));
    if (params.yearTo) searchParams.append('yearTo', String(params.yearTo));
    if (params.openAccessOnly) searchParams.append('openAccessOnly', String(params.openAccessOnly));
    if (params.limit) searchParams.append('perPage', String(params.limit));
    if (params.page) searchParams.append('page', String(params.page));

    const result = await request<AcademicSearchResult>(`/academic/search?${searchParams}`, { token });
    return result.items || [];
  },

  // Unified search across all sources (books, videos, papers, courses)
  searchAll: async (token: string, params: AcademicSearchParams): Promise<UnifiedSearchResult> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.openAccessOnly) searchParams.append('openAccessOnly', String(params.openAccessOnly));
    if (params.limit) searchParams.append('perPage', String(params.limit));
    if (params.page) searchParams.append('page', String(params.page));

    return request<UnifiedSearchResult>(`/academic/search/all?${searchParams}`, { token });
  },

  // Multi-source search (papers only)
  searchMulti: async (token: string, params: AcademicSearchParams): Promise<AcademicResource[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.query);
    if (params.yearFrom) searchParams.append('yearFrom', String(params.yearFrom));
    if (params.yearTo) searchParams.append('yearTo', String(params.yearTo));
    if (params.openAccessOnly) searchParams.append('openAccessOnly', String(params.openAccessOnly));
    if (params.limit) searchParams.append('perPage', String(params.limit));

    const result = await request<UnifiedSearchResult>(
      `/academic/search/multi?${searchParams}`,
      { token }
    );
    return result.results || [];
  },

  importToSubject: (token: string, subjectId: string, resource: AcademicResource) =>
    request<Resource>('/academic/import', {
      method: 'POST',
      body: { subjectId, resource },
      token,
    }),

  // Library - Curated textbooks
  getTextbooks: async (token: string, category?: string): Promise<{
    textbooks: AcademicResource[];
    categories: string[];
    total: number;
    source: string;
    description: string;
  }> => {
    const params = category ? `?category=${category}` : '';
    return request(`/academic/library/textbooks${params}`, { token });
  },

  getCategories: async (token: string): Promise<{
    categories: string[];
    descriptions: Record<string, string>;
  }> => {
    return request('/academic/library/categories', { token });
  },

  getLibraryStats: async (token: string): Promise<{
    totalBooks: number;
    totalCategories: number;
    totalCareers: number;
    categoriesWithCounts: { category: string; count: number }[];
    careers: { id: string; name: string; categoriesCount: number }[];
  }> => {
    return request('/academic/library/stats', { token });
  },

  // Careers
  getCareers: async (token: string): Promise<{
    careers: Career[];
    total: number;
  }> => {
    return request('/academic/careers', { token });
  },

  getCareerById: async (token: string, careerId: string): Promise<Career> => {
    return request(`/academic/careers/${careerId}`, { token });
  },

  getTextbooksForCareer: async (token: string, careerId: string): Promise<{
    career: Career;
    textbooks: AcademicResource[];
    total: number;
    categories: string[];
  }> => {
    return request(`/academic/careers/${careerId}/textbooks`, { token });
  },

  // Smart Recommendations
  getSmartRecommendations: async (token: string, subjectName: string): Promise<{
    subjectName: string;
    career: Career | null;
    recommendations: AcademicResource[];
    matchedKeywords: string[];
    total: number;
  }> => {
    return request(`/academic/recommendations/smart?subject=${encodeURIComponent(subjectName)}`, { token });
  },
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

export interface AIProvider {
  type: string;
  name: string;
  isFree: boolean;
  description: string;
}

export interface ProvidersResponse {
  current: {
    type: string;
    name: string;
    isFree: boolean;
  };
  available: AIProvider[];
}

// AI Generation interfaces
export interface GenerateFlashcardsRequest {
  topic: string;
  count?: number;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  language?: string;
  content?: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface GenerateFlashcardsResponse {
  flashcards: GeneratedFlashcard[];
  tokensUsed: number;
}

export interface GenerateQuizRequest {
  topic: string;
  questionCount?: number;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer')[];
  language?: string;
  content?: string;
}

export interface GeneratedQuestion {
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface GenerateQuizResponse {
  questions: GeneratedQuestion[];
  tokensUsed: number;
}

export interface GenerateSummaryRequest {
  content: string;
  style?: 'bullet_points' | 'paragraph' | 'outline';
  length?: 'short' | 'medium' | 'long';
  language?: string;
}

export interface GenerateSummaryResponse {
  summary: string;
  keyPoints: string[];
  tokensUsed: number;
}

export const rag = {
  query: (token: string, data: RagQueryRequest) =>
    request<RagResponse>('/rag/query', { method: 'POST', body: data, token }),

  generateSummary: (token: string, resourceId: string, depth?: 'basic' | 'intermediate' | 'advanced') => {
    const params = depth ? `?depth=${depth}` : '';
    return request<HarvardSummary>(`/rag/summary/${resourceId}${params}`, { token });
  },

  getStats: (token: string) =>
    request<RagStats>('/rag/stats', { token }),

  getProviders: (token: string) =>
    request<ProvidersResponse>('/rag/providers', { token }),

  // AI Generation endpoints
  generateFlashcards: (token: string, data: GenerateFlashcardsRequest) =>
    request<GenerateFlashcardsResponse>('/rag/generate/flashcards', { method: 'POST', body: data, token }),

  generateQuiz: (token: string, data: GenerateQuizRequest) =>
    request<GenerateQuizResponse>('/rag/generate/quiz', { method: 'POST', body: data, token }),

  generateAutoSummary: (token: string, data: GenerateSummaryRequest) =>
    request<GenerateSummaryResponse>('/rag/generate/summary', { method: 'POST', body: data, token }),
};

// ============================================
// BILLING ENDPOINTS
// ============================================

export type PlanType = 'FREE' | 'PRO' | 'PREMIUM';
export type PaymentProvider = 'MERCADOPAGO' | 'LEMONSQUEEZY';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED';

export interface PlanLimits {
  ragQueriesPerMonth: number;
  flashcardsTotal: number;
  storageMb: number;
  subjectsActive: number;
  quizzesPerMonth: number;
  aiSummaries: boolean;
  prioritySupport: boolean;
  exportData: boolean;
}

export interface PlanPricing {
  monthly: { ars: number; usd: number };
  yearly: { ars: number; usd: number };
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  limits: PlanLimits;
  pricing: PlanPricing;
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  provider?: PaymentProvider;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  createdAt: string;
}

export interface Usage {
  ragQueries: { used: number; limit: number };
  flashcards: { used: number; limit: number };
  storageMb: { used: number; limit: number };
  subjects: { used: number; limit: number };
  quizzes: { used: number; limit: number };
  periodStart: string;
  periodEnd: string;
}

export interface CheckoutRequest {
  plan: PlanType;
  provider: PaymentProvider;
  billingPeriod?: 'monthly' | 'yearly';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  provider: PaymentProvider;
  externalId?: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: PaymentProvider;
  paidAt?: string;
  createdAt: string;
}

export const billing = {
  getPlans: () =>
    request<Plan[]>('/billing/plans'),

  getSubscription: (token: string) =>
    request<Subscription>('/billing/subscription', { token }),

  createCheckout: (token: string, data: CheckoutRequest) =>
    request<CheckoutResponse>('/billing/checkout', { method: 'POST', body: data, token }),

  cancelSubscription: (token: string, cancelAtPeriodEnd = true) =>
    request<Subscription>('/billing/subscription/cancel', {
      method: 'PATCH',
      body: { cancelAtPeriodEnd },
      token,
    }),

  changePlan: (token: string, newPlan: PlanType, immediate = true) =>
    request<CheckoutResponse | Subscription>('/billing/subscription/change-plan', {
      method: 'PATCH',
      body: { newPlan, immediate },
      token,
    }),

  getUsage: (token: string) =>
    request<Usage>('/billing/usage', { token }),

  getPaymentHistory: (token: string) =>
    request<Payment[]>('/billing/payments', { token }),

  getBillingPortal: (token: string) =>
    request<{ portalUrl: string; provider: PaymentProvider }>('/billing/portal', { token }),
};

// ============================================
// CALENDAR ENDPOINTS
// ============================================

export type EventType = 'CLASS' | 'EXAM' | 'ASSIGNMENT' | 'STUDY' | 'OTHER';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  isCompleted: boolean;
  subjectId?: string;
  subject?: { name: string; color: string };
  createdAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate?: string;
  isAllDay?: boolean;
  subjectId?: string;
}

export const calendar = {
  getEvents: (token: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return request<CalendarEvent[]>(`/calendar/events${query ? `?${query}` : ''}`, { token });
  },

  getTodayEvents: (token: string) =>
    request<CalendarEvent[]>('/calendar/events/today', { token }),

  getWeekEvents: (token: string) =>
    request<CalendarEvent[]>('/calendar/events/week', { token }),

  getEvent: (token: string, id: string) =>
    request<CalendarEvent>(`/calendar/events/${id}`, { token }),

  createEvent: (token: string, data: CreateEventRequest) =>
    request<CalendarEvent>('/calendar/events', { method: 'POST', body: data, token }),

  updateEvent: (token: string, id: string, data: Partial<CreateEventRequest>) =>
    request<CalendarEvent>(`/calendar/events/${id}`, { method: 'PATCH', body: data, token }),

  deleteEvent: (token: string, id: string) =>
    request<void>(`/calendar/events/${id}`, { method: 'DELETE', token }),

  completeEvent: (token: string, id: string) =>
    request<CalendarEvent>(`/calendar/events/${id}/complete`, { method: 'PATCH', token }),
};

// ============================================
// NOTEBOOK ENDPOINTS (NotebookLLM-style features)
// ============================================

export type VoiceType = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  tags: string[];
}

export interface StudyGuide {
  summary: string;
  keyPoints: string[];
  concepts: Array<{ term: string; definition: string }>;
  studyTips: string[];
}

export interface Voice {
  id: string;
  name: string;
  description: string;
}

export interface GenerateQuestionsRequest {
  resourceId: string;
  count?: number;
  types?: QuestionType[];
  difficulty?: Difficulty;
}

export interface GenerateFlashcardsRequest {
  resourceId: string;
  count?: number;
  includeFormulas?: boolean;
}

export interface GeneratePodcastRequest {
  resourceId: string;
  voice?: VoiceType;
  style?: 'formal' | 'casual';
  duration?: 'short' | 'medium' | 'long';
}

export interface FullNotebookResponse {
  resourceId: string;
  resourceName: string;
  studyGuide: StudyGuide;
  questions: GeneratedQuestion[];
  flashcards: GeneratedFlashcard[];
  podcastScript: string;
  generatedAt: string;
}

const API_URL_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const notebook = {
  // Get available TTS voices
  getVoices: (token: string) =>
    request<Voice[]>('/notebook/voices', { token }),

  // Generate questions from a resource
  generateQuestions: (token: string, data: GenerateQuestionsRequest) =>
    request<{
      resourceId: string;
      resourceName: string;
      questions: GeneratedQuestion[];
      generatedAt: string;
    }>('/notebook/questions/generate', { method: 'POST', body: data, token }),

  // Generate flashcards from a resource
  generateFlashcards: (token: string, data: GenerateFlashcardsRequest) =>
    request<{
      resourceId: string;
      resourceName: string;
      flashcards: GeneratedFlashcard[];
      generatedAt: string;
    }>('/notebook/flashcards/generate', { method: 'POST', body: data, token }),

  // Generate study guide from a resource
  generateStudyGuide: (token: string, resourceId: string) =>
    request<{
      resourceId: string;
      resourceName: string;
      summary: string;
      keyPoints: string[];
      concepts: Array<{ term: string; definition: string }>;
      studyTips: string[];
      generatedAt: string;
    }>('/notebook/study-guide/generate', { method: 'POST', body: { resourceId }, token }),

  // Generate podcast script (text only, no audio)
  generatePodcastScript: (token: string, data: GeneratePodcastRequest) =>
    request<{
      resourceId: string;
      resourceName: string;
      script: string;
      generatedAt: string;
    }>('/notebook/podcast-script/generate', { method: 'POST', body: data, token }),

  // Generate full notebook (study guide + questions + flashcards + script)
  generateFullNotebook: (token: string, resourceId: string) =>
    request<FullNotebookResponse>(`/notebook/full/${resourceId}`, { method: 'POST', token }),

  // Generate audio (returns Blob URL)
  generateAudio: async (token: string, text: string, voice?: VoiceType): Promise<string> => {
    const response = await fetch(`${API_URL_BASE}${API_PREFIX}/notebook/audio/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // Generate podcast audio (returns Blob URL)
  generatePodcastAudio: async (
    token: string,
    resourceId: string,
    options?: { voice?: VoiceType; style?: 'formal' | 'casual'; duration?: 'short' | 'medium' | 'long' }
  ): Promise<string> => {
    const response = await fetch(`${API_URL_BASE}${API_PREFIX}/notebook/podcast/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resourceId, ...options }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate podcast');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};

// ============================================
// FLASHCARDS ENDPOINTS
// ============================================

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  formula?: string;
  tags: string[];
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  subjectId?: string;
  subject?: { name: string; color: string };
  isPublic: boolean;
  cardCount: number;
  dueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashcardRequest {
  deckId: string;
  front: string;
  back: string;
  formula?: string;
  tags?: string[];
}

export interface CreateDeckRequest {
  name: string;
  description?: string;
  color?: string;
  subjectId?: string;
  isPublic?: boolean;
}

export interface ReviewFlashcardRequest {
  quality: number; // 0-5 for SM-2
  timeSpentMs?: number;
}

export interface FlashcardStats {
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  averageEaseFactor: number;
  masteredCards: number;
  streakDays: number;
}

export const flashcards = {
  // Decks
  listDecks: (token: string) =>
    request<FlashcardDeck[]>('/flashcards/decks', { token }),

  getDeck: (token: string, deckId: string) =>
    request<FlashcardDeck>(`/flashcards/decks/${deckId}`, { token }),

  createDeck: (token: string, data: CreateDeckRequest) =>
    request<FlashcardDeck>('/flashcards/decks', { method: 'POST', body: data, token }),

  updateDeck: (token: string, deckId: string, data: Partial<CreateDeckRequest>) =>
    request<FlashcardDeck>(`/flashcards/decks/${deckId}`, { method: 'PATCH', body: data, token }),

  deleteDeck: (token: string, deckId: string) =>
    request<void>(`/flashcards/decks/${deckId}`, { method: 'DELETE', token }),

  // Cards
  getCards: (token: string, deckId: string) =>
    request<Flashcard[]>(`/flashcards/decks/${deckId}/cards`, { token }),

  createCard: (token: string, data: CreateFlashcardRequest) =>
    request<Flashcard>('/flashcards/cards', { method: 'POST', body: data, token }),

  updateCard: (token: string, cardId: string, data: Partial<CreateFlashcardRequest>) =>
    request<Flashcard>(`/flashcards/cards/${cardId}`, { method: 'PATCH', body: data, token }),

  deleteCard: (token: string, cardId: string) =>
    request<void>(`/flashcards/cards/${cardId}`, { method: 'DELETE', token }),

  // Study
  getDueCards: (token: string, deckId?: string) => {
    const query = deckId ? `?deckId=${deckId}` : '';
    return request<Flashcard[]>(`/flashcards/due${query}`, { token });
  },

  reviewCard: (token: string, cardId: string, data: ReviewFlashcardRequest) =>
    request<Flashcard>(`/flashcards/cards/${cardId}/review`, { method: 'POST', body: data, token }),

  // Stats
  getStats: (token: string, deckId?: string) => {
    const query = deckId ? `?deckId=${deckId}` : '';
    return request<FlashcardStats>(`/flashcards/stats${query}`, { token });
  },

  // Bulk import
  importCards: (token: string, deckId: string, cards: Array<{ front: string; back: string; tags?: string[] }>) =>
    request<{ imported: number }>('/flashcards/import', { method: 'POST', body: { deckId, cards }, token }),
};

// ============================================
// QUIZZES ENDPOINTS
// ============================================

export type QuizQuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuizQuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  difficulty: DifficultyLevel;
  orderIndex: number;
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subjectId?: string;
  subject?: { name: string; color: string };
  timeLimitMinutes?: number;
  passingScore: number;
  showAnswers: boolean;
  shuffleQuestions: boolean;
  isPublished: boolean;
  questions: QuizQuestion[];
  _count?: { attempts: number };
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, unknown>;
  gradedAnswers?: Array<{
    questionId: string;
    userAnswer: unknown;
    isCorrect: boolean | null;
    points: number;
    explanation?: string;
    essayEvaluation?: {
      feedback: string;
      strengths: string[];
      improvements: string[];
    };
  }>;
  timeSpentMinutes?: number;
  startedAt: string;
  completedAt: string;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  subjectId?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  showAnswers?: boolean;
  shuffleQuestions?: boolean;
}

export interface CreateQuestionRequest {
  type: QuizQuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  difficulty?: DifficultyLevel;
}

export interface SubmitQuizRequest {
  answers: Array<{
    questionId: string;
    selectedOption?: number;
    textAnswer?: string;
  }>;
  timeSpentMinutes?: number;
}

export interface QuizStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  bestScore: number;
  recentAttempts: QuizAttempt[];
}

export const quizzes = {
  // Quiz CRUD
  list: (token: string, subjectId?: string) => {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return request<Quiz[]>(`/quizzes${query}`, { token });
  },

  get: (token: string, quizId: string) =>
    request<Quiz>(`/quizzes/${quizId}`, { token }),

  create: (token: string, data: CreateQuizRequest) =>
    request<Quiz>('/quizzes', { method: 'POST', body: data, token }),

  update: (token: string, quizId: string, data: Partial<CreateQuizRequest>) =>
    request<Quiz>(`/quizzes/${quizId}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, quizId: string) =>
    request<void>(`/quizzes/${quizId}`, { method: 'DELETE', token }),

  publish: (token: string, quizId: string) =>
    request<Quiz>(`/quizzes/${quizId}/publish`, { method: 'PATCH', token }),

  // Questions
  addQuestion: (token: string, quizId: string, data: CreateQuestionRequest) =>
    request<QuizQuestion>(`/quizzes/${quizId}/questions`, { method: 'POST', body: data, token }),

  updateQuestion: (token: string, quizId: string, questionId: string, data: Partial<CreateQuestionRequest>) =>
    request<QuizQuestion>(`/quizzes/${quizId}/questions/${questionId}`, { method: 'PATCH', body: data, token }),

  deleteQuestion: (token: string, quizId: string, questionId: string) =>
    request<void>(`/quizzes/${quizId}/questions/${questionId}`, { method: 'DELETE', token }),

  reorderQuestions: (token: string, quizId: string, questionIds: string[]) =>
    request<void>(`/quizzes/${quizId}/questions/reorder`, { method: 'PATCH', body: { questionIds }, token }),

  // Taking quizzes
  getForTaking: (token: string, quizId: string) =>
    request<Quiz>(`/quizzes/${quizId}/take`, { token }),

  submit: (token: string, quizId: string, data: SubmitQuizRequest) =>
    request<QuizAttempt>(`/quizzes/${quizId}/submit`, { method: 'POST', body: data, token }),

  // Attempts
  getAttempts: (token: string, quizId: string) =>
    request<QuizAttempt[]>(`/quizzes/${quizId}/attempts`, { token }),

  getAttempt: (token: string, quizId: string, attemptId: string) =>
    request<QuizAttempt>(`/quizzes/${quizId}/attempts/${attemptId}`, { token }),

  // Stats
  getStats: (token: string) =>
    request<QuizStats>('/quizzes/stats', { token }),

  getQuizStats: (token: string, quizId: string) =>
    request<{ attempts: number; averageScore: number; passRate: number }>(`/quizzes/${quizId}/stats`, { token }),
};

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

export interface DashboardStats {
  subjects: number;
  flashcards: number;
  quizzes: number;
  studyHours: number;
  streakDays: number;
  xpTotal: number;
  level: number;
  dueCards: number;
  upcomingEvents: number;
}

export interface WeeklyProgress {
  day: string;
  cardsReviewed: number;
  quizzesCompleted: number;
  minutesStudied: number;
}

export interface RecentActivity {
  id: string;
  type: 'flashcard_review' | 'quiz_attempt' | 'resource_added' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const dashboard = {
  getStats: (token: string) =>
    request<DashboardStats>('/dashboard/stats', { token }),

  getWeeklyProgress: (token: string) =>
    request<WeeklyProgress[]>('/dashboard/progress/weekly', { token }),

  getRecentActivity: (token: string, limit = 10) =>
    request<RecentActivity[]>(`/dashboard/activity?limit=${limit}`, { token }),

  getStudyStreak: (token: string) =>
    request<{ currentStreak: number; longestStreak: number; lastStudyDate: string }>('/dashboard/streak', { token }),
};

// ============================================
// PROFILE & SETTINGS ENDPOINTS
// ============================================

export interface ProfileStats {
  totalStudyTime: number;
  cardsReviewed: number;
  quizzesTaken: number;
  averageQuizScore: number;
  achievementsUnlocked: number;
  currentStreak: number;
  longestStreak: number;
  joinedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface NotificationSettings {
  emailStudyReminders: boolean;
  emailWeeklySummary: boolean;
  emailAchievements: boolean;
  pushStudyReminders: boolean;
  pushDueCards: boolean;
  pushAchievements: boolean;
  reminderTime: string; // HH:mm format
}

export interface PrivacySettings {
  profilePublic: boolean;
  showStreak: boolean;
  showAchievements: boolean;
  allowGroupInvites: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  studyStyle: 'FORMAL' | 'PRACTICAL' | 'BALANCED';
  contentDepth: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export const profile = {
  get: (token: string) =>
    request<User & { stats: ProfileStats }>('/profile', { token }),

  update: (token: string, data: Partial<UserProfile>) =>
    request<User>('/profile', { method: 'PATCH', body: data, token }),

  getStats: (token: string) =>
    request<ProfileStats>('/profile/stats', { token }),

  getAchievements: (token: string) =>
    request<Achievement[]>('/profile/achievements', { token }),

  uploadAvatar: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await fetch(`${API_URL}${API_PREFIX}/profile/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new ApiError(response.status, 'Failed to upload avatar');
    return response.json() as Promise<{ avatarUrl: string }>;
  },
};

export const settings = {
  get: (token: string) =>
    request<UserSettings>('/settings', { token }),

  update: (token: string, data: Partial<UserSettings>) =>
    request<UserSettings>('/settings', { method: 'PATCH', body: data, token }),

  getNotifications: (token: string) =>
    request<NotificationSettings>('/settings/notifications', { token }),

  updateNotifications: (token: string, data: Partial<NotificationSettings>) =>
    request<NotificationSettings>('/settings/notifications', { method: 'PATCH', body: data, token }),

  getPrivacy: (token: string) =>
    request<PrivacySettings>('/settings/privacy', { token }),

  updatePrivacy: (token: string, data: Partial<PrivacySettings>) =>
    request<PrivacySettings>('/settings/privacy', { method: 'PATCH', body: data, token }),
};

// ============================================
// TWO-FACTOR AUTH ENDPOINTS
// ============================================

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export const twoFactor = {
  getStatus: (token: string) =>
    request<{ enabled: boolean; hasBackupCodes: boolean }>('/auth/2fa/status', { token }),

  setup: (token: string) =>
    request<TwoFactorSetup>('/auth/2fa/setup', { method: 'POST', token }),

  verify: (token: string, code: string) =>
    request<{ success: boolean; backupCodes?: string[] }>('/auth/2fa/verify', { method: 'POST', body: { code }, token }),

  disable: (token: string, code: string) =>
    request<{ success: boolean }>('/auth/2fa/disable', { method: 'POST', body: { code }, token }),

  regenerateBackupCodes: (token: string, code: string) =>
    request<{ backupCodes: string[] }>('/auth/2fa/backup-codes', { method: 'POST', body: { code }, token }),
};

// ============================================
// PASSWORD RESET ENDPOINTS
// ============================================

export const passwordReset = {
  requestReset: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),

  validateToken: (email: string, token: string) =>
    request<{ valid: boolean }>('/auth/validate-reset-token', { method: 'POST', body: { email, token } }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: { email, token, newPassword } }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword }, token }),
};

// Export everything
export { ApiError };
export default {
  auth,
  subjects,
  resources,
  academic,
  rag,
  billing,
  calendar,
  notebook,
  flashcards,
  quizzes,
  dashboard,
  profile,
  settings,
  twoFactor,
  passwordReset,
};

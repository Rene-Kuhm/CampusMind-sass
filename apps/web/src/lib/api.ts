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

export interface NotebookGeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface NotebookGeneratedFlashcard {
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

export interface NotebookGenerateFlashcardsRequest {
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
  questions: NotebookGeneratedQuestion[];
  flashcards: NotebookGeneratedFlashcard[];
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
      questions: NotebookGeneratedQuestion[];
      generatedAt: string;
    }>('/notebook/questions/generate', { method: 'POST', body: data, token }),

  // Generate flashcards from a resource
  generateFlashcards: (token: string, data: NotebookGenerateFlashcardsRequest) =>
    request<{
      resourceId: string;
      resourceName: string;
      flashcards: NotebookGeneratedFlashcard[];
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

// ============================================
// OCR ENDPOINTS
// ============================================

export interface OcrDocument {
  id: string;
  title: string;
  fileUrl: string;
  extractedText: string;
  enhancedText?: string;
  language?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export const ocr = {
  process: (token: string, data: { title: string; fileUrl: string; fileName: string; fileType: string; fileSize: number; subjectId?: string; language?: string }) =>
    request<OcrDocument>('/ocr/process', { method: 'POST', body: data, token }),

  list: (token: string, subjectId?: string) =>
    request<OcrDocument[]>(`/ocr${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  get: (token: string, id: string) =>
    request<OcrDocument>(`/ocr/${id}`, { token }),

  reprocess: (token: string, id: string) =>
    request<OcrDocument>(`/ocr/${id}/reprocess`, { method: 'POST', token }),

  delete: (token: string, id: string) =>
    request<{ success: boolean }>(`/ocr/${id}`, { method: 'DELETE', token }),
};

// ============================================
// FORUMS ENDPOINTS
// ============================================

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  threadCount: number;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  author: { profile: { firstName: string; lastName: string; avatar?: string } };
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  viewCount: number;
  replyCount: number;
  voteScore: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  content: string;
  authorId: string;
  author: { profile: { firstName: string; lastName: string; avatar?: string } };
  isAccepted: boolean;
  voteScore: number;
  createdAt: string;
}

export const forums = {
  getCategories: (token: string) =>
    request<ForumCategory[]>('/forums/categories', { token }),

  createCategory: (token: string, data: { name: string; slug: string; description?: string; icon?: string; color?: string }) =>
    request<ForumCategory>('/forums/categories', { method: 'POST', body: data, token }),

  getThreads: (token: string, params?: { categoryId?: string; search?: string; tags?: string; sort?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tags) searchParams.set('tags', params.tags);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.page) searchParams.set('page', String(params.page));
    return request<{ threads: ForumThread[]; total: number; page: number; totalPages: number }>(`/forums/threads?${searchParams}`, { token });
  },

  getThread: (token: string, id: string) =>
    request<ForumThread & { replies: ForumReply[] }>(`/forums/threads/${id}`, { token }),

  createThread: (token: string, data: { title: string; content: string; categoryId: string; tags?: string[] }) =>
    request<ForumThread>('/forums/threads', { method: 'POST', body: data, token }),

  updateThread: (token: string, id: string, data: { title?: string; content?: string; tags?: string[] }) =>
    request<ForumThread>(`/forums/threads/${id}`, { method: 'PATCH', body: data, token }),

  deleteThread: (token: string, id: string) =>
    request<{ success: boolean }>(`/forums/threads/${id}`, { method: 'DELETE', token }),

  createReply: (token: string, threadId: string, data: { content: string; parentId?: string }) =>
    request<ForumReply>(`/forums/threads/${threadId}/replies`, { method: 'POST', body: data, token }),

  acceptReply: (token: string, replyId: string) =>
    request<ForumReply>(`/forums/replies/${replyId}/accept`, { method: 'POST', token }),

  voteThread: (token: string, threadId: string, value: 1 | -1) =>
    request<{ voteScore: number }>(`/forums/threads/${threadId}/vote`, { method: 'POST', body: { value }, token }),

  voteReply: (token: string, replyId: string, value: 1 | -1) =>
    request<{ voteScore: number }>(`/forums/replies/${replyId}/vote`, { method: 'POST', body: { value }, token }),

  getPopularTags: (token: string, limit?: number) =>
    request<{ tag: string; count: number }[]>(`/forums/tags/popular${limit ? `?limit=${limit}` : ''}`, { token }),
};

// ============================================
// TUTORING ENDPOINTS
// ============================================

export interface TutorProfile {
  id: string;
  userId: string;
  user: { profile: { firstName: string; lastName: string; avatar?: string } };
  bio?: string;
  subjects: string[];
  hourlyRate?: number;
  availability?: any;
  rating: number;
  reviewCount: number;
  totalSessions: number;
  isVerified: boolean;
  university?: string;
}

export interface TutoringSession {
  id: string;
  studentId: string;
  tutorId: string;
  subject: string;
  scheduledAt: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  meetingUrl?: string;
}

export interface TutorReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  student: { profile: { firstName: string; lastName: string } };
}

export const tutoring = {
  createProfile: (token: string, data: { bio?: string; subjects: string[]; hourlyRate?: number; availability?: any }) =>
    request<TutorProfile>('/tutoring/profile', { method: 'POST', body: data, token }),

  updateProfile: (token: string, data: Partial<TutorProfile>) =>
    request<TutorProfile>('/tutoring/profile', { method: 'PATCH', body: data, token }),

  getMyProfile: (token: string) =>
    request<TutorProfile>('/tutoring/profile/me', { token }),

  searchTutors: (token: string, params?: { subject?: string; university?: string; minRating?: number; maxRate?: number; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.subject) searchParams.set('subject', params.subject);
    if (params?.university) searchParams.set('university', params.university);
    if (params?.minRating) searchParams.set('minRating', String(params.minRating));
    if (params?.maxRate) searchParams.set('maxRate', String(params.maxRate));
    if (params?.page) searchParams.set('page', String(params.page));
    return request<{ tutors: TutorProfile[]; total: number; page: number; totalPages: number }>(`/tutoring/tutors?${searchParams}`, { token });
  },

  getTutor: (token: string, id: string) =>
    request<TutorProfile & { reviews: TutorReview[] }>(`/tutoring/tutors/${id}`, { token }),

  bookSession: (token: string, data: { tutorId: string; subject: string; scheduledAt: string; duration: number; notes?: string }) =>
    request<TutoringSession>('/tutoring/sessions', { method: 'POST', body: data, token }),

  getSessionsAsStudent: (token: string) =>
    request<TutoringSession[]>('/tutoring/sessions/student', { token }),

  getSessionsAsTutor: (token: string) =>
    request<TutoringSession[]>('/tutoring/sessions/tutor', { token }),

  updateSession: (token: string, id: string, data: { status?: string; notes?: string; meetingUrl?: string }) =>
    request<TutoringSession>(`/tutoring/sessions/${id}`, { method: 'PATCH', body: data, token }),

  createReview: (token: string, tutorId: string, data: { rating: number; comment?: string; sessionId?: string }) =>
    request<TutorReview>(`/tutoring/tutors/${tutorId}/reviews`, { method: 'POST', body: data, token }),

  getSubjects: (token: string) =>
    request<string[]>('/tutoring/subjects', { token }),
};

// ============================================
// BIBLIOGRAPHY ENDPOINTS
// ============================================

export type CitationType = 'BOOK' | 'ARTICLE' | 'JOURNAL' | 'WEBSITE' | 'THESIS' | 'CONFERENCE' | 'REPORT' | 'VIDEO' | 'PODCAST' | 'OTHER';
export type CitationStyle = 'APA' | 'MLA' | 'CHICAGO' | 'HARVARD' | 'IEEE' | 'VANCOUVER';

export interface Bibliography {
  id: string;
  name: string;
  description?: string;
  subjectId?: string;
  citationCount: number;
  createdAt: string;
}

export interface Citation {
  id: string;
  type: CitationType;
  title: string;
  authors?: string[];
  year?: number;
  url?: string;
  doi?: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  notes?: string;
  tags?: string[];
}

export const bibliography = {
  create: (token: string, data: { name: string; description?: string; subjectId?: string }) =>
    request<Bibliography>('/bibliography', { method: 'POST', body: data, token }),

  list: (token: string, subjectId?: string) =>
    request<Bibliography[]>(`/bibliography${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  get: (token: string, id: string) =>
    request<Bibliography & { citations: Citation[] }>(`/bibliography/${id}`, { token }),

  delete: (token: string, id: string) =>
    request<{ success: boolean }>(`/bibliography/${id}`, { method: 'DELETE', token }),

  addCitation: (token: string, bibliographyId: string, data: Partial<Citation>) =>
    request<Citation>(`/bibliography/${bibliographyId}/citations`, { method: 'POST', body: data, token }),

  updateCitation: (token: string, citationId: string, data: Partial<Citation>) =>
    request<Citation>(`/bibliography/citations/${citationId}`, { method: 'PATCH', body: data, token }),

  deleteCitation: (token: string, citationId: string) =>
    request<{ success: boolean }>(`/bibliography/citations/${citationId}`, { method: 'DELETE', token }),

  export: (token: string, bibliographyId: string, style: CitationStyle = 'APA') =>
    request<{ formatted: string; bibtex: string }>(`/bibliography/${bibliographyId}/export?style=${style}`, { token }),

  importFromDOI: (token: string, bibliographyId: string, doi: string) =>
    request<Citation>(`/bibliography/${bibliographyId}/import/doi`, { method: 'POST', body: { doi }, token }),
};

// ============================================
// STUDY PLANS ENDPOINTS
// ============================================

export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  startDate: string;
  endDate: string;
  totalItems: number;
  completedItems: number;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  items: StudyPlanItem[];
  createdAt: string;
}

export interface StudyPlanItem {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  duration: number;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
}

export const studyPlans = {
  create: (token: string, data: { title: string; description?: string; subjectId?: string; startDate: string; endDate: string; items: { title: string; description?: string; scheduledDate: string; duration: number }[] }) =>
    request<StudyPlan>('/study-plans', { method: 'POST', body: data, token }),

  generateWithAI: (token: string, data: { subjectId?: string; topic: string; examDate: string; hoursPerDay: number; difficulty?: string; goals?: string }) =>
    request<StudyPlan>('/study-plans/generate', { method: 'POST', body: data, token }),

  list: (token: string, subjectId?: string) =>
    request<StudyPlan[]>(`/study-plans${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  get: (token: string, id: string) =>
    request<StudyPlan>(`/study-plans/${id}`, { token }),

  getTodayItems: (token: string) =>
    request<StudyPlanItem[]>('/study-plans/today', { token }),

  updateItem: (token: string, itemId: string, data: { isCompleted?: boolean; notes?: string }) =>
    request<StudyPlanItem>(`/study-plans/items/${itemId}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, id: string) =>
    request<{ success: boolean }>(`/study-plans/${id}`, { method: 'DELETE', token }),
};

// ============================================
// TRANSCRIPTION ENDPOINTS
// ============================================

export interface Transcription {
  id: string;
  title: string;
  sourceType: 'UPLOAD' | 'YOUTUBE' | 'RECORDING' | 'URL';
  sourceUrl?: string;
  duration?: number;
  language?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transcribedText?: string;
  summary?: string;
  segments?: { start: number; end: number; text: string }[];
  createdAt: string;
}

export const transcription = {
  create: (token: string, data: { title: string; subjectId?: string; sourceType: string; sourceUrl?: string; fileName?: string; language?: string }) =>
    request<Transcription>('/transcription', { method: 'POST', body: data, token }),

  list: (token: string, subjectId?: string) =>
    request<Transcription[]>(`/transcription${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  get: (token: string, id: string) =>
    request<Transcription>(`/transcription/${id}`, { token }),

  delete: (token: string, id: string) =>
    request<{ success: boolean }>(`/transcription/${id}`, { method: 'DELETE', token }),
};

// ============================================
// VIDEO SUMMARY ENDPOINTS
// ============================================

export interface VideoSummary {
  id: string;
  title: string;
  videoUrl: string;
  videoPlatform: string;
  videoTitle?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary?: string;
  keyPoints?: string[];
  timestamps?: { time: number; topic: string }[];
  createdAt: string;
}

export const videoSummary = {
  create: (token: string, data: { title: string; videoUrl: string; subjectId?: string; language?: string }) =>
    request<VideoSummary>('/video-summary', { method: 'POST', body: data, token }),

  list: (token: string, subjectId?: string) =>
    request<VideoSummary[]>(`/video-summary${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  get: (token: string, id: string) =>
    request<VideoSummary>(`/video-summary/${id}`, { token }),

  delete: (token: string, id: string) =>
    request<{ success: boolean }>(`/video-summary/${id}`, { method: 'DELETE', token }),
};

// ============================================
// EMAIL REPORTS ENDPOINTS
// ============================================

export interface EmailReportConfig {
  id: string;
  isEnabled: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  timezone: string;
  includeStudyTime: boolean;
  includeFlashcards: boolean;
  includeQuizzes: boolean;
  includeTasks: boolean;
  includeGoals: boolean;
  includeUpcoming: boolean;
}

export const emailReports = {
  getConfig: (token: string) =>
    request<EmailReportConfig>('/email-reports/config', { token }),

  updateConfig: (token: string, data: Partial<EmailReportConfig>) =>
    request<EmailReportConfig>('/email-reports/config', { method: 'PATCH', body: data, token }),

  preview: (token: string) =>
    request<any>('/email-reports/preview', { token }),

  sendNow: (token: string) =>
    request<{ success: boolean }>('/email-reports/send', { method: 'POST', token }),
};

// ============================================
// LMS ENDPOINTS
// ============================================

export interface LmsIntegration {
  id: string;
  provider: 'MOODLE' | 'GOOGLE_CLASSROOM' | 'CANVAS' | 'BLACKBOARD';
  instanceUrl?: string;
  accountName?: string;
  accountEmail?: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
}

export interface LmsCourse {
  id: string;
  externalId: string;
  name: string;
  shortName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export const lms = {
  getIntegrations: (token: string) =>
    request<LmsIntegration[]>('/lms/integrations', { token }),

  deleteIntegration: (token: string, id: string) =>
    request<{ success: boolean }>(`/lms/integrations/${id}`, { method: 'DELETE', token }),

  // Moodle
  connectMoodle: (token: string, data: { instanceUrl: string; moodleToken: string }) =>
    request<LmsIntegration>('/lms/moodle/connect', { method: 'POST', body: { instanceUrl: data.instanceUrl, token: data.moodleToken }, token }),

  getMoodleCourses: (token: string) =>
    request<LmsCourse[]>('/lms/moodle/courses', { token }),

  syncMoodleCourse: (token: string, courseId: string, subjectId?: string) =>
    request<{ success: boolean; synced: { assignments: number; grades: number } }>(`/lms/moodle/sync/${courseId}`, { method: 'POST', body: { subjectId }, token }),

  // Google Classroom
  getGoogleClassroomAuthUrl: (token: string) =>
    request<{ url: string }>('/lms/google-classroom/auth-url', { token }),

  getGoogleClassroomCourses: (token: string) =>
    request<LmsCourse[]>('/lms/google-classroom/courses', { token }),
};

// ============================================
// EXTERNAL INTEGRATIONS ENDPOINTS
// ============================================

export interface ExternalIntegration {
  id: string;
  provider: 'NOTION' | 'GOOGLE_DRIVE' | 'DISCORD' | 'SPOTIFY';
  accountName?: string;
  accountEmail?: string;
  isActive: boolean;
  createdAt: string;
}

export const integrations = {
  list: (token: string) =>
    request<ExternalIntegration[]>('/integrations', { token }),

  delete: (token: string, id: string) =>
    request<{ success: boolean }>(`/integrations/${id}`, { method: 'DELETE', token }),

  // Notion
  getNotionAuthUrl: (token: string) =>
    request<{ url: string }>('/integrations/notion/auth-url', { token }),

  exportToNotion: (token: string, data: { type: string; data: any }) =>
    request<{ success: boolean; notionPageId: string }>('/integrations/notion/export', { method: 'POST', body: data, token }),

  // Google Drive
  getGoogleDriveAuthUrl: (token: string) =>
    request<{ url: string }>('/integrations/google-drive/auth-url', { token }),

  importFromDrive: (token: string, fileId: string) =>
    request<{ fileName: string; mimeType: string; content: any }>(`/integrations/google-drive/import/${fileId}`, { token }),

  // Discord
  getDiscordAuthUrl: (token: string) =>
    request<{ url: string }>('/integrations/discord/auth-url', { token }),

  sendDiscordNotification: (token: string, message: string) =>
    request<{ success: boolean }>('/integrations/discord/notify', { method: 'POST', body: { message }, token }),

  // Spotify
  getSpotifyAuthUrl: (token: string) =>
    request<{ url: string }>('/integrations/spotify/auth-url', { token }),

  getStudyPlaylists: (token: string) =>
    request<{ id: string; name: string; description: string; imageUrl: string; tracksCount: number; uri: string }[]>('/integrations/spotify/playlists', { token }),
};

// ============================================
// CALENDAR SYNC ENDPOINTS
// ============================================

export interface CalendarIntegration {
  id: string;
  provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE';
  accountEmail?: string;
  syncEnabled: boolean;
  syncDirection: 'IMPORT' | 'EXPORT' | 'BOTH';
  lastSyncAt?: string;
  createdAt: string;
}

export const calendarSync = {
  getIntegrations: (token: string) =>
    request<CalendarIntegration[]>('/calendar-sync/integrations', { token }),

  getGoogleAuthUrl: (token: string) =>
    request<{ url: string }>('/calendar-sync/google/auth-url', { token }),

  syncCalendar: (token: string, provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE') =>
    request<{ success: boolean; synced: number }>(`/calendar-sync/sync/${provider}`, { method: 'POST', token }),

  updateIntegration: (token: string, id: string, data: { syncEnabled?: boolean; syncDirection?: 'IMPORT' | 'EXPORT' | 'BOTH' }) =>
    request<CalendarIntegration>(`/calendar-sync/${id}`, { method: 'PATCH', body: data, token }),

  deleteIntegration: (token: string, id: string) =>
    request<{ success: boolean }>(`/calendar-sync/${id}`, { method: 'DELETE', token }),

  exportIcal: (token: string) =>
    request<Blob>('/calendar-sync/export/ical', { token }),
};

// ============================================
// GRADES ENDPOINTS
// ============================================

export interface Grade {
  id: string;
  subjectId: string;
  categoryId?: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  date: string;
  notes?: string;
  category?: GradeCategory;
}

export interface GradeCategory {
  id: string;
  subjectId: string;
  name: string;
  weight: number;
  color?: string;
}

export interface GradeStats {
  subjectId: string;
  average: number;
  weightedAverage: number;
  totalGrades: number;
  highestGrade: { id: string; name: string; score: number; maxScore: number } | null;
  lowestGrade: { id: string; name: string; score: number; maxScore: number } | null;
  byCategory: { categoryId: string | null; categoryName: string; average: number; count: number }[];
}

export const grades = {
  list: (token: string, subjectId: string) =>
    request<Grade[]>(`/grades/subject/${subjectId}`, { token }),

  create: (token: string, subjectId: string, data: { name: string; score: number; maxScore?: number; weight?: number; date?: string; notes?: string; categoryId?: string }) =>
    request<Grade>(`/grades/subject/${subjectId}`, { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: Partial<Grade>) =>
    request<Grade>(`/grades/${id}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, id: string) =>
    request<void>(`/grades/${id}`, { method: 'DELETE', token }),

  getStats: (token: string, subjectId: string) =>
    request<GradeStats>(`/grades/subject/${subjectId}/stats`, { token }),

  getOverallStats: (token: string) =>
    request<{ overallAverage: number; totalSubjects: number; totalGrades: number; bySubject: { subjectId: string; subjectName: string; average: number; totalGrades: number }[] }>('/grades/stats', { token }),

  // Categories
  listCategories: (token: string, subjectId: string) =>
    request<GradeCategory[]>(`/grades/subject/${subjectId}/categories`, { token }),

  createCategory: (token: string, subjectId: string, data: { name: string; weight?: number; color?: string }) =>
    request<GradeCategory>(`/grades/subject/${subjectId}/categories`, { method: 'POST', body: data, token }),

  deleteCategory: (token: string, id: string) =>
    request<void>(`/grades/categories/${id}`, { method: 'DELETE', token }),
};

// ============================================
// RECORDINGS ENDPOINTS
// ============================================

export interface AudioRecording {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number;
  recordedAt: string;
  location?: string;
  professorName?: string;
  transcriptionId?: string;
  isProcessed: boolean;
  isFavorite: boolean;
  tags: string[];
  bookmarks: RecordingBookmark[];
  notes: RecordingNote[];
}

export interface RecordingBookmark {
  id: string;
  recordingId: string;
  timestamp: number;
  label: string;
  color?: string;
}

export interface RecordingNote {
  id: string;
  recordingId: string;
  timestamp?: number;
  content: string;
}

export const recordings = {
  list: (token: string, subjectId?: string) =>
    request<AudioRecording[]>(`/recordings${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  get: (token: string, id: string) =>
    request<AudioRecording>(`/recordings/${id}`, { token }),

  create: (token: string, data: { title: string; fileUrl: string; fileName: string; fileSize: number; mimeType: string; duration: number; subjectId?: string; description?: string; location?: string; professorName?: string; tags?: string[] }) =>
    request<AudioRecording>('/recordings', { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: Partial<AudioRecording>) =>
    request<AudioRecording>(`/recordings/${id}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, id: string) =>
    request<void>(`/recordings/${id}`, { method: 'DELETE', token }),

  toggleFavorite: (token: string, id: string) =>
    request<AudioRecording>(`/recordings/${id}/favorite`, { method: 'POST', token }),

  // Bookmarks
  addBookmark: (token: string, recordingId: string, data: { timestamp: number; label: string; color?: string }) =>
    request<RecordingBookmark>(`/recordings/${recordingId}/bookmarks`, { method: 'POST', body: data, token }),

  deleteBookmark: (token: string, recordingId: string, bookmarkId: string) =>
    request<void>(`/recordings/${recordingId}/bookmarks/${bookmarkId}`, { method: 'DELETE', token }),

  // Notes
  addNote: (token: string, recordingId: string, data: { content: string; timestamp?: number }) =>
    request<RecordingNote>(`/recordings/${recordingId}/notes`, { method: 'POST', body: data, token }),

  updateNote: (token: string, recordingId: string, noteId: string, data: { content: string }) =>
    request<RecordingNote>(`/recordings/${recordingId}/notes/${noteId}`, { method: 'PATCH', body: data, token }),

  deleteNote: (token: string, recordingId: string, noteId: string) =>
    request<void>(`/recordings/${recordingId}/notes/${noteId}`, { method: 'DELETE', token }),

  // Transcription
  transcribe: (token: string, id: string) =>
    request<{ transcriptionId: string }>(`/recordings/${id}/transcribe`, { method: 'POST', token }),
};

// ============================================
// WRITING ASSISTANT ENDPOINTS
// ============================================

export interface WritingDocument {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  content: string;
  type: 'ESSAY' | 'REPORT' | 'THESIS' | 'SUMMARY' | 'REVIEW' | 'LAB_REPORT' | 'RESEARCH_PAPER' | 'PRESENTATION' | 'OTHER';
  templateId?: string;
  wordCount: number;
  targetWords?: number;
  language: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'FINAL' | 'SUBMITTED';
  grammarScore?: number;
  styleScore?: number;
  plagiarismScore?: number;
  suggestions?: { type: string; message: string; position?: { start: number; end: number } }[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritingTemplate {
  id: string;
  name: string;
  description?: string;
  type: WritingDocument['type'];
  content: string;
  structure?: { section: string; description: string }[];
  isSystem: boolean;
}

export const writing = {
  list: (token: string, subjectId?: string) =>
    request<WritingDocument[]>(`/writing${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  get: (token: string, id: string) =>
    request<WritingDocument>(`/writing/${id}`, { token }),

  create: (token: string, data: { title: string; content?: string; type?: WritingDocument['type']; subjectId?: string; templateId?: string; targetWords?: number }) =>
    request<WritingDocument>('/writing', { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: Partial<WritingDocument>) =>
    request<WritingDocument>(`/writing/${id}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, id: string) =>
    request<void>(`/writing/${id}`, { method: 'DELETE', token }),

  // Templates
  getTemplates: (token: string) =>
    request<WritingTemplate[]>('/writing/templates', { token }),

  // AI Analysis
  analyze: (token: string, id: string) =>
    request<{ grammarScore: number; styleScore: number; suggestions: WritingDocument['suggestions'] }>(`/writing/${id}/analyze`, { method: 'POST', token }),

  improve: (token: string, id: string, prompt?: string) =>
    request<{ improvedContent: string; changes: string[] }>(`/writing/${id}/improve`, { method: 'POST', body: { prompt }, token }),

  checkPlagiarism: (token: string, id: string) =>
    request<{ plagiarismScore: number; matches: { source: string; similarity: number; excerpt: string }[] }>(`/writing/${id}/plagiarism-check`, { method: 'POST', token }),

  // Version History
  getHistory: (token: string, id: string) =>
    request<{ id: string; content: string; version: number; wordCount: number; createdAt: string }[]>(`/writing/${id}/history`, { token }),

  restoreVersion: (token: string, id: string, version: number) =>
    request<WritingDocument>(`/writing/${id}/restore/${version}`, { method: 'POST', token }),
};

// ============================================
// WELLNESS ENDPOINTS
// ============================================

export interface WellnessLog {
  id: string;
  userId: string;
  date: string;
  sleepHours?: number;
  sleepQuality?: number;
  moodScore?: number;
  stressLevel?: number;
  energyLevel?: number;
  exerciseMinutes?: number;
  meditationMinutes?: number;
  breaksCount?: number;
  notes?: string;
  gratitude: string[];
}

export interface BreakReminder {
  id: string;
  userId: string;
  isEnabled: boolean;
  intervalMinutes: number;
  breakMinutes: number;
  startTime: string;
  endTime: string;
  activeDays: number[];
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

export interface WellnessTip {
  id: string;
  title: string;
  content: string;
  category: 'STRESS' | 'SLEEP' | 'EXERCISE' | 'MINDFULNESS' | 'NUTRITION' | 'SOCIAL' | 'STUDY_HABITS' | 'MOTIVATION';
  icon?: string;
}

export const wellness = {
  // Daily Logs
  getLogs: (token: string, startDate?: string, endDate?: string) =>
    request<WellnessLog[]>(`/wellness/logs${startDate ? `?startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`, { token }),

  getLog: (token: string, date: string) =>
    request<WellnessLog>(`/wellness/logs/${date}`, { token }),

  createLog: (token: string, data: Partial<WellnessLog>) =>
    request<WellnessLog>('/wellness/logs', { method: 'POST', body: data, token }),

  updateLog: (token: string, date: string, data: Partial<WellnessLog>) =>
    request<WellnessLog>(`/wellness/logs/${date}`, { method: 'PATCH', body: data, token }),

  // Break Reminders
  getBreakReminder: (token: string) =>
    request<BreakReminder>('/wellness/break-reminder', { token }),

  updateBreakReminder: (token: string, data: Partial<BreakReminder>) =>
    request<BreakReminder>('/wellness/break-reminder', { method: 'PATCH', body: data, token }),

  // Tips
  getTips: (token: string, category?: WellnessTip['category']) =>
    request<WellnessTip[]>(`/wellness/tips${category ? `?category=${category}` : ''}`, { token }),

  getDailyTip: (token: string) =>
    request<WellnessTip>('/wellness/tips/daily', { token }),

  // Stats
  getStats: (token: string, period?: 'week' | 'month' | 'year') =>
    request<{ averageSleep: number; averageMood: number; averageStress: number; streak: number; totalExerciseMinutes: number; totalMeditationMinutes: number }>(`/wellness/stats${period ? `?period=${period}` : ''}`, { token }),
};

// ============================================
// CAREER ENDPOINTS
// ============================================

export interface UserCV {
  id: string;
  userId: string;
  fullName: string;
  title?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  photoUrl?: string;
  education: CVEducation[];
  experience: CVExperience[];
  skills: CVSkill[];
  projects: CVProject[];
  certifications: CVCertification[];
  languages: CVLanguage[];
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  gpa?: number;
  description?: string;
}

export interface CVExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  highlights: string[];
}

export interface CVSkill {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category?: string;
}

export interface CVProject {
  id: string;
  name: string;
  description?: string;
  url?: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
  highlights: string[];
}

export interface CVCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface CVLanguage {
  id: string;
  name: string;
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'FLUENT' | 'NATIVE';
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location?: string;
  isRemote: boolean;
  type: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'FREELANCE' | 'CONTRACT';
  description: string;
  requirements: string[];
  benefits: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  career?: string;
  minYear?: number;
  skills: string[];
  applyUrl?: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobId: string;
  status: 'SAVED' | 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'ACCEPTED' | 'WITHDRAWN';
  coverLetter?: string;
  notes?: string;
  appliedAt: string;
  job: JobPosting;
  interviews: Interview[];
}

export interface Interview {
  id: string;
  applicationId: string;
  type: 'PHONE' | 'VIDEO' | 'IN_PERSON' | 'TECHNICAL' | 'HR' | 'FINAL';
  scheduledAt: string;
  duration?: number;
  location?: string;
  notes?: string;
  questions: string[];
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  feedback?: string;
  rating?: number;
}

export const career = {
  // CV
  getCV: (token: string) =>
    request<UserCV>('/career/cv', { token }),

  createCV: (token: string, data: Partial<UserCV>) =>
    request<UserCV>('/career/cv', { method: 'POST', body: data, token }),

  updateCV: (token: string, data: Partial<UserCV>) =>
    request<UserCV>('/career/cv', { method: 'PATCH', body: data, token }),

  exportCV: (token: string, format: 'pdf' | 'docx') =>
    request<Blob>(`/career/cv/export?format=${format}`, { token }),

  // CV Sections
  addEducation: (token: string, data: Omit<CVEducation, 'id'>) =>
    request<CVEducation>('/career/cv/education', { method: 'POST', body: data, token }),

  updateEducation: (token: string, id: string, data: Partial<CVEducation>) =>
    request<CVEducation>(`/career/cv/education/${id}`, { method: 'PATCH', body: data, token }),

  deleteEducation: (token: string, id: string) =>
    request<void>(`/career/cv/education/${id}`, { method: 'DELETE', token }),

  addExperience: (token: string, data: Omit<CVExperience, 'id'>) =>
    request<CVExperience>('/career/cv/experience', { method: 'POST', body: data, token }),

  updateExperience: (token: string, id: string, data: Partial<CVExperience>) =>
    request<CVExperience>(`/career/cv/experience/${id}`, { method: 'PATCH', body: data, token }),

  deleteExperience: (token: string, id: string) =>
    request<void>(`/career/cv/experience/${id}`, { method: 'DELETE', token }),

  addSkill: (token: string, data: Omit<CVSkill, 'id'>) =>
    request<CVSkill>('/career/cv/skills', { method: 'POST', body: data, token }),

  deleteSkill: (token: string, id: string) =>
    request<void>(`/career/cv/skills/${id}`, { method: 'DELETE', token }),

  addProject: (token: string, data: Omit<CVProject, 'id'>) =>
    request<CVProject>('/career/cv/projects', { method: 'POST', body: data, token }),

  updateProject: (token: string, id: string, data: Partial<CVProject>) =>
    request<CVProject>(`/career/cv/projects/${id}`, { method: 'PATCH', body: data, token }),

  deleteProject: (token: string, id: string) =>
    request<void>(`/career/cv/projects/${id}`, { method: 'DELETE', token }),

  // Jobs
  getJobs: (token: string, filters?: { career?: string; type?: string; remote?: boolean; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.career) params.append('career', filters.career);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.remote) params.append('remote', 'true');
    if (filters?.search) params.append('search', filters.search);
    return request<JobPosting[]>(`/career/jobs?${params.toString()}`, { token });
  },

  getJob: (token: string, id: string) =>
    request<JobPosting>(`/career/jobs/${id}`, { token }),

  // Applications
  getApplications: (token: string, status?: JobApplication['status']) =>
    request<JobApplication[]>(`/career/applications${status ? `?status=${status}` : ''}`, { token }),

  applyToJob: (token: string, jobId: string, data: { coverLetter?: string }) =>
    request<JobApplication>(`/career/jobs/${jobId}/apply`, { method: 'POST', body: data, token }),

  updateApplication: (token: string, id: string, data: Partial<JobApplication>) =>
    request<JobApplication>(`/career/applications/${id}`, { method: 'PATCH', body: data, token }),

  withdrawApplication: (token: string, id: string) =>
    request<void>(`/career/applications/${id}/withdraw`, { method: 'POST', token }),

  // Interviews
  getInterviews: (token: string) =>
    request<Interview[]>('/career/interviews', { token }),

  addInterview: (token: string, applicationId: string, data: Omit<Interview, 'id' | 'applicationId' | 'status'>) =>
    request<Interview>(`/career/applications/${applicationId}/interviews`, { method: 'POST', body: data, token }),

  updateInterview: (token: string, id: string, data: Partial<Interview>) =>
    request<Interview>(`/career/interviews/${id}`, { method: 'PATCH', body: data, token }),

  getInterviewPrep: (token: string, id: string) =>
    request<{ questions: string[]; tips: string[]; companyInfo: string }>(`/career/interviews/${id}/prep`, { token }),
};

// ============================================
// TOOLS ENDPOINTS
// ============================================

export interface FormulaSheet {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  formulas: Formula[];
  createdAt: string;
}

export interface Formula {
  id: string;
  sheetId: string;
  name: string;
  latex: string;
  description?: string;
  variables?: Record<string, string>;
  example?: string;
  tags: string[];
}

export interface CodeSnippet {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  isPublic: boolean;
  isExecutable: boolean;
  lastOutput?: string;
  createdAt: string;
}

export const tools = {
  // Formula Sheets
  getFormulaSheets: (token: string, subjectId?: string) =>
    request<FormulaSheet[]>(`/tools/formula-sheets${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),

  getFormulaSheet: (token: string, id: string) =>
    request<FormulaSheet>(`/tools/formula-sheets/${id}`, { token }),

  createFormulaSheet: (token: string, data: { title: string; description?: string; category?: string; subjectId?: string; isPublic?: boolean }) =>
    request<FormulaSheet>('/tools/formula-sheets', { method: 'POST', body: data, token }),

  updateFormulaSheet: (token: string, id: string, data: Partial<FormulaSheet>) =>
    request<FormulaSheet>(`/tools/formula-sheets/${id}`, { method: 'PATCH', body: data, token }),

  deleteFormulaSheet: (token: string, id: string) =>
    request<void>(`/tools/formula-sheets/${id}`, { method: 'DELETE', token }),

  // Formulas
  addFormula: (token: string, sheetId: string, data: Omit<Formula, 'id' | 'sheetId'>) =>
    request<Formula>(`/tools/formula-sheets/${sheetId}/formulas`, { method: 'POST', body: data, token }),

  updateFormula: (token: string, sheetId: string, formulaId: string, data: Partial<Formula>) =>
    request<Formula>(`/tools/formula-sheets/${sheetId}/formulas/${formulaId}`, { method: 'PATCH', body: data, token }),

  deleteFormula: (token: string, sheetId: string, formulaId: string) =>
    request<void>(`/tools/formula-sheets/${sheetId}/formulas/${formulaId}`, { method: 'DELETE', token }),

  // Code Snippets
  getCodeSnippets: (token: string, language?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (language) params.append('language', language);
    if (subjectId) params.append('subjectId', subjectId);
    return request<CodeSnippet[]>(`/tools/code-snippets?${params.toString()}`, { token });
  },

  getCodeSnippet: (token: string, id: string) =>
    request<CodeSnippet>(`/tools/code-snippets/${id}`, { token }),

  createCodeSnippet: (token: string, data: { title: string; code: string; language: string; description?: string; subjectId?: string; tags?: string[]; isPublic?: boolean }) =>
    request<CodeSnippet>('/tools/code-snippets', { method: 'POST', body: data, token }),

  updateCodeSnippet: (token: string, id: string, data: Partial<CodeSnippet>) =>
    request<CodeSnippet>(`/tools/code-snippets/${id}`, { method: 'PATCH', body: data, token }),

  deleteCodeSnippet: (token: string, id: string) =>
    request<void>(`/tools/code-snippets/${id}`, { method: 'DELETE', token }),

  executeCodeSnippet: (token: string, id: string) =>
    request<{ output: string; error?: string; executionTime: number }>(`/tools/code-snippets/${id}/execute`, { method: 'POST', token }),

  // Public/Community
  getPublicFormulaSheets: (token: string, category?: string) =>
    request<FormulaSheet[]>(`/tools/public/formula-sheets${category ? `?category=${category}` : ''}`, { token }),

  getPublicCodeSnippets: (token: string, language?: string) =>
    request<CodeSnippet[]>(`/tools/public/code-snippets${language ? `?language=${language}` : ''}`, { token }),
};

// ============================================
// GOALS ENDPOINTS
// ============================================

export type GoalType = 'STUDY_HOURS' | 'FLASHCARDS_REVIEW' | 'QUIZZES_COMPLETE' | 'PAGES_READ' | 'POMODOROS' | 'TASKS_COMPLETE' | 'CUSTOM';
export type GoalUnit = 'HOURS' | 'MINUTES' | 'COUNT' | 'PAGES' | 'PERCENTAGE';
export type GoalPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'CUSTOM';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';

export interface GoalProgress {
  id: string;
  goalId: string;
  value: number;
  notes?: string;
  date: string;
}

export interface StudyGoal {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unit: GoalUnit;
  periodType: GoalPeriod;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  reminderEnabled: boolean;
  reminderTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; color?: string };
  progress?: GoalProgress[];
}

export interface GoalSuggestion {
  type: GoalType;
  title: string;
  description: string;
  targetValue: number;
  unit: GoalUnit;
  periodType: GoalPeriod;
  reason: string;
}

export const goals = {
  list: (token: string, filters?: { status?: GoalStatus; type?: GoalType; subjectId?: string; periodType?: GoalPeriod }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.periodType) params.append('periodType', filters.periodType);
    return request<StudyGoal[]>(`/goals?${params.toString()}`, { token });
  },

  get: (token: string, id: string) =>
    request<StudyGoal>(`/goals/${id}`, { token }),

  getActive: (token: string) =>
    request<StudyGoal[]>('/goals/active', { token }),

  getSuggestions: (token: string) =>
    request<GoalSuggestion[]>('/goals/suggestions', { token }),

  create: (token: string, data: {
    title: string;
    description?: string;
    type: GoalType;
    targetValue: number;
    unit: GoalUnit;
    subjectId?: string;
    periodType?: GoalPeriod;
    startDate: string;
    endDate: string;
    reminderEnabled?: boolean;
    reminderTime?: string;
  }) => request<StudyGoal>('/goals', { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: Partial<{
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    status: GoalStatus;
    reminderEnabled: boolean;
    reminderTime: string;
  }>) => request<StudyGoal>(`/goals/${id}`, { method: 'PATCH', body: data, token }),

  addProgress: (token: string, id: string, data: { value: number; notes?: string }) =>
    request<StudyGoal>(`/goals/${id}/progress`, { method: 'POST', body: data, token }),

  delete: (token: string, id: string) =>
    request<void>(`/goals/${id}`, { method: 'DELETE', token }),
};

// ============================================
// TASKS ENDPOINTS
// ============================================

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Task {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  reminderAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; color?: string };
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export const tasks = {
  list: (token: string, filters?: { subjectId?: string; status?: TaskStatus; priority?: TaskPriority; dueBefore?: string; dueAfter?: string }) => {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.dueBefore) params.append('dueBefore', filters.dueBefore);
    if (filters?.dueAfter) params.append('dueAfter', filters.dueAfter);
    return request<Task[]>(`/tasks?${params.toString()}`, { token });
  },

  get: (token: string, id: string) =>
    request<Task>(`/tasks/${id}`, { token }),

  getUpcoming: (token: string, days?: number) =>
    request<Task[]>(`/tasks/upcoming${days ? `?days=${days}` : ''}`, { token }),

  getOverdue: (token: string) =>
    request<Task[]>('/tasks/overdue', { token }),

  getStats: (token: string) =>
    request<TaskStats>('/tasks/stats', { token }),

  create: (token: string, data: {
    title: string;
    description?: string;
    subjectId?: string;
    dueDate?: string;
    priority?: TaskPriority;
    reminderAt?: string;
    tags?: string[];
  }) => request<Task>('/tasks', { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: Partial<{
    title: string;
    description: string;
    subjectId: string;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
    reminderAt: string;
    tags: string[];
  }>) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: data, token }),

  complete: (token: string, id: string) =>
    request<Task>(`/tasks/${id}/complete`, { method: 'PATCH', token }),

  delete: (token: string, id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE', token }),

  bulkUpdateStatus: (token: string, ids: string[], status: TaskStatus) =>
    request<{ updated: number }>('/tasks/bulk/status', { method: 'PATCH', body: { ids, status }, token }),

  bulkDelete: (token: string, ids: string[]) =>
    request<{ deleted: number }>('/tasks/bulk', { method: 'DELETE', body: { ids }, token }),
};

// ============================================
// STUDY SESSIONS ENDPOINTS
// ============================================

export type StudySessionType = 'POMODORO' | 'DEEP_WORK' | 'EXAM_MODE' | 'CUSTOM';
export type StudySessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  type: StudySessionType;
  status: StudySessionStatus;
  targetMinutes: number;
  actualMinutes: number;
  breakMinutes: number;
  focusScore?: number;
  notes?: string;
  startedAt: string;
  endedAt?: string;
  pausedAt?: string;
  subject?: { id: string; name: string; color?: string };
}

export interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  averageFocusScore: number;
  completionRate: number;
  mostProductiveHour: number;
  longestStreak: number;
}

export interface DayStats {
  sessions: number;
  minutes: number;
  focusScore: number;
}

export const studySessions = {
  start: (token: string, data: {
    subjectId?: string;
    type?: StudySessionType;
    targetMinutes?: number;
    breakMinutes?: number;
  }) => request<StudySession>('/study-sessions/start', { method: 'POST', body: data, token }),

  end: (token: string, id: string, data?: { focusScore?: number; notes?: string }) =>
    request<StudySession>(`/study-sessions/${id}/end`, { method: 'PATCH', body: data || {}, token }),

  pause: (token: string, id: string) =>
    request<StudySession>(`/study-sessions/${id}/pause`, { method: 'PATCH', token }),

  resume: (token: string, id: string) =>
    request<StudySession>(`/study-sessions/${id}/resume`, { method: 'PATCH', token }),

  abandon: (token: string, id: string) =>
    request<StudySession>(`/study-sessions/${id}/abandon`, { method: 'PATCH', token }),

  getActive: (token: string) =>
    request<StudySession | null>('/study-sessions/active', { token }),

  getHistory: (token: string, filters?: { subjectId?: string; type?: StudySessionType; startDate?: string; endDate?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    return request<StudySession[]>(`/study-sessions/history?${params.toString()}`, { token });
  },

  getStats: (token: string, filters?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    return request<SessionStats>(`/study-sessions/stats?${params.toString()}`, { token });
  },

  getTodayStats: (token: string) =>
    request<DayStats>('/study-sessions/stats/today', { token }),

  getWeekStats: (token: string) =>
    request<DayStats[]>('/study-sessions/stats/week', { token }),
};

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

export interface DashboardStats {
  totalStudyTime: number;
  weeklyStudyTime: number;
  flashcardsReviewed: number;
  quizzesTaken: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}

export interface StudyTimeData {
  date: string;
  minutes: number;
}

export interface SubjectDistribution {
  subjectId: string;
  subjectName: string;
  color: string;
  minutes: number;
  percentage: number;
}

export interface FlashcardAnalytics {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  reviewsDue: number;
  averageRetention: number;
}

export interface QuizAnalytics {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalQuestions: number;
  correctAnswers: number;
  bySubject: { subjectId: string; subjectName: string; averageScore: number; count: number }[];
}

export interface ProgressPrediction {
  currentProgress: number;
  predictedProgress: number;
  estimatedCompletionDate: string;
  confidence: number;
  recommendations: string[];
}

export const analytics = {
  getDashboard: (token: string) =>
    request<DashboardStats>('/analytics/dashboard', { token }),

  getStudyTimeChart: (token: string, days?: number) =>
    request<StudyTimeData[]>(`/analytics/study-time${days ? `?days=${days}` : ''}`, { token }),

  getSubjectDistribution: (token: string) =>
    request<SubjectDistribution[]>('/analytics/subject-distribution', { token }),

  getFlashcardStats: (token: string) =>
    request<FlashcardAnalytics>('/analytics/flashcards', { token }),

  getQuizStats: (token: string) =>
    request<QuizAnalytics>('/analytics/quizzes', { token }),

  getProgressPrediction: (token: string, subjectId?: string) =>
    request<ProgressPrediction>(`/analytics/prediction${subjectId ? `?subjectId=${subjectId}` : ''}`, { token }),
};

// ============================================
// NOTIFICATIONS ENDPOINTS
// ============================================

export interface NotificationPreferences {
  email: {
    studyReminders: boolean;
    weeklyDigest: boolean;
    achievements: boolean;
    streakWarnings: boolean;
    marketing: boolean;
  };
  push: {
    studyReminders: boolean;
    achievements: boolean;
    streakWarnings: boolean;
    comments: boolean;
    calendarEvents: boolean;
  };
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const notifications = {
  getVapidKey: () =>
    request<{ publicKey: string; enabled: boolean }>('/notifications/push/vapid-key', {}),

  subscribePush: (token: string, subscription: PushSubscription) =>
    request<{ success: boolean; message: string }>('/notifications/push/subscribe', { method: 'POST', body: subscription, token }),

  unsubscribePush: (token: string, endpoint: string) =>
    request<{ success: boolean; message: string }>('/notifications/push/unsubscribe', { method: 'POST', body: { endpoint }, token }),

  getPushStatus: (token: string) =>
    request<{ subscribed: boolean; enabled: boolean }>('/notifications/push/status', { token }),

  sendTestPush: (token: string) =>
    request<{ success: boolean; sent: number; message: string }>('/notifications/push/test', { method: 'POST', token }),

  sendTestEmail: (token: string, template: 'welcome' | 'study-reminder' | 'achievement-unlocked' | 'weekly-summary') =>
    request<{ success: boolean; message: string }>('/notifications/email/test', { method: 'POST', body: { template }, token }),

  getPreferences: (token: string) =>
    request<NotificationPreferences>('/notifications/preferences', { token }),

  updatePreferences: (token: string, preferences: Partial<NotificationPreferences>) =>
    request<{ success: boolean; message: string; preferences: NotificationPreferences }>('/notifications/preferences', { method: 'POST', body: preferences, token }),
};

// ============================================
// SOCIAL/COMMUNITY ENDPOINTS
// ============================================

export interface ProfessorReview {
  id: string;
  userId: string;
  professorId: string;
  overallRating: number;
  difficultyRating: number;
  clarityRating: number;
  helpfulnessRating: number;
  courseName?: string;
  grade?: string;
  wouldTakeAgain: boolean;
  comment?: string;
  tags: string[];
  isAnonymous: boolean;
  createdAt: string;
  professor?: { id: string; name: string; email?: string };
}

export interface StudyBuddyMatch {
  id: string;
  userId1: string;
  userId2: string;
  commonSubjects: string[];
  matchScore: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  initiatedBy: string;
  user?: { id: string; profile: { firstName: string; lastName: string; university?: string; career?: string } };
}

export interface StudyBuddyPreferences {
  id: string;
  userId: string;
  isSearching: boolean;
  subjects: string[];
  studyStyle: 'FORMAL' | 'PRACTICAL' | 'BALANCED';
  sameUniversity: boolean;
  sameCareer: boolean;
  sameYear: boolean;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  type: 'BOOK' | 'NOTES' | 'CALCULATOR' | 'EQUIPMENT' | 'TUTORING_SERVICE' | 'OTHER';
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  price: number;
  currency: string;
  isNegotiable: boolean;
  category?: string;
  isbn?: string;
  author?: string;
  edition?: string;
  images: string[];
  location?: string;
  isDelivery: boolean;
  isPickup: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'RESERVED' | 'EXPIRED' | 'DELETED';
  viewCount: number;
  createdAt: string;
  seller?: { id: string; profile: { firstName: string; lastName: string } };
}

export interface SharedFlashcardDeck {
  id: string;
  deckId: string;
  userId: string;
  title: string;
  description?: string;
  tags: string[];
  subject?: string;
  university?: string;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
}

export const social = {
  // Professor Reviews
  getProfessorReviews: (token: string, professorId: string) =>
    request<ProfessorReview[]>(`/social/professors/${professorId}/reviews`, { token }),

  createProfessorReview: (token: string, professorId: string, data: Omit<ProfessorReview, 'id' | 'userId' | 'professorId' | 'createdAt' | 'professor'>) =>
    request<ProfessorReview>(`/social/professors/${professorId}/reviews`, { method: 'POST', body: data, token }),

  getProfessorStats: (token: string, professorId: string) =>
    request<{ averageRating: number; averageDifficulty: number; totalReviews: number; wouldTakeAgainPercent: number; topTags: string[] }>(`/social/professors/${professorId}/stats`, { token }),

  // Study Buddy
  getBuddyPreferences: (token: string) =>
    request<StudyBuddyPreferences>('/social/buddies/preferences', { token }),

  updateBuddyPreferences: (token: string, data: Partial<StudyBuddyPreferences>) =>
    request<StudyBuddyPreferences>('/social/buddies/preferences', { method: 'PATCH', body: data, token }),

  findBuddyMatches: (token: string) =>
    request<StudyBuddyMatch[]>('/social/buddies/matches', { token }),

  respondToMatch: (token: string, matchId: string, action: 'accept' | 'reject' | 'block') =>
    request<StudyBuddyMatch>(`/social/buddies/matches/${matchId}/${action}`, { method: 'POST', token }),

  // Marketplace
  getMarketplaceListings: (token: string, filters?: { type?: string; minPrice?: number; maxPrice?: number; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.search) params.append('search', filters.search);
    return request<MarketplaceListing[]>(`/social/marketplace?${params.toString()}`, { token });
  },

  getMyListings: (token: string) =>
    request<MarketplaceListing[]>('/social/marketplace/mine', { token }),

  getListing: (token: string, id: string) =>
    request<MarketplaceListing>(`/social/marketplace/${id}`, { token }),

  createListing: (token: string, data: Omit<MarketplaceListing, 'id' | 'sellerId' | 'viewCount' | 'createdAt' | 'seller'>) =>
    request<MarketplaceListing>('/social/marketplace', { method: 'POST', body: data, token }),

  updateListing: (token: string, id: string, data: Partial<MarketplaceListing>) =>
    request<MarketplaceListing>(`/social/marketplace/${id}`, { method: 'PATCH', body: data, token }),

  deleteListing: (token: string, id: string) =>
    request<void>(`/social/marketplace/${id}`, { method: 'DELETE', token }),

  sendMessage: (token: string, listingId: string, content: string) =>
    request<{ id: string; content: string; createdAt: string }>(`/social/marketplace/${listingId}/message`, { method: 'POST', body: { content }, token }),

  // Shared Flashcard Decks
  getSharedDecks: (token: string, subject?: string) =>
    request<SharedFlashcardDeck[]>(`/social/shared-decks${subject ? `?subject=${subject}` : ''}`, { token }),

  shareDeck: (token: string, deckId: string, data: { title: string; description?: string; tags?: string[]; subject?: string }) =>
    request<SharedFlashcardDeck>(`/social/decks/${deckId}/share`, { method: 'POST', body: data, token }),

  downloadSharedDeck: (token: string, sharedDeckId: string) =>
    request<{ deckId: string }>(`/social/shared-decks/${sharedDeckId}/download`, { method: 'POST', token }),

  rateDeck: (token: string, sharedDeckId: string, rating: number, comment?: string) =>
    request<void>(`/social/shared-decks/${sharedDeckId}/rate`, { method: 'POST', body: { rating, comment }, token }),
};

// ============================================
// MIND MAPS API
// ============================================

export interface MindMapNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  color?: string;
  shape?: string;
  parentId?: string;
}

export interface MindMapEdge {
  source: string;
  target: string;
  label?: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  rootId?: string;
  layout?: string;
}

export interface MindMap {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  data: MindMapData;
  thumbnail?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    color?: string;
  };
}

export interface CreateMindMapInput {
  title: string;
  description?: string;
  subjectId?: string;
  data: MindMapData;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateMindMapInput {
  title?: string;
  description?: string;
  subjectId?: string;
  data?: MindMapData;
  tags?: string[];
  isPublic?: boolean;
  thumbnail?: string;
}

export interface MindMapStats {
  total: number;
  public: number;
  private: number;
  bySubject: { subjectId: string; subjectName: string; count: number }[];
}

const mindmaps = {
  getAll: (token: string, options?: { subjectId?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (options?.subjectId) params.append('subjectId', options.subjectId);
    if (options?.search) params.append('search', options.search);
    const query = params.toString();
    return request<MindMap[]>(`/mindmaps${query ? `?${query}` : ''}`, { token });
  },

  getPublic: (token: string, options?: { search?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    const query = params.toString();
    return request<MindMap[]>(`/mindmaps/public${query ? `?${query}` : ''}`, { token });
  },

  getStats: (token: string) =>
    request<MindMapStats>('/mindmaps/stats', { token }),

  getOne: (token: string, id: string) =>
    request<MindMap>(`/mindmaps/${id}`, { token }),

  create: (token: string, data: CreateMindMapInput) =>
    request<MindMap>('/mindmaps', { method: 'POST', body: data, token }),

  update: (token: string, id: string, data: UpdateMindMapInput) =>
    request<MindMap>(`/mindmaps/${id}`, { method: 'PATCH', body: data, token }),

  delete: (token: string, id: string) =>
    request<void>(`/mindmaps/${id}`, { method: 'DELETE', token }),

  duplicate: (token: string, id: string) =>
    request<MindMap>(`/mindmaps/${id}/duplicate`, { method: 'POST', token }),
};

// ============================================
// IMPORT/EXPORT API
// ============================================

export type ImportType = 'flashcards' | 'notes' | 'tasks' | 'mindmaps' | 'resources' | 'calendar';
export type ImportFormat = 'csv' | 'json' | 'markdown' | 'anki' | 'quizlet' | 'notion' | 'ical';

export interface FlashcardImportItem {
  front: string;
  back: string;
  tags?: string[];
  formula?: string;
}

export interface TaskImportItem {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
}

export interface ImportFlashcardsInput {
  deckId?: string;
  deckName?: string;
  subjectId?: string;
  cards: FlashcardImportItem[];
}

export interface ImportTasksInput {
  subjectId?: string;
  tasks: TaskImportItem[];
}

export interface ImportDataInput {
  type: ImportType;
  format: ImportFormat;
  subjectId?: string;
  deckId?: string;
  content: string;
  columnMapping?: Record<string, string>;
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
  createdIds?: string[];
}

export interface ExportDataInput {
  type: ImportType;
  format: 'csv' | 'json';
  subjectId?: string;
  deckId?: string;
}

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ImportTemplate {
  headers: string[];
  example: Record<string, string>[];
}

const importExport = {
  parseCsv: (token: string, content: string, delimiter?: string, hasHeader?: boolean) =>
    request<ParsedCsv>('/import/parse-csv', {
      method: 'POST',
      body: { content, delimiter, hasHeader },
      token,
    }),

  importFlashcards: (token: string, data: ImportFlashcardsInput) =>
    request<ImportResult>('/import/flashcards', { method: 'POST', body: data, token }),

  importTasks: (token: string, data: ImportTasksInput) =>
    request<ImportResult>('/import/tasks', { method: 'POST', body: data, token }),

  importData: (token: string, data: ImportDataInput) =>
    request<ImportResult>('/import/data', { method: 'POST', body: data, token }),

  exportData: async (token: string, data: ExportDataInput): Promise<Blob> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/import/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Error exporting data');
    }
    return response.blob();
  },

  getTemplates: (token: string) =>
    request<Record<string, ImportTemplate>>('/import/templates', { token }),
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
  ocr,
  forums,
  tutoring,
  bibliography,
  studyPlans,
  transcription,
  videoSummary,
  emailReports,
  lms,
  integrations,
  calendarSync,
  grades,
  recordings,
  writing,
  wellness,
  career,
  tools,
  goals,
  tasks,
  studySessions,
  analytics,
  notifications,
  social,
  mindmaps,
  importExport,
};

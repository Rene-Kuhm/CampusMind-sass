import { PlanType } from "@prisma/client";

export interface PlanLimits {
  // Subjects/Materias
  subjectsActive: number;

  // AI/RAG
  ragQueriesPerMonth: number; // Mensajes IA por mes
  documentsPerMonth: number; // Documentos para indexar por mes

  // Flashcards
  flashcardsTotal: number;

  // Quizzes
  quizzesPerMonth: number;

  // Storage
  storageMb: number;

  // Features booleanos
  aiSummaries: boolean;
  advancedMindMaps: boolean;
  studyGroups: boolean;
  leaderboard: boolean;
  gamification: boolean;
  achievements: boolean;
  calendarComplete: boolean;
  reminders: boolean;
  prioritySupport: boolean;
  exportData: boolean;
  betterModels: boolean; // Acceso a GPT-4o full, Llama grande, etc.
}

export interface PlanPricing {
  monthly: {
    ars: number; // Mercado Pago (Argentina)
    usd: number; // Lemonsqueezy (International)
  };
  yearly: {
    ars: number;
    usd: number;
  };
}

export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  limits: PlanLimits;
  pricing: PlanPricing;
  features: string[];
  popular?: boolean;
  badge?: string;
}

// =============================================
// PLAN CONFIGURATIONS
// =============================================

export const PLANS: Record<PlanType, PlanConfig> = {
  // =============================================
  // FREE - Gancho + Viralidad
  // =============================================
  [PlanType.FREE]: {
    id: PlanType.FREE,
    name: "Free",
    description: "Perfecto para empezar a estudiar",
    limits: {
      // Core limits
      subjectsActive: 3,
      ragQueriesPerMonth: 30, // ~1 consulta/día
      documentsPerMonth: 5,
      flashcardsTotal: 100,
      quizzesPerMonth: 5,
      storageMb: 50,

      // Features
      aiSummaries: false,
      advancedMindMaps: false,
      studyGroups: false,
      leaderboard: false,
      gamification: false,
      achievements: false,
      calendarComplete: false, // Solo vista básica
      reminders: false,
      prioritySupport: false,
      exportData: false,
      betterModels: false,
    },
    pricing: {
      monthly: { ars: 0, usd: 0 },
      yearly: { ars: 0, usd: 0 },
    },
    features: [
      "3 materias activas",
      "30 consultas IA/mes",
      "5 documentos para indexar/mes",
      "100 flashcards",
      "5 quizzes/mes",
      "50 MB almacenamiento",
      "Calendario básico",
    ],
  },

  // =============================================
  // PRO - Precio principal USD $9.99/mes
  // =============================================
  [PlanType.PRO]: {
    id: PlanType.PRO,
    name: "Pro",
    description: "Para estudiantes serios",
    popular: true,
    badge: "Más Popular",
    limits: {
      // Core limits - Significativamente más que FREE
      subjectsActive: -1, // Ilimitadas
      ragQueriesPerMonth: 500,
      documentsPerMonth: 50,
      flashcardsTotal: -1, // Sin límites duros
      quizzesPerMonth: -1, // Sin límites duros
      storageMb: 1000, // 1GB

      // Features
      aiSummaries: true,
      advancedMindMaps: false,
      studyGroups: false,
      leaderboard: false,
      gamification: false,
      achievements: false,
      calendarComplete: true,
      reminders: true,
      prioritySupport: false,
      exportData: true,
      betterModels: false,
    },
    pricing: {
      monthly: { ars: 9999, usd: 9.99 },
      yearly: { ars: 99990, usd: 99.99 }, // ~2 meses gratis
    },
    features: [
      "Materias ilimitadas",
      "500 consultas IA/mes",
      "50 documentos para indexar/mes",
      "Flashcards ilimitadas",
      "Quizzes ilimitados",
      "1 GB almacenamiento",
      "Calendario completo + recordatorios",
      "Resúmenes con IA",
      "Generación de quizzes/flashcards desde documentos",
      "Exportar datos",
    ],
  },

  // =============================================
  // PREMIUM - Para enfermos del estudio USD $14.99-17.99/mes
  // =============================================
  [PlanType.PREMIUM]: {
    id: PlanType.PREMIUM,
    name: "Premium",
    description: "Para los que van en serio",
    badge: "Todo Incluido",
    limits: {
      // Core limits - Casi ilimitado
      subjectsActive: -1,
      ragQueriesPerMonth: -1, // Casi ilimitado
      documentsPerMonth: -1,
      flashcardsTotal: -1,
      quizzesPerMonth: -1,
      storageMb: 10000, // 10GB

      // Features - TODO habilitado
      aiSummaries: true,
      advancedMindMaps: true,
      studyGroups: true,
      leaderboard: true,
      gamification: true,
      achievements: true,
      calendarComplete: true,
      reminders: true,
      prioritySupport: true,
      exportData: true,
      betterModels: true, // GPT-4o full, Llama 3.3 70B, etc.
    },
    pricing: {
      monthly: { ars: 14999, usd: 14.99 },
      yearly: { ars: 149990, usd: 149.99 }, // ~2 meses gratis
    },
    features: [
      "Todo lo de Pro, más:",
      "Consultas IA ilimitadas",
      "Documentos ilimitados",
      "10 GB almacenamiento",
      "Acceso a modelos premium (GPT-4o, Claude, etc.)",
      "Grupos de estudio colaborativos",
      "Leaderboard y competencias",
      "Gamificación y achievements",
      "Mapas mentales avanzados",
      "Soporte prioritario",
      "Acceso anticipado a nuevas features",
    ],
  },
};

export const TRIAL_DAYS = 7;

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const getPlanLimits = (plan: PlanType): PlanLimits => PLANS[plan].limits;

export const getPlanConfig = (plan: PlanType): PlanConfig => PLANS[plan];

/**
 * Check if current usage is within the plan limit
 * @param plan - The user's plan
 * @param usageType - The type of usage to check
 * @param currentUsage - Current usage count
 * @returns true if within limit, false if exceeded
 */
export const isWithinLimit = (
  plan: PlanType,
  usageType: keyof PlanLimits,
  currentUsage: number,
): boolean => {
  const limit = PLANS[plan].limits[usageType];
  if (typeof limit === "boolean") return limit;
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
};

/**
 * Get remaining usage for a specific limit
 * @param plan - The user's plan
 * @param usageType - The type of usage
 * @param currentUsage - Current usage count
 * @returns Remaining count or -1 for unlimited
 */
export const getRemainingUsage = (
  plan: PlanType,
  usageType: keyof PlanLimits,
  currentUsage: number,
): number => {
  const limit = PLANS[plan].limits[usageType];
  if (typeof limit === "boolean") return limit ? -1 : 0;
  if (limit === -1) return -1; // Unlimited
  return Math.max(0, limit - currentUsage);
};

/**
 * Check if a feature is available for a plan
 * @param plan - The user's plan
 * @param feature - The feature to check
 * @returns true if feature is available
 */
export const hasFeature = (
  plan: PlanType,
  feature: keyof PlanLimits,
): boolean => {
  const value = PLANS[plan].limits[feature];
  if (typeof value === "boolean") return value;
  return value !== 0;
};

/**
 * Get the percentage of usage for a limit
 * @param plan - The user's plan
 * @param usageType - The type of usage
 * @param currentUsage - Current usage count
 * @returns Percentage 0-100, or -1 for unlimited
 */
export const getUsagePercentage = (
  plan: PlanType,
  usageType: keyof PlanLimits,
  currentUsage: number,
): number => {
  const limit = PLANS[plan].limits[usageType];
  if (typeof limit === "boolean") return limit ? 0 : 100;
  if (limit === -1) return 0; // Unlimited = 0%
  return Math.min(100, Math.round((currentUsage / limit) * 100));
};

// =============================================
// USAGE TYPES ENUM (for tracking)
// =============================================

export enum UsageTypeEnum {
  RAG_QUERIES = "RAG_QUERIES",
  DOCUMENTS_INDEXED = "DOCUMENTS_INDEXED",
  FLASHCARDS = "FLASHCARDS",
  QUIZZES = "QUIZZES",
  STORAGE_MB = "STORAGE_MB",
  SUBJECTS = "SUBJECTS",
}

// Map usage types to plan limit keys
export const USAGE_TO_LIMIT_MAP: Record<UsageTypeEnum, keyof PlanLimits> = {
  [UsageTypeEnum.RAG_QUERIES]: "ragQueriesPerMonth",
  [UsageTypeEnum.DOCUMENTS_INDEXED]: "documentsPerMonth",
  [UsageTypeEnum.FLASHCARDS]: "flashcardsTotal",
  [UsageTypeEnum.QUIZZES]: "quizzesPerMonth",
  [UsageTypeEnum.STORAGE_MB]: "storageMb",
  [UsageTypeEnum.SUBJECTS]: "subjectsActive",
};

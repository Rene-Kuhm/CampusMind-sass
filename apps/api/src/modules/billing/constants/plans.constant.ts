import { PlanType } from '@prisma/client';

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
}

export const PLANS: Record<PlanType, PlanConfig> = {
  [PlanType.FREE]: {
    id: PlanType.FREE,
    name: 'Gratis',
    description: 'Perfecto para empezar',
    limits: {
      ragQueriesPerMonth: 20,
      flashcardsTotal: 100,
      storageMb: 50,
      subjectsActive: 2,
      quizzesPerMonth: 5,
      aiSummaries: false,
      prioritySupport: false,
      exportData: false,
    },
    pricing: {
      monthly: { ars: 0, usd: 0 },
      yearly: { ars: 0, usd: 0 },
    },
    features: [
      '20 consultas al copiloto/mes',
      '100 flashcards',
      '2 materias activas',
      '5 quizzes/mes',
      '50 MB almacenamiento',
    ],
  },
  [PlanType.PRO]: {
    id: PlanType.PRO,
    name: 'Pro',
    description: 'Para estudiantes serios',
    popular: true,
    limits: {
      ragQueriesPerMonth: 200,
      flashcardsTotal: 1000,
      storageMb: 500,
      subjectsActive: 10,
      quizzesPerMonth: 50,
      aiSummaries: true,
      prioritySupport: false,
      exportData: true,
    },
    pricing: {
      monthly: { ars: 4999, usd: 9 },
      yearly: { ars: 49990, usd: 90 }, // ~2 meses gratis
    },
    features: [
      '200 consultas al copiloto/mes',
      '1,000 flashcards',
      '10 materias activas',
      '50 quizzes/mes',
      '500 MB almacenamiento',
      'Resúmenes con IA',
      'Exportar datos',
    ],
  },
  [PlanType.PREMIUM]: {
    id: PlanType.PREMIUM,
    name: 'Premium',
    description: 'Sin límites para los mejores',
    limits: {
      ragQueriesPerMonth: -1, // Unlimited
      flashcardsTotal: -1,
      storageMb: 5000, // 5GB
      subjectsActive: -1,
      quizzesPerMonth: -1,
      aiSummaries: true,
      prioritySupport: true,
      exportData: true,
    },
    pricing: {
      monthly: { ars: 9999, usd: 19 },
      yearly: { ars: 99990, usd: 190 },
    },
    features: [
      'Consultas ilimitadas al copiloto',
      'Flashcards ilimitadas',
      'Materias ilimitadas',
      'Quizzes ilimitados',
      '5 GB almacenamiento',
      'Resúmenes con IA',
      'Soporte prioritario',
      'Exportar datos',
    ],
  },
};

export const TRIAL_DAYS = 7;

export const getPlanLimits = (plan: PlanType): PlanLimits => PLANS[plan].limits;

export const isWithinLimit = (
  plan: PlanType,
  usageType: keyof PlanLimits,
  currentUsage: number,
): boolean => {
  const limit = PLANS[plan].limits[usageType];
  if (typeof limit === 'boolean') return limit;
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
};

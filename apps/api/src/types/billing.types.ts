// Temporal types para solucionar problemas de TypeScript
// TODO: Eliminar cuando Prisma genere correctamente los tipos

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM'
}

export enum PaymentProvider {
  MERCADOPAGO = 'MERCADOPAGO',
  LEMONSQUEEZY = 'LEMONSQUEEZY'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAUSED = 'PAUSED'
}

export enum UsageType {
  RAG_QUERIES = 'RAG_QUERIES',
  FLASHCARDS = 'FLASHCARDS',
  STORAGE_MB = 'STORAGE_MB',
  SUBJECTS = 'SUBJECTS'
}
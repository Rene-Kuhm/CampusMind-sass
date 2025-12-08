import { Module, Global, DynamicModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { RateLimitGuard } from "./rate-limit.guard";

export interface ThrottleModuleOptions {
  /**
   * Time window in milliseconds (default: 60000 = 1 minute)
   */
  ttl?: number;

  /**
   * Maximum requests per time window (default: 100)
   */
  limit?: number;

  /**
   * Whether to skip certain routes
   */
  skipIf?: (context: any) => boolean;

  /**
   * Custom key generator
   */
  keyGenerator?: (context: any) => string;
}

// Rate limit tiers for different API operations
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 min
    REGISTER: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 registrations per hour
    PASSWORD_RESET: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 requests per hour
  },

  // AI/ML endpoints - expensive operations
  AI: {
    CHAT: { windowMs: 60 * 1000, max: 20 }, // 20 messages per minute
    GENERATE: { windowMs: 60 * 1000, max: 10 }, // 10 generations per minute
    SUMMARY: { windowMs: 60 * 1000, max: 5 }, // 5 summaries per minute
  },

  // Search endpoints
  SEARCH: {
    ACADEMIC: { windowMs: 60 * 1000, max: 30 }, // 30 searches per minute
    GENERAL: { windowMs: 60 * 1000, max: 60 }, // 60 searches per minute
  },

  // CRUD operations
  API: {
    READ: { windowMs: 60 * 1000, max: 100 }, // 100 reads per minute
    WRITE: { windowMs: 60 * 1000, max: 30 }, // 30 writes per minute
    DELETE: { windowMs: 60 * 1000, max: 10 }, // 10 deletes per minute
  },

  // File operations
  FILES: {
    UPLOAD: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 uploads per hour
    DOWNLOAD: { windowMs: 60 * 1000, max: 50 }, // 50 downloads per minute
  },

  // Export operations
  EXPORT: {
    PDF: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 exports per hour
  },
} as const;

// Subscription tier multipliers
export const TIER_MULTIPLIERS = {
  FREE: 1,
  PRO: 3,
  ENTERPRISE: 10,
} as const;

/**
 * Get rate limit based on user's subscription tier
 */
export function getRateLimitForTier(
  baseLimit: { windowMs: number; max: number },
  tier: keyof typeof TIER_MULTIPLIERS = "FREE",
): { windowMs: number; max: number } {
  const multiplier = TIER_MULTIPLIERS[tier];
  return {
    windowMs: baseLimit.windowMs,
    max: baseLimit.max * multiplier,
  };
}

@Global()
@Module({})
export class ThrottleModule {
  static forRoot(options: ThrottleModuleOptions = {}): DynamicModule {
    return {
      module: ThrottleModule,
      providers: [
        {
          provide: APP_GUARD,
          useClass: RateLimitGuard,
        },
        {
          provide: "THROTTLE_OPTIONS",
          useValue: options,
        },
      ],
      exports: ["THROTTLE_OPTIONS"],
    };
  }
}

// Helper decorator for applying specific rate limits
export function Throttle(
  category: keyof typeof RATE_LIMITS,
  operation: string,
) {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    const limits = (RATE_LIMITS as any)[category]?.[operation];
    if (limits) {
      Reflect.defineMetadata("rateLimit", limits, descriptor?.value || target);
    }
  };
}

// Skip rate limiting for internal/admin routes
export function SkipThrottle() {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata("skipThrottle", true, descriptor?.value || target);
  };
}

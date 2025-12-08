import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

/**
 * Custom throttle options metadata key
 */
export const THROTTLE_OPTIONS_KEY = 'throttle:options';

/**
 * Throttle options interface
 */
export interface ThrottleOptions {
  limit: number;
  ttl: number; // in milliseconds
  skipIf?: (context: ExecutionContext) => boolean;
}

/**
 * Enhanced Throttler Guard with custom rate limits per endpoint
 *
 * Default limits:
 * - General: 100 requests per minute
 * - Auth: 10 requests per minute (login, register)
 * - Search/AI: 20 requests per minute
 * - Heavy operations: 5 requests per minute
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    private readonly customReflector: Reflector,
  ) {
    super(options, storageService, customReflector);
  }

  /**
   * Get throttle config for the current request
   */
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Use IP address as tracker, or user ID if authenticated
    const userId = (req as any).user?.id;
    const ip = this.getIpFromRequest(req);

    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  /**
   * Extract IP address from request
   */
  private getIpFromRequest(req: Record<string, unknown>): string {
    const headers = req.headers as Record<string, string | string[]>;

    // Check for forwarded headers (behind proxy/load balancer)
    const forwarded = headers['x-forwarded-for'];
    if (forwarded) {
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ip.trim();
    }

    const realIp = headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fall back to socket address
    return (req as any).ip || (req as any).connection?.remoteAddress || 'unknown';
  }

  /**
   * Custom error response
   */
  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Demasiadas solicitudes. Por favor espera antes de intentar de nuevo.');
  }

  /**
   * Check if request should be throttled
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get custom options from metadata
    const customOptions = this.customReflector.get<ThrottleOptions>(
      THROTTLE_OPTIONS_KEY,
      context.getHandler(),
    );

    // Check skip condition
    if (customOptions?.skipIf?.(context)) {
      return true;
    }

    return super.canActivate(context);
  }
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RateLimits = {
  // Default: 100 requests per minute
  DEFAULT: { limit: 100, ttl: 60000 },

  // Auth endpoints: 10 requests per minute
  AUTH: { limit: 10, ttl: 60000 },

  // Login specifically: 5 attempts per minute
  LOGIN: { limit: 5, ttl: 60000 },

  // Search/AI endpoints: 20 requests per minute
  SEARCH: { limit: 20, ttl: 60000 },

  // RAG/AI queries: 10 requests per minute
  AI: { limit: 10, ttl: 60000 },

  // Heavy operations (exports, imports): 5 requests per minute
  HEAVY: { limit: 5, ttl: 60000 },

  // Webhooks: 1000 requests per minute
  WEBHOOK: { limit: 1000, ttl: 60000 },

  // Health checks: unlimited (no throttle)
  HEALTH: { limit: 1000, ttl: 1000 },
} as const;

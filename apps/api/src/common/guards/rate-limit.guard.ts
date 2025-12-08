import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// In-memory store for rate limiting (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Decorator to set rate limit
export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  keyPrefix?: string; // Prefix for the key
}

export function RateLimit(options: RateLimitOptions = {}) {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor?.value || target);
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Default settings
  private readonly defaultWindowMs = 60 * 1000; // 1 minute
  private readonly defaultMax = 100; // 100 requests per minute

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();

    // Get rate limit options from decorator or use defaults
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      handler,
    ) || {};

    const windowMs = options.windowMs || this.defaultWindowMs;
    const max = options.max || this.defaultMax;
    const keyPrefix = options.keyPrefix || 'global';

    // Generate key based on IP and endpoint
    const ip = this.getClientIp(request);
    const key = `${keyPrefix}:${ip}:${request.path}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    if (!entry || now > entry.resetTime) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      this.setRateLimitHeaders(context, max, max - 1, now + windowMs);
      return true;
    }

    if (entry.count >= max) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      this.setRateLimitHeaders(context, max, 0, entry.resetTime);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);
    this.setRateLimitHeaders(context, max, max - entry.count, entry.resetTime);

    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }
    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  private setRateLimitHeaders(
    context: ExecutionContext,
    limit: number,
    remaining: number,
    resetTime: number,
  ): void {
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Global rate limit middleware
export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const keyPrefix = options.keyPrefix || 'middleware';

  return (req: Request, res: any, next: () => void) => {
    const ip = getIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      setHeaders(res, max, max - 1, now + windowMs);
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      setHeaders(res, max, 0, entry.resetTime);
      res.status(429).json({
        statusCode: 429,
        message: 'Rate limit exceeded. Please try again later.',
        error: 'Too Many Requests',
        retryAfter,
      });
      return;
    }

    entry.count++;
    rateLimitStore.set(key, entry);
    setHeaders(res, max, max - entry.count, entry.resetTime);
    next();
  };
}

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function setHeaders(res: any, limit: number, remaining: number, resetTime: number): void {
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
}

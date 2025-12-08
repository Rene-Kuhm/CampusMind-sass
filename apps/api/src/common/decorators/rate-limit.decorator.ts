import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { THROTTLE_OPTIONS_KEY, ThrottleOptions, RateLimits } from '../guards/throttle.guard';

/**
 * Custom rate limit decorator
 *
 * @param options - Rate limit options or preset name
 *
 * @example
 * // Using preset
 * @RateLimit('AUTH')
 * async login() { ... }
 *
 * @example
 * // Using custom options
 * @RateLimit({ limit: 50, ttl: 60000 })
 * async customEndpoint() { ... }
 */
export function RateLimit(
  options: keyof typeof RateLimits | ThrottleOptions,
) {
  const config = typeof options === 'string' ? RateLimits[options] : options;

  return applyDecorators(
    SetMetadata(THROTTLE_OPTIONS_KEY, config),
    UseGuards(ThrottlerGuard),
  );
}

/**
 * Skip rate limiting for specific endpoint
 * Useful for internal/admin endpoints
 */
export function SkipThrottle() {
  return SetMetadata('skipThrottle', true);
}

/**
 * Rate limit for authentication endpoints
 * 10 requests per minute
 */
export function AuthRateLimit() {
  return RateLimit('AUTH');
}

/**
 * Rate limit for login endpoint
 * 5 attempts per minute
 */
export function LoginRateLimit() {
  return RateLimit('LOGIN');
}

/**
 * Rate limit for search endpoints
 * 20 requests per minute
 */
export function SearchRateLimit() {
  return RateLimit('SEARCH');
}

/**
 * Rate limit for AI/RAG endpoints
 * 10 requests per minute
 */
export function AIRateLimit() {
  return RateLimit('AI');
}

/**
 * Rate limit for heavy operations
 * 5 requests per minute
 */
export function HeavyOperationRateLimit() {
  return RateLimit('HEAVY');
}

/**
 * Strict rate limit decorator for sensitive operations
 * 3 requests per minute
 */
export function StrictRateLimit() {
  return RateLimit({ limit: 3, ttl: 60000 });
}

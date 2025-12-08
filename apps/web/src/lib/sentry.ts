// Sentry Error Tracking Configuration
// Initialize in app layout or _app.tsx

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

// Default configuration
const defaultConfig: SentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% when error occurs
};

// Check if Sentry should be enabled
export function isSentryEnabled(): boolean {
  return Boolean(defaultConfig.dsn) && process.env.NODE_ENV === 'production';
}

// Initialize Sentry (mock for now - real implementation requires @sentry/nextjs package)
export function initSentry(config: Partial<SentryConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  if (!isSentryEnabled()) {
    console.log('[Sentry] Disabled - no DSN or not in production');
    return;
  }

  console.log('[Sentry] Initializing with config:', {
    environment: finalConfig.environment,
    release: finalConfig.release,
  });

  // In production, this would be:
  // Sentry.init({
  //   dsn: finalConfig.dsn,
  //   environment: finalConfig.environment,
  //   release: finalConfig.release,
  //   tracesSampleRate: finalConfig.tracesSampleRate,
  //   replaysSessionSampleRate: finalConfig.replaysSessionSampleRate,
  //   replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate,
  //   integrations: [
  //     new Sentry.BrowserTracing(),
  //     new Sentry.Replay(),
  //   ],
  // });
}

// Capture exception
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (!isSentryEnabled()) {
    console.error('[Sentry Mock] Exception:', error, context);
    return;
  }

  // In production: Sentry.captureException(error, { extra: context });
  console.error('[Sentry] Captured exception:', error);
}

// Capture message
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  if (!isSentryEnabled()) {
    console.log(`[Sentry Mock] ${level.toUpperCase()}: ${message}`, context);
    return;
  }

  // In production: Sentry.captureMessage(message, { level, extra: context });
  console.log(`[Sentry] ${level}: ${message}`);
}

// Set user context
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
} | null): void {
  if (!isSentryEnabled()) {
    console.log('[Sentry Mock] Set user:', user);
    return;
  }

  // In production: Sentry.setUser(user);
}

// Add breadcrumb for debugging
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  if (!isSentryEnabled()) {
    console.log('[Sentry Mock] Breadcrumb:', breadcrumb);
    return;
  }

  // In production: Sentry.addBreadcrumb(breadcrumb);
}

// Set tag
export function setTag(key: string, value: string): void {
  if (!isSentryEnabled()) {
    return;
  }

  // In production: Sentry.setTag(key, value);
}

// Set extra context
export function setExtra(key: string, value: unknown): void {
  if (!isSentryEnabled()) {
    return;
  }

  // In production: Sentry.setExtra(key, value);
}

// Start a transaction for performance monitoring
export function startTransaction(
  name: string,
  op: string
): { finish: () => void } {
  if (!isSentryEnabled()) {
    return { finish: () => {} };
  }

  // In production:
  // const transaction = Sentry.startTransaction({ name, op });
  // return transaction;

  const start = performance.now();
  return {
    finish: () => {
      const duration = performance.now() - start;
      console.log(`[Sentry] Transaction "${name}" (${op}) took ${duration}ms`);
    },
  };
}

// Error boundary helper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode
): React.ComponentType<P> {
  // In production, use Sentry.withErrorBoundary
  // For now, return the component as-is
  return Component;
}

// React error boundary integration
export const SentryErrorBoundary = {
  // Placeholder for Sentry.ErrorBoundary
  onError: (error: Error, componentStack: string) => {
    captureException(error, { componentStack });
  },
};

// Performance monitoring wrapper
export function withPerformanceMonitoring<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string
): T {
  return ((...args: unknown[]) => {
    const transaction = startTransaction(name, 'function');
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.finally(() => transaction.finish());
      }
      transaction.finish();
      return result;
    } catch (error) {
      transaction.finish();
      captureException(error, { functionName: name });
      throw error;
    }
  }) as T;
}

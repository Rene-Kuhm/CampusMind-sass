// Analytics Tracking Library
// Supports multiple analytics providers and custom events

export type AnalyticsProvider = 'posthog' | 'mixpanel' | 'amplitude' | 'ga4' | 'custom';

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  apiKey?: string;
  apiHost?: string;
  debug?: boolean;
  enabled?: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface UserProperties {
  id: string;
  email?: string;
  name?: string;
  plan?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// Configuration
const defaultConfig: AnalyticsConfig = {
  provider: 'custom',
  debug: process.env.NODE_ENV === 'development',
  enabled: process.env.NODE_ENV === 'production',
};

let config = { ...defaultConfig };
let userId: string | null = null;
let userProperties: UserProperties | null = null;

/**
 * Initialize analytics with configuration
 */
export function initAnalytics(customConfig: Partial<AnalyticsConfig> = {}): void {
  config = { ...defaultConfig, ...customConfig };

  if (!config.enabled) {
    console.log('[Analytics] Disabled in this environment');
    return;
  }

  if (config.debug) {
    console.log('[Analytics] Initialized with config:', config);
  }

  // Initialize provider-specific SDK
  switch (config.provider) {
    case 'posthog':
      initPostHog();
      break;
    case 'mixpanel':
      initMixpanel();
      break;
    case 'amplitude':
      initAmplitude();
      break;
    case 'ga4':
      initGA4();
      break;
    default:
      // Custom analytics - no initialization needed
      break;
  }
}

/**
 * Identify user for analytics
 */
export function identify(user: UserProperties): void {
  userId = user.id;
  userProperties = user;

  if (!config.enabled) {
    if (config.debug) console.log('[Analytics] identify:', user);
    return;
  }

  switch (config.provider) {
    case 'posthog':
      (window as any).posthog?.identify(user.id, user);
      break;
    case 'mixpanel':
      (window as any).mixpanel?.identify(user.id);
      (window as any).mixpanel?.people?.set(user);
      break;
    case 'amplitude':
      (window as any).amplitude?.setUserId(user.id);
      (window as any).amplitude?.setUserProperties(user);
      break;
    case 'ga4':
      (window as any).gtag?.('set', 'user_properties', user);
      break;
    default:
      logEvent('user_identified', user);
      break;
  }
}

/**
 * Reset analytics (on logout)
 */
export function reset(): void {
  userId = null;
  userProperties = null;

  if (!config.enabled) return;

  switch (config.provider) {
    case 'posthog':
      (window as any).posthog?.reset();
      break;
    case 'mixpanel':
      (window as any).mixpanel?.reset();
      break;
    case 'amplitude':
      (window as any).amplitude?.setUserId(null);
      break;
    default:
      break;
  }
}

/**
 * Track custom event
 */
export function track(eventName: string, properties?: Record<string, unknown>): void {
  const event: AnalyticsEvent = {
    name: eventName,
    properties: {
      ...properties,
      userId,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date(),
  };

  if (config.debug) {
    console.log('[Analytics] track:', event);
  }

  if (!config.enabled) return;

  switch (config.provider) {
    case 'posthog':
      (window as any).posthog?.capture(eventName, properties);
      break;
    case 'mixpanel':
      (window as any).mixpanel?.track(eventName, properties);
      break;
    case 'amplitude':
      (window as any).amplitude?.track(eventName, properties);
      break;
    case 'ga4':
      (window as any).gtag?.('event', eventName, properties);
      break;
    default:
      logEvent(eventName, properties);
      break;
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName?: string, properties?: Record<string, unknown>): void {
  const pageProps = {
    page: pageName || (typeof window !== 'undefined' ? window.location.pathname : ''),
    title: typeof document !== 'undefined' ? document.title : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    ...properties,
  };

  track('page_view', pageProps);
}

// === Specific Event Trackers for CampusMind ===

/**
 * Track study session start
 */
export function trackStudyStart(subjectId: string, subjectName: string, cardCount: number): void {
  track('study_session_start', {
    subjectId,
    subjectName,
    cardCount,
  });
}

/**
 * Track study session end
 */
export function trackStudyEnd(
  subjectId: string,
  stats: {
    duration: number; // seconds
    cardsReviewed: number;
    correctAnswers: number;
    incorrectAnswers: number;
  }
): void {
  track('study_session_end', {
    subjectId,
    ...stats,
    accuracy: stats.cardsReviewed > 0
      ? Math.round((stats.correctAnswers / stats.cardsReviewed) * 100)
      : 0,
  });
}

/**
 * Track flashcard review
 */
export function trackCardReview(
  cardId: string,
  quality: number, // SM-2 quality (0-5)
  responseTime: number // milliseconds
): void {
  track('card_review', {
    cardId,
    quality,
    responseTime,
    correct: quality >= 3,
  });
}

/**
 * Track quiz completion
 */
export function trackQuizComplete(
  quizId: string,
  stats: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    duration: number; // seconds
  }
): void {
  track('quiz_complete', {
    quizId,
    ...stats,
    percentage: Math.round((stats.score / stats.totalQuestions) * 100),
  });
}

/**
 * Track achievement unlock
 */
export function trackAchievement(
  achievementId: string,
  achievementName: string,
  xpEarned: number
): void {
  track('achievement_unlocked', {
    achievementId,
    achievementName,
    xpEarned,
  });
}

/**
 * Track level up
 */
export function trackLevelUp(newLevel: number, totalXp: number): void {
  track('level_up', {
    newLevel,
    totalXp,
  });
}

/**
 * Track streak milestone
 */
export function trackStreakMilestone(days: number): void {
  track('streak_milestone', {
    days,
    milestone: getMilestoneLabel(days),
  });
}

/**
 * Track resource creation
 */
export function trackResourceCreate(
  resourceType: 'flashcard' | 'quiz' | 'note' | 'document',
  subjectId: string
): void {
  track('resource_created', {
    resourceType,
    subjectId,
  });
}

/**
 * Track search
 */
export function trackSearch(
  searchType: 'academic' | 'internal',
  query: string,
  resultsCount: number
): void {
  track('search', {
    searchType,
    query,
    resultsCount,
    hasResults: resultsCount > 0,
  });
}

/**
 * Track subscription event
 */
export function trackSubscription(
  action: 'started' | 'upgraded' | 'downgraded' | 'cancelled',
  planName: string,
  amount?: number
): void {
  track(`subscription_${action}`, {
    planName,
    amount,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, details?: Record<string, unknown>): void {
  track('feature_used', {
    feature: featureName,
    ...details,
  });
}

/**
 * Track error
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  errorStack?: string
): void {
  track('error', {
    errorType,
    errorMessage,
    errorStack,
    page: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

// === Private helper functions ===

function getMilestoneLabel(days: number): string {
  if (days >= 365) return '1_year';
  if (days >= 100) return '100_days';
  if (days >= 30) return '30_days';
  if (days >= 7) return '7_days';
  if (days >= 3) return '3_days';
  return 'first_day';
}

function logEvent(eventName: string, properties?: Record<string, unknown>): void {
  // Custom logging for development or custom backend
  if (typeof window !== 'undefined') {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push({
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
      userId,
    });
    // Keep last 100 events
    localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100)));
  }
}

// === Provider initialization ===

function initPostHog(): void {
  if (typeof window === 'undefined' || !config.apiKey) return;

  // PostHog script would be loaded here
  console.log('[Analytics] PostHog initialized');
}

function initMixpanel(): void {
  if (typeof window === 'undefined' || !config.apiKey) return;

  // Mixpanel script would be loaded here
  console.log('[Analytics] Mixpanel initialized');
}

function initAmplitude(): void {
  if (typeof window === 'undefined' || !config.apiKey) return;

  // Amplitude script would be loaded here
  console.log('[Analytics] Amplitude initialized');
}

function initGA4(): void {
  if (typeof window === 'undefined' || !config.apiKey) return;

  // GA4 script would be loaded here
  console.log('[Analytics] GA4 initialized');
}

// === Export convenience hook for React ===

export interface UseAnalyticsReturn {
  track: typeof track;
  trackPageView: typeof trackPageView;
  identify: typeof identify;
  reset: typeof reset;
}

export function getAnalytics(): UseAnalyticsReturn {
  return {
    track,
    trackPageView,
    identify,
    reset,
  };
}

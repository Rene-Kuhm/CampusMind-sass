// Web Push Notifications Client Library
// Handles browser notifications and service worker registration

export interface PushNotificationConfig {
  vapidPublicKey: string;
  serviceWorkerPath: string;
  apiBaseUrl: string;
}

export interface NotificationPermissionStatus {
  permission: NotificationPermission;
  supported: boolean;
  serviceWorkerSupported: boolean;
}

const defaultConfig: PushNotificationConfig = {
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  serviceWorkerPath: '/sw.js',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
};

let config = { ...defaultConfig };
let registration: ServiceWorkerRegistration | null = null;

/**
 * Initialize push notifications with custom config
 */
export function initPushNotifications(customConfig: Partial<PushNotificationConfig> = {}): void {
  config = { ...defaultConfig, ...customConfig };
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === 'undefined') {
    return {
      permission: 'denied',
      supported: false,
      serviceWorkerSupported: false,
    };
  }

  return {
    permission: 'Notification' in window ? Notification.permission : 'denied',
    supported: 'Notification' in window,
    serviceWorkerSupported: 'serviceWorker' in navigator,
  };
}

/**
 * Request notification permission
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register(config.serviceWorkerPath, {
      scope: '/',
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    console.log('Service worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  accessToken: string
): Promise<{ success: boolean; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    return { success: false };
  }

  try {
    // Request permission if not already granted
    const permission = await requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return { success: false };
    }

    // Register service worker if not already registered
    if (!registration) {
      registration = await registerServiceWorker();
    }

    if (!registration) {
      return { success: false };
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // Create new subscription if none exists
    if (!subscription) {
      if (!config.vapidPublicKey) {
        console.error('VAPID public key not configured');
        return { success: false };
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey) as BufferSource,
      });
    }

    // Send subscription to backend
    const response = await fetch(`${config.apiBaseUrl}/api/v1/notifications/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register subscription with server');
    }

    return { success: true, subscription };
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return { success: false };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(accessToken: string): Promise<boolean> {
  try {
    if (!registration) {
      registration = await navigator.serviceWorker.ready;
    }

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify backend
      await fetch(`${config.apiBaseUrl}/api/v1/notifications/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    if (!registration) {
      registration = await navigator.serviceWorker.ready;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Show a local notification (not push)
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  return new Notification(title, {
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge.png',
    ...options,
  });
}

/**
 * Show notification via service worker
 */
export async function showServiceWorkerNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  try {
    if (!registration) {
      registration = await navigator.serviceWorker.ready;
    }

    await registration.showNotification(title, {
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge.png',
      ...options,
    });

    return true;
  } catch (error) {
    console.error('Failed to show service worker notification:', error);
    return false;
  }
}

// === Utility functions ===

/**
 * Convert URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';

  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

// === React Hook ===

export interface UsePushNotificationsReturn {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

/**
 * React hook state interface
 */
export interface PushNotificationState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
}

/**
 * Get initial push notification state (for SSR)
 */
export function getInitialPushState(): PushNotificationState {
  return {
    supported: false,
    permission: 'default',
    subscribed: false,
    loading: true,
  };
}

/**
 * Initialize push notification state (call in useEffect)
 */
export async function initializePushState(): Promise<PushNotificationState> {
  const supported = isPushSupported();
  const { permission } = getPermissionStatus();
  const subscribed = await isSubscribed();

  return {
    supported,
    permission,
    subscribed,
    loading: false,
  };
}

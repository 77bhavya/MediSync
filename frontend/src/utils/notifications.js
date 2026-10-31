/**
 * Browser Notification API utilities
 */

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (e) {
    console.error('[MediSync Notification] Permission request error:', e);
    return 'denied';
  }
}

/**
 * Show a browser notification
 * Uses 'tag' parameter to prevent duplicate alerts for the same dose
 */
export function showBrowserNotification(title, options = {}) {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const defaultOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      renotify: false,
      ...options,
    };
    return new Notification(title, defaultOptions);
  } catch (e) {
    console.warn('[MediSync Notification] Could not display notification:', e);
    return null;
  }
}


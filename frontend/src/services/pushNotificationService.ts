import { messaging, getToken, onMessage } from './firebase';
import { getAuthToken } from './api/config';

const VAPID_KEY = 'BNtQ-yWzXEuz_T9O0xQeEGi52R4-8nNjVbBao1oT4VuASPq0uiLhfPk81_ULMXl3eTsmpMQDhzKDSk47fgohgVQ';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.inorfresh.com/api/v1';

function getDevicePlatform(): 'web' | 'mobile' {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        ? 'mobile'
        : 'web';
}

function getFCMStorageKey(): string {
    return `fcm_token_${getDevicePlatform()}`;
}

/**
 * Register service worker for Firebase messaging
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
        try {
            console.log('🔄 Registering Service Worker...');
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });
            console.log('✅ Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            return null;
        }
    } else {
        console.warn('⚠️ Service Workers are not supported in this browser');
        return null;
    }
}

/**
 * Request notification permission from user
 */
async function requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                return true;
            } else {
                console.log('❌ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }
    console.warn('⚠️ Notifications are not supported in this browser');
    return false;
}

/**
 * Get FCM token from Firebase
 */
async function getFCMToken(): Promise<string | null> {
    if (!messaging) {
        console.warn('⚠️ Firebase Messaging not initialized');
        return null;
    }

    try {
        const registration = await registerServiceWorker();
        if (!registration) {
            console.error('❌ Service Worker not registered');
            return null;
        }

        // Wait for service worker to be fully activated before getting token
        if (registration.installing) {
            await new Promise((resolve) => {
                registration.installing!.onstatechange = (e: any) => {
                    if (e.target.state === 'activated') resolve(null);
                };
            });
        }

        await navigator.serviceWorker.ready;

        // Small delay to ensure browser push service is synced
        await new Promise(resolve => setTimeout(resolve, 500));

        // Retry logic for getting token
        let token = null;
        let retries = 3;
        while (retries > 0 && !token) {
            try {
                token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration
                });
            } catch (err: any) {
                console.warn(`⚠️ FCM token attempt failed (${retries} retries left):`, err.message);
                retries--;
                if (retries > 0) await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (token) {
            console.log('✅ FCM Token obtained:', token);
            return token;
        } else {
            console.log('❌ No FCM token available after retries');
            return null;
        }
    } catch (error: any) {
        console.error('❌ Error getting FCM token:', error);
        return null;
    }
}

/**
 * Register FCM token with backend
 */
export async function registerFCMToken(forceUpdate: boolean = false): Promise<string | null> {
    try {
        const platform = getDevicePlatform();
        const storageKey = getFCMStorageKey();

        // Check if already registered (skip only when NOT forcing an update)
        const savedToken = localStorage.getItem(storageKey);
        if (savedToken && !forceUpdate) {
            console.log('ℹ️ FCM token already registered (cached)');
            return savedToken;
        }

        // Clear cached token when force-updating so we always fetch a fresh one
        if (forceUpdate && savedToken) {
            localStorage.removeItem(storageKey);
        }

        // Request permission
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            console.warn('⚠️ Notification permission not granted');
            return null;
        }

        // Get token
        const token = await getFCMToken();
        if (!token) {
            console.error('❌ Failed to get FCM token');
            return null;
        }

        // Save to backend
        const authToken = getAuthToken();
        if (!authToken) {
            console.warn('⚠️ User not authenticated, skipping token registration');
            return null;
        }

        const response = await fetch(`${API_BASE_URL}/fcm-tokens/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                token,
                platform
            })
        });

        if (response.ok) {
            localStorage.setItem(storageKey, token);
            console.log('✅ FCM token registered with backend');
            return token;
        } else {
            const error = await response.json();
            console.error('❌ Failed to register token with backend:', error);
            return null;
        }
    } catch (error: any) {
        console.error('❌ Error registering FCM token:', error);
        return null;
    }
}

/**
 * Setup foreground notification handler
 */
export function setupForegroundNotificationHandler(handler?: (payload: any) => void): void {
    if (!messaging) {
        console.warn('⚠️ Firebase Messaging not initialized');
        return;
    }

    onMessage(messaging, (payload) => {
        console.log('📬 Foreground message received:', payload);

        const type = payload.data?.type;
        const isHandledByApp = type === 'return_pickup' || type === 'new_order';

        // For types the app handles via React popups, skip the browser notification
        // to avoid a duplicate alert alongside the in-app popup.
        if (!isHandledByApp && 'Notification' in window && Notification.permission === 'granted') {
            const title = payload.notification?.title || payload.data?.title || 'New Notification';
            const body  = payload.notification?.body  || payload.data?.body  || '';
            const options: NotificationOptions = {
                body,
                icon: payload.notification?.icon || '/favicon.png',
                badge: '/favicon.png',
                tag: type || 'notification',
                requireInteraction: false,
                silent: false,
                data: { ...payload.data, link: payload.data?.link || '/' },
            };
            // Chrome silently drops new Notification() when a service worker is active.
            // Always use registration.showNotification() so the OS tray receives it.
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                    .then((reg) => reg.showNotification(title, options))
                    .catch(() => {
                        // SW not ready — fall back to basic Notification API
                        new Notification(title, options);
                    });
            } else {
                new Notification(title, options);
            }
        }

        // Always call the custom handler so the caller can trigger React popups
        if (handler) {
            handler(payload);
        }
    });
}

/**
 * Initialize push notifications
 */
export async function initializePushNotifications(): Promise<void> {
    try {
        await registerServiceWorker();
        console.log('✅ Push notifications initialized');
    } catch (error) {
        console.error('❌ Error initializing push notifications:', error);
    }
}

/**
 * Remove FCM token from backend
 */
export async function removeFCMToken(): Promise<void> {
    try {
        const platform = getDevicePlatform();
        const storageKey = getFCMStorageKey();
        const savedToken = localStorage.getItem(storageKey);
        if (!savedToken) {
            return;
        }

        const authToken = getAuthToken();
        if (!authToken) {
            return;
        }

        await fetch(`${API_BASE_URL}/fcm-tokens/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                token: savedToken,
                platform: platform
            })
        });

        localStorage.removeItem(storageKey);
        console.log('✅ FCM token removed');
    } catch (error) {
        console.error('❌ Error removing FCM token:', error);
    }
}

import { messaging, getToken, onMessage } from './firebase';
import { getAuthToken } from './api/config';

// VAPID key must match the dhakadsnazzy2 Firebase project.
// Get it from: Firebase Console → dhakadsnazzy2 → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.inorfresh.com/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// Flutter WebView detection
//
// Flutter inappwebview sets the user agent to include "InorFreshApp" (set this
// in your Flutter project — see instructions at the bottom of this file).
// As a fallback we also check for the flutter_inappwebview JS object.
// ─────────────────────────────────────────────────────────────────────────────
export function isFlutterWebView(): boolean {
    return (
        navigator.userAgent.includes('InorFreshApp') ||
        !!(window as any).flutter_inappwebview
    );
}

function getDevicePlatform(): 'web' | 'mobile' {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        ? 'mobile'
        : 'web';
}

function getFCMStorageKey(): string {
    return `fcm_token_${getDevicePlatform()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Flutter → Web bridge
//
// Exposes window.registerNativeFCMToken(token) so the Flutter app can call:
//   webViewController.evaluateJavascript("window.registerNativeFCMToken('$fcmToken')")
//
// Also sets window.__awaitingNativeFCMToken = true so Flutter knows the web
// app is ready to receive the token (poll this flag from Flutter side).
// ─────────────────────────────────────────────────────────────────────────────
export function exposeFlutterBridge(): void {
    // Signal to Flutter that the web app is waiting for the native FCM token.
    (window as any).__awaitingNativeFCMToken = true;

    // Guard: don't re-register if already set up
    if ((window as any).registerNativeFCMToken) return;

    (window as any).registerNativeFCMToken = async (token: string): Promise<boolean> => {
        console.log('[FCM-BRIDGE] called, token length:', token?.length || 0);
        if (!token) {
            console.warn('[FCM-BRIDGE] empty token');
            return false;
        }

        const authToken = getAuthToken();
        console.log('[FCM-BRIDGE] auth token exists:', !!authToken);
        if (!authToken) {
            localStorage.setItem('flutter_pending_fcm_token', token);
            console.log('[FCM-BRIDGE] stored pending token for later');
            return false;
        }

        try {
            const url = `${API_BASE_URL}/fcm-tokens/save`;
            console.log('[FCM-BRIDGE] POST', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ token, platform: 'mobile' })
            });
            const data = await response.json().catch(() => ({}));
            console.log('[FCM-BRIDGE] response:', response.status, data);

            if (response.ok && data.success) {
                localStorage.setItem('fcm_token_mobile', token);
                localStorage.removeItem('flutter_pending_fcm_token');
                (window as any).__awaitingNativeFCMToken = false;
                console.log('[FCM-BRIDGE] SUCCESS');
                return true;
            }
            console.error('[FCM-BRIDGE] FAILED:', data.message || response.status);
            return false;
        } catch (err) {
            console.error('[FCM-BRIDGE] NETWORK ERROR:', err);
            return false;
        }
    };

    // Also expose auth token getter so Flutter can read it if needed
    (window as any).getWebAuthToken = () => getAuthToken();

    console.log('📱 Flutter FCM bridge ready — window.registerNativeFCMToken() exposed');
}

/**
 * Register service worker for Firebase messaging (web-only)
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
 * Request notification permission from user (web-only)
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
 * Get FCM token from Firebase (web-only)
 */
async function getFCMToken(): Promise<string | null> {
    if (!messaging) {
        console.warn('⚠️ Firebase Messaging not initialized');
        return null;
    }

    if (!VAPID_KEY) {
        console.error('❌ VITE_FIREBASE_VAPID_KEY is not set. Get it from Firebase Console → dhakadsnazzy2 → Project Settings → Cloud Messaging → Web Push certificates.');
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
 * Register FCM token with backend.
 *
 * In Flutter WebView: skips the web-push flow entirely and exposes the
 * native token bridge instead. Flutter calls window.registerNativeFCMToken()
 * with the native Android/iOS FCM token.
 *
 * In web browsers: uses Service Worker + VAPID as before.
 */
export async function registerFCMToken(forceUpdate: boolean = false): Promise<string | null> {
    // ── Flutter WebView path ─────────────────────────────────────────────────
    // Service Workers, Notification.requestPermission, and VAPID-based web push
    // tokens all fail silently in Android/iOS WebViews. The correct approach is
    // for the Flutter native side to obtain a native FCM token and inject it.
    if (isFlutterWebView()) {
        exposeFlutterBridge();

        // Check if Flutter already sent us a pending token (before auth was ready)
        const pendingToken = localStorage.getItem('flutter_pending_fcm_token');
        if (pendingToken) {
            console.log('📱 Registering previously pending Flutter FCM token');
            const result = await (window as any).registerNativeFCMToken(pendingToken);
            if (result) return pendingToken;
        }

        // Otherwise signal Flutter to send the token now (Flutter polls __awaitingNativeFCMToken)
        console.log('📱 Flutter WebView: web push skipped — waiting for native FCM token from Flutter');
        return null;
    }

    // ── Web browser path ─────────────────────────────────────────────────────
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
 * Setup foreground notification handler (web-only — Flutter handles natively)
 */
export function setupForegroundNotificationHandler(handler?: (payload: any) => void): void {
    // In Flutter WebView, foreground messages are handled by the Flutter app natively.
    if (isFlutterWebView()) {
        console.log('📱 Flutter WebView: foreground notification handler skipped (handled natively)');
        return;
    }

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
                        new Notification(title, options);
                    });
            } else {
                new Notification(title, options);
            }
        }

        if (handler) {
            handler(payload);
        }
    });
}

/**
 * Initialize push notifications.
 *
 * Flutter WebView: only exposes the JS bridge (no service worker).
 * Web browser:     registers the service worker.
 */
export async function initializePushNotifications(): Promise<void> {
    try {
        if (isFlutterWebView()) {
            exposeFlutterBridge();
            console.log('📱 Flutter WebView: push notification bridge initialized');
            return;
        }
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
        const storageKey = isFlutterWebView() ? 'fcm_token_mobile' : getFCMStorageKey();
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
                platform: isFlutterWebView() ? 'mobile' : platform
            })
        });

        localStorage.removeItem(storageKey);
        console.log('✅ FCM token removed');
    } catch (error) {
        console.error('❌ Error removing FCM token:', error);
    }
}

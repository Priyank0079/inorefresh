console.log('[firebase-messaging-sw.js] Service worker script loading...');
// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration (Production credentials)
const firebaseConfig = {
    apiKey: 'AIzaSyDdzURk5KJykQwmtUdOg-Lbdj4HjUT9G8g',
    authDomain: 'dhakadsnazzy2.firebaseapp.com',
    projectId: 'dhakadsnazzy2',
    storageBucket: 'dhakadsnazzy2.firebasestorage.app',
    messagingSenderId: '88524532800',
    appId: '1:88524532800:web:347183dc062e619a48c3a5',
    measurementId: 'G-GCPBFW3F1B'
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationType = payload.data?.type || 'default';

    // New order notifications for delivery boys require user interaction
    // so they are NOT auto-dismissed — the delivery boy must tap Accept/Reject
    const isOrderNotification = notificationType === 'new_order';

    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/favicon.png',
        badge: '/favicon.png',
        data: payload.data || {},
        tag: notificationType,
        // Keep the notification visible until the user taps it (for delivery orders)
        requireInteraction: isOrderNotification,
        // Vibrate pattern for order notifications: long-short-long
        vibrate: isOrderNotification ? [300, 100, 300, 100, 300] : [200],
        // Use a distinct notification icon for delivery
        image: isOrderNotification ? '/favicon.png' : undefined,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — navigate to the correct page
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked', event);

    event.notification.close();

    const data = event.notification.data || {};
    const notificationType = data.type || 'default';

    // Route to the appropriate page based on notification type
    let urlToOpen = data.link || '/';
    if (notificationType === 'new_order') {
        // Deep-link directly to the delivery dashboard so the order card shows
        urlToOpen = '/delivery';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If the app is already open on the target page, focus it
            for (const client of clientList) {
                if ('focus' in client) {
                    // Prefer an already-open delivery page
                    if (notificationType === 'new_order' && client.url.includes('/delivery')) {
                        return client.focus();
                    }
                    if (client.url.includes(urlToOpen)) {
                        return client.focus();
                    }
                }
            }
            // App not open — open a new window/tab on the correct page
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ---------------------------------------------------------------------------
// App-shell caching (added for performance)
// ---------------------------------------------------------------------------
// This service worker doubles as the offline/cache layer so repeat launches in
// the Play Store WebView open instantly instead of re-downloading the shell.
// Bump CACHE_VERSION whenever the caching logic itself changes.
const CACHE_VERSION = 'inor-v1';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Take control immediately on install so caching starts on the first launch.
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker activated');
    event.waitUntil(
        (async () => {
            // Drop caches from previous versions.
            const keys = await caches.keys();
            await Promise.all(
                keys.filter((k) => k.startsWith('inor-') && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle same-origin GET requests. API calls (api.inorfresh.com),
    // fonts and other cross-origin requests are left completely untouched.
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // App navigations: network-first so users always get the latest index.html,
    // falling back to the cached shell when offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const fresh = await fetch(request);
                    const cache = await caches.open(RUNTIME_CACHE);
                    cache.put('/index.html', fresh.clone());
                    return fresh;
                } catch (err) {
                    const cached = await caches.match('/index.html');
                    return cached || Response.error();
                }
            })()
        );
        return;
    }

    // Hashed build assets are immutable — serve cache-first.
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Images: stale-while-revalidate (fast paint, refresh in background).
    if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }
});

async function cacheFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) cache.put(request, fresh.clone());
        return fresh;
    } catch (err) {
        return cached || Response.error();
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    const network = fetch(request)
        .then((fresh) => {
            if (fresh && fresh.ok) cache.put(request, fresh.clone());
            return fresh;
        })
        .catch(() => cached);
    return cached || network;
}

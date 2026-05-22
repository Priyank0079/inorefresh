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

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker activated');
});

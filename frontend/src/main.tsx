import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/anti-flash.css'

// Set background immediately to prevent flash
if (document.documentElement) {
  document.documentElement.style.backgroundColor = '#ffffff';
}

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.style.backgroundColor = '#ffffff';
}

// NOTE: Smooth scrolling is handled by the <SmoothScroll> component (Lenis)
// mounted in App.tsx. A second Lenis instance used to be initialized here,
// which ran a duplicate requestAnimationFrame loop and fought the component
// instance for control of scroll — causing scroll jank and constant CPU use.

ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register the service worker early (after first paint) so the app shell is
// cached for instant repeat launches in the WebView. This is permission-free
// and idempotent with the Firebase push registration (same URL + scope), so it
// does not affect notifications. Registered on window.load to avoid competing
// with the initial render.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .catch((err) => console.warn('SW registration (cache) failed:', err));
  });
}


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


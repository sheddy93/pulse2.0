import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).then(() => {
    console.log('Service Worker registered');
  }).catch(error => {
    console.log('Service Worker registration failed:', error);
  });
}

// Prevent zoom on double tap
document.addEventListener('touchmove', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Minimal performance tracking
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const perf = performance.getEntriesByType('navigation')[0];
    console.log('[PERF]', {
      loadTime: perf.loadEventEnd - perf.loadEventStart,
      domInteractive: perf.domInteractive - perf.navigationStart
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
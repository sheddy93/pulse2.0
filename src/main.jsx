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

// Web Vitals Monitoring
function setupWebVitals() {
  try {
    const getCLS = () => {
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          const clsValue = list.getEntries().reduce((total, entry) => total + entry.value, 0);
          console.log('📊 CLS (Cumulative Layout Shift):', clsValue.toFixed(3));
        }).observe({ type: 'layout-shift', buffered: true });
      }
    };

    const getLCP = () => {
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('📊 LCP (Largest Contentful Paint):', lastEntry.renderTime || lastEntry.loadTime, 'ms');
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }
    };

    const getFID = () => {
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            console.log('📊 FID (First Input Delay):', entry.processingDuration, 'ms');
          });
        }).observe({ type: 'first-input', buffered: true });
      }
    };

    getCLS();
    getLCP();
    getFID();

    // Also log on page load
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      console.log('📊 Page Load Time:', pageLoadTime, 'ms');
      console.log('📊 Server Response Time:', connectTime, 'ms');
    });
  } catch (error) {
    console.warn('Web Vitals monitoring error:', error);
  }
}

setupWebVitals();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
/**
 * Performance Monitoring Helpers
 * Track & optimize real user metrics
 */

// Track Core Web Vitals
export function trackWebVitals() {
  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        console.log(`[CLS] ${(clsValue * 100).toFixed(2)}%`);
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });

  // Largest Contentful Paint (LCP)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log(`[LCP] ${lastEntry.renderTime || lastEntry.loadTime}ms`);
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // First Input Delay (FID)
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      console.log(`[FID] ${entry.processingDuration.toFixed(2)}ms`);
    }
  }).observe({ type: 'first-input', buffered: true });
}

// Measure function execution time
export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  
  // Alert if slow
  if (duration > 1000) {
    console.warn(`[SLOW] ${name} took ${duration.toFixed(2)}ms - consider optimization`);
  }
  
  return result;
}

// Measure async function
export async function measureAsyncPerformance(name, fn) {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  console.log(`[ASYNC PERF] ${name}: ${duration.toFixed(2)}ms`);
  
  if (duration > 1000) {
    console.warn(`[SLOW ASYNC] ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

// Memory usage monitoring
export function logMemoryUsage() {
  if (performance.memory) {
    const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
    const limit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
    console.log(`[MEMORY] ${used}MB / ${limit}MB (${((used / limit) * 100).toFixed(1)}%)`);
  }
}

// Long task detection
export function detectLongTasks() {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(`[LONG TASK] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.log('[LONG TASK] Not supported in this browser');
  }
}

// Page visibility tracking
export function trackPageVisibility() {
  document.addEventListener('visibilitychange', () => {
    const state = document.hidden ? 'hidden' : 'visible';
    console.log(`[VISIBILITY] Page is now ${state}`);
  });
}
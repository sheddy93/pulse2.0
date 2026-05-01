/**
 * Performance Monitoring & Optimization
 */

export class PerformanceMonitor {
  static init() {
    // Web Vitals tracking
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.sendMetric);
        getFID(this.sendMetric);
        getFCP(this.sendMetric);
        getLCP(this.sendMetric);
        getTTFB(this.sendMetric);
      });
    }

    // Resource timing
    if (window.performance?.getEntries) {
      const resources = window.performance.getEntries();
      const slowResources = resources.filter(r => r.duration > 3000);
      if (slowResources.length > 0) {
        console.warn('⚠️ Slow resources detected:', slowResources);
      }
    }
  }

  static sendMetric(metric) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: new Date().toISOString()
    });

    // Send to analytics
    if (window.navigator.sendBeacon) {
      window.navigator.sendBeacon('/api/metrics', body);
    }
  }

  static measureComponent(componentName, callback) {
    const start = performance.now();
    const result = callback();
    const duration = performance.now() - start;
    
    if (duration > 100) {
      console.warn(`⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }
}

PerformanceMonitor.init();
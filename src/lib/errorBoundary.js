/**
 * Global Error Tracking
 * Centralizzato per Sentry/Datadog
 */

export class ErrorTracker {
  static init() {
    // Sentry-like initialization
    if (window.ENV === 'production') {
      window.addEventListener('error', (event) => {
        this.logError({
          type: 'uncaught_error',
          message: event.message,
          stack: event.error?.stack,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          type: 'unhandled_promise',
          message: event.reason?.message,
          stack: event.reason?.stack,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  static logError(error) {
    console.error('Error tracked:', error);
    
    // Send to monitoring service
    if (window.navigator.sendBeacon) {
      window.navigator.sendBeacon('/api/errors', JSON.stringify(error));
    }
  }

  static captureException(error, context = {}) {
    this.logError({
      type: 'captured_exception',
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize on app start
ErrorTracker.init();
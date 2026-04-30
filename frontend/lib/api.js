/**
 * PulseHR - Centralized API Client
 * ====================================
 * Manages all HTTP requests to the Django backend.
 * 
 * Features:
 * - Automatic token authentication (Token-based auth)
 * - URL slash normalization (handles trailing/leading slashes)
 * - Standardized error parsing from DRF responses
 * - Automatic 401 redirect to login page
 * - FormData support for file uploads
 * - JSON and blob response handling
 * 
 * Usage Examples:
 *   import api from '@/lib/api';
 *   
 *   // NOTE: NEXT_PUBLIC_API_BASE_URL should already include /api.
 *   // Endpoint paths should NOT start with /api.
 *   
 *   // GET request
 *   const data = await api.get('/employees/');
 *   
 *   // POST request
 *   const result = await api.post('/employees/', { name: 'John' });
 *   
 *   // File upload with FormData
 *   const formData = new FormData();
 *   formData.append('file', fileInput.files[0]);
 *   await api.formData('/documents/upload/', formData);
 * 
 * @module api
 */

// ============================================================
// CONFIGURATION
// ============================================================

/** 
 * Base URL for API requests.
 * Read from NEXT_PUBLIC_API_BASE_URL environment variable.
 * Falls back to empty string for relative URLs in development.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// ============================================================
// INTERNAL HELPERS
// ============================================================

/** 
 * Check if code is running on the server (SSR) or client (browser).
 * Used to prevent client-only code from running during SSR.
 */
const isServer = typeof window === 'undefined';

/**
 * Read a cookie by name (client-side only).
 * Used for legacy token storage that uses cookies.
 * 
 * @param {string} name - Cookie name to read
 * @returns {string} Cookie value or empty string if not found
 */
function readCookie(name) {
  if (isServer) return '';
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

/**
 * Write a cookie with optional expiration (client-side only).
 * Used for legacy session management.
 * 
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} maxAgeSeconds - Cookie expiration in seconds (default: 8 hours)
 */
function writeCookie(name, value, maxAgeSeconds = 60 * 60 * 8) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

/**
 * Delete a cookie by setting its Max-Age to 0 (client-side only).
 * 
 * @param {string} name - Cookie name to delete
 */
function clearCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/**
 * Normalize URL by ensuring proper slash format AND removing duplicate /api/.
 * - Adds leading slash if missing
 * - PRESERVES trailing slash for Django API compatibility
 * - Removes duplicate /api/ prefix since NEXT_PUBLIC_API_BASE_URL already includes /api
 * 
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 * 
 * @example
 * normalizeUrl('/users')      // returns '/users'
 * normalizeUrl('users')       // returns '/users/' (adds leading + trailing slash for Django)
 * normalizeUrl('/users/')     // returns '/users/' (preserves trailing slash)
 * normalizeUrl('/')          // returns '/'
 * 
 * @note Django APPEND_SLASH redirects POST requests from /auth/login to /auth/login/
 * which converts POST to GET (301 redirect). We must preserve trailing slashes to avoid this.
 */
const normalizeUrl = (url) => {
  if (!url) return '/';
  
  // Add leading slash if missing
  let normalized = url.startsWith('/') ? url : '/' + url;
  
  // WARNING: Detect and fix duplicate /api/ prefix
  // NEXT_PUBLIC_API_BASE_URL already contains /api, so path should NOT start with /api/
  if (normalized.startsWith('/api/')) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[API] WARNING: Endpoint "${url}" starts with /api/, but NEXT_PUBLIC_API_BASE_URL ` +
        `already includes /api. This would create double "/api/api/". ` +
        `Auto-correcting to "${normalized.replace(/^\/api/, '')}"`
      );
    }
    // Auto-correct: remove the duplicate /api prefix
    normalized = normalized.replace(/^\/api/, '');
  }
  
  // Preserve trailing slash for Django API compatibility
  // Django APPEND_SLASH causes 301 redirects that convert POST to GET
  // Only remove trailing slash if URL is just "/"
  // NOTE: If endpoint lacks trailing slash, ADD it for Django compatibility
  if (normalized === '/') {
    // Root URL stays as-is
  } else if (!normalized.endsWith('/')) {
    // Add trailing slash for Django API endpoints (they require it)
    normalized = normalized + '/';
  }
  
  return normalized;
};

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

/**
 * Retrieve authentication token from multiple sources.
 * Priority: localStorage > sessionStorage > cookie
 * 
 * The backend sets HttpOnly cookie during login, but we also store
 * the token in localStorage for API authorization header usage.
 *
 * @returns {string|null} Auth token or null if not found
 * 
 * @note This function only works client-side. Returns null on server.
 */
const getToken = () => {
  if (typeof window === 'undefined') return null;
  
  // First try localStorage (set by login page)
  const localToken = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
  if (localToken) return localToken;
  
  // Then try sessionStorage
  const sessionToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('auth_token') : null;
  if (sessionToken) return sessionToken;
  
  // Finally try cookie (for backward compatibility)
  return readCookie('auth_token');
};

// ============================================================
// ERROR PARSING
// ============================================================

/**
 * Parse API error responses from Django REST Framework.
 * Handles multiple error formats that DRF may return.
 * 
 * @param {Response} response - Fetch API Response object
 * @returns {Promise<Object>} Parsed error object with 'error' and 'message' properties
 * 
 * @note Handles these DRF error formats:
 *   - { "error": true, "message": "..." }
 *   - { "detail": "..." }
 *   - { "message": "..." }
 *   - { "non_field_errors": [...] }
 *   - Generic validation errors in 'fields'
 */
const parseApiError = (response) => {
  return response.json().then(data => {
    // Check for explicit error flag
    if (data.error) return data;
    
    // Check for DRF standard 'detail' field
    if (data.detail) return { error: true, message: data.detail };
    
    // Check for custom 'message' field
    if (data.message) return { error: true, message: data.message };
    
    // Check for DRF non_field_errors (usually from serializer validation)
    if (data.non_field_errors) return { error: true, message: data.non_field_errors[0] };
    
    // Fallback: return generic error with full response data in 'fields'
    return { error: true, message: 'Unknown error', fields: data };
  }).catch(() => ({ error: true, message: 'Network error' }));
};

// ============================================================
// MAIN API CLIENT
// ============================================================

/**
 * Centralized API client with all HTTP methods.
 * Provides consistent interface for all API calls with built-in:
 * - Authentication token injection
 * - Error handling and parsing
 * - Automatic logout on 401 (session expired)
 * - Content-Type handling
 * 
 * @namespace api
 */
const api = {
  /**
   * Perform GET request
   * 
   * @param {string} endpoint - API endpoint (will be normalized)
   * @param {Object} options - Optional fetch options
   * @returns {Promise<Object|Blob>} Response data or blob for binary content
   * 
   * @example
   * const users = await api.get('/users/');
   * const file = await api.get('/documents/123/export/', { responseType: 'blob' });
   */
  async get(endpoint, options = {}) {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    
    // Build headers with JSON content type and auth token
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for session auth
        ...options,
      });

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          // Clear the auth cookie (don't clear localStorage anymore)
          clearCookie('auth_token');
          // Redirect to login with expired flag
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired');
      }

      // Handle other error responses
      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }

      // Handle binary responses (PDF, spreadsheets)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/pdf') || contentType?.includes('spreadsheet')) {
        return response.blob();
      }

      // Return JSON response
      return response.json();
    } catch (error) {
      // Don't re-throw session errors (already handled above)
      if (error.message === 'Session expired') throw error;
      console.error('API GET Error:', error);
      throw error;
    }
  },

  /**
   * Perform POST request with JSON body
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body (will be JSON serialized)
   * @param {Object} options - Optional fetch options
   * @returns {Promise<Object>} Response data
   * 
   * @example
   * const newUser = await api.post('/users/', { name: 'John', email: 'john@example.com' });
   */
  async post(endpoint, data, options = {}) {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data), // Serialize data to JSON
        ...options,
      });

      // Same 401 handling as GET
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }

      // Handle 204 No Content (successful with no response body)
      if (response.status === 204) return { success: true };

      return response.json();
    } catch (error) {
      if (error.message === 'Session expired') throw error;
      console.error('API POST Error:', error);
      throw error;
    }
  },

  /**
   * Perform PUT request (full resource update)
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Optional fetch options
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data, options = {}) {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
        ...options,
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Session expired') throw error;
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  /**
   * Perform PATCH request (partial resource update)
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Partial request body
   * @param {Object} options - Optional fetch options
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, data, options = {}) {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
        ...options,
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Session expired') throw error;
      console.error('API PATCH Error:', error);
      throw error;
    }
  },

  /**
   * Perform DELETE request
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Optional fetch options
   * @returns {Promise<Object>} Response data or { success: true } for 204
   */
  async delete(endpoint, options = {}) {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
        ...options,
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }

      if (response.status === 204) return { success: true };

      return response.json();
    } catch (error) {
      if (error.message === 'Session expired') throw error;
      console.error('API DELETE Error:', error);
      throw error;
    }
  },

  /**
   * Submit FormData for file uploads.
   * IMPORTANT: Does NOT set Content-Type header (browser sets multipart/form-data automatically)
   * 
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData object with file and fields
   * @param {Object} options - Optional fetch options
   * @returns {Promise<Object>} Response data
   * 
   * @example
   * const formData = new FormData();
   * formData.append('document', fileInput.files[0]);
   * formData.append('title', 'My Document');
   * const result = await api.formData('/documents/', formData);
   */
  async formData(endpoint, formData, options = {}) {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    // Don't set Content-Type for FormData - browser does it automatically with boundary
    const headers = {};
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
        ...options,
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await parseApiError(response);
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Session expired') throw error;
      console.error('API FormData Error:', error);
      throw error;
    }
  },
};

// ============================================================
// LEGACY EXPORTS (Backward Compatibility)
// ============================================================

// Export base URL constant for direct access if needed
export const API_URL = API_BASE_URL;

/**
 * Get session token from legacy storage locations.
 * Checks localStorage, sessionStorage, and cookies.
 * Used by legacy code that doesn't use the main api client.
 * 
 * @returns {string} Token value or empty string on server
 */
export function getSessionToken() {
  if (isServer) return '';
  return (
    window.localStorage.getItem('hr_token') ||
    window.sessionStorage.getItem('hr_token') ||
    readCookie('hr_token')
  );
}

/**
 * Get stored user object from legacy storage.
 * Deserializes JSON from localStorage, sessionStorage, or cookies.
 * 
 * @returns {Object|null} User object or null if not found/invalid
 */
export function getStoredUser() {
  if (isServer) return null;
  const rawUser =
    window.localStorage.getItem('hr_user') ||
    window.sessionStorage.getItem('hr_user') ||
    readCookie('hr_user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

/**
 * Persist session data (token and user) to all storage locations.
 * Ensures backward compatibility with legacy code.
 * 
 * @param {string} token - Authentication token
 * @param {Object} user - User object to store
 */
export function persistSession(token, user) {
  if (isServer) return;
  const serializedUser = JSON.stringify(user);

  // Store in all three locations for maximum compatibility
  window.localStorage.setItem('hr_token', token);
  window.sessionStorage.setItem('hr_token', token);
  writeCookie('hr_token', token);

  window.localStorage.setItem('hr_user', serializedUser);
  window.sessionStorage.setItem('hr_user', serializedUser);
  writeCookie('hr_user', serializedUser);
}

/**
 * Clear all session data from all storage locations.
 * Called on logout or session invalidation.
 */
export function clearSessionStorage() {
  if (isServer) return;
  // Clear from localStorage
  window.localStorage.removeItem('hr_token');
  window.localStorage.removeItem('hr_user');
  // Clear from sessionStorage
  window.sessionStorage.removeItem('hr_token');
  window.sessionStorage.removeItem('hr_user');
  // Clear cookies
  clearCookie('hr_token');
  clearCookie('hr_user');
}

/**
 * Legacy API request function.
 * Provides a simple wrapper for fetch with auth handling.
 * Used by older components that haven't migrated to the api client.
 * 
 * @param {string} path - API path (will be prefixed with API_BASE_URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data or null for 204
 * 
 * @deprecated Use 'api' object methods instead for consistency
 */
export async function apiRequest(path, options = {}) {
  const token = getSessionToken();
  const headers = new Headers(options.headers || {});
  
  // Detect if body is FormData to avoid setting JSON content-type
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  // Set Content-Type only for non-FormData requests
  if (!headers.has('Content-Type') && options.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add auth token if available
  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Request failed.';
    try {
      const errorPayload = await response.json();
      // Try different error message formats from DRF
      errorMessage =
        errorPayload.detail ||
        errorPayload.non_field_errors?.[0] ||
        Object.values(errorPayload)[0]?.[0] ||
        errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Support blob responses (for file downloads)
  if (options.responseType === 'blob') {
    return response.blob();
  }

  return response.json();
}

// ============================================================
// PRICING & LIMITS API (Legacy)
// ============================================================

/**
 * Get all public pricing plans (no auth required).
 * Used on the pricing page for non-authenticated visitors.
 * 
 * @returns {Promise<Object>} Public pricing plans
 */
export async function getPublicPricingPlans() {
  return apiRequest('/pricing/plans/public/');
}

/**
 * Get the highlighted/recommended pricing plan.
 * 
 * @returns {Promise<Object>} Highlighted plan data
 */
export async function getHighlightedPlan() {
  return apiRequest('/pricing/plans/highlighted/');
}

/**
 * Get public pricing configuration (features, limits, etc.).
 * 
 * @returns {Promise<Object>} Public pricing configuration
 */
export async function getPublicPricingConfig() {
  return apiRequest('/pricing/config/public/');
}

/**
 * Get current company's employee limits and usage.
 * Requires authentication - returns current plan limits.
 * 
 * @returns {Promise<Object>} Company limits data
 */
export async function getCompanyLimits() {
  return apiRequest('/company/limits/');
}

// ============================================================
// GLOBAL SEARCH API (Legacy)
// ============================================================

/**
 * Perform global search across multiple entity types.
 * 
 * @param {string} query - Search query string
 * @param {string[]} types - Entity types to search (default: ['employees', 'documents'])
 * @returns {Promise<Object>} Search results grouped by type
 * 
 * @example
 * const results = await globalSearch('marco', ['employees', 'documents']);
 */
export async function globalSearch(query, types = ['employees', 'documents']) {
  const params = new URLSearchParams({ q: query, types: types.join(',') });
  return apiRequest(`/search/?${params}`);
}

/**
 * Quick search for autocomplete/dropdown suggestions.
 * Lightweight endpoint optimized for speed.
 * 
 * @param {string} query - Search query
 * @returns {Promise<Object>} Quick search results
 */
export async function quickSearch(query) {
  const params = new URLSearchParams({ q: query });
  return apiRequest(`/search/quick/?${params}`);
}

// ============================================================
// MAIN EXPORTS
// ============================================================

// Export the main API client as default export
export default api;

// Also export as named export for flexibility
export { api };
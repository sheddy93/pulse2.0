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

import type { ApiError, SessionUser } from '@/types';

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
 * @param name - Cookie name to read
 * @returns Cookie value or empty string if not found
 */
function readCookie(name: string): string {
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
 * @param name - Cookie name
 * @param value - Cookie value
 * @param maxAgeSeconds - Cookie expiration in seconds (default: 8 hours)
 */
function writeCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 8): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

/**
 * Delete a cookie by setting its Max-Age to 0 (client-side only).
 *
 * @param name - Cookie name to delete
 */
function clearCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/**
 * Normalize URL by ensuring proper slash format.
 * - Adds leading slash if missing
 * - Removes trailing slash if present (unless URL is just "/")
 *
 * @param url - URL to normalize
 * @returns Normalized URL
 *
 * @example
 * normalizeUrl('/users')  // returns '/users'
 * normalizeUrl('users')    // returns '/users'
 * normalizeUrl('/users/')  // returns '/users'
 * normalizeUrl('/')            // returns '/'
 */
const normalizeUrl = (url: string): string => {
  if (!url) return url;
  if (!url.startsWith('/')) url = '/' + url;
  if (url.endsWith('/') && url.length > 1) url = url.slice(0, -1);
  return url;
};

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

/**
 * Retrieve authentication token from HttpOnly cookie.
 * The token is set by the Django backend during login and cannot be
 * accessed via JavaScript (HttpOnly flag) for security.
 *
 * @returns Auth token or null if not found
 *
 * @note This function only works client-side. Returns null on server.
 */
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return readCookie('auth_token');
};

// ============================================================
// ERROR PARSING
// ============================================================

/**
 * Parse API error responses from Django REST Framework.
 * Handles multiple error formats that DRF may return.
 *
 * @param response - Fetch API Response object
 * @returns Parsed error object with 'error' and 'message' properties
 *
 * @note Handles these DRF error formats:
 *   - { "error": true, "message": "..." }
 *   - { "detail": "..." }
 *   - { "message": "..." }
 *   - { "non_field_errors": [...] }
 *   - Generic validation errors in 'fields'
 */
const parseApiError = async (response: Response): Promise<ApiError> => {
  return response.json().then(data => {
    // Check for explicit error flag
    if (data.error) return data as ApiError;

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
// API CLIENT INTERFACE
// ============================================================

export interface ApiClient {
  get<T = unknown>(endpoint: string, options?: RequestInit): Promise<T>;
  post<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T>;
  put<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T>;
  patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T>;
  delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<T>;
  formData<T = unknown>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T>;
}

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
 */
const api: ApiClient = {
  /**
   * Perform GET request
   *
   * @param endpoint - API endpoint (will be normalized)
   * @param options - Optional fetch options
   * @returns Response data or blob for binary content
   *
   * @example
   * const users = await api.get('/users/');
   * const file = await api.get('/documents/123/export/', { responseType: 'blob' });
   */
  async get<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = normalizeUrl(endpoint);
    const token = getToken();

    // Build headers with JSON content type and auth token
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
        return response.blob() as unknown as T;
      }

      // Return JSON response
      return response.json();
    } catch (error) {
      // Don't re-throw session errors (already handled above)
      if ((error as Error).message === 'Session expired') throw error;
      console.error('API GET Error:', error);
      throw error;
    }
  },

  /**
   * Perform POST request with JSON body
   *
   * @param endpoint - API endpoint
   * @param data - Request body (will be JSON serialized)
   * @param options - Optional fetch options
   * @returns Response data
   *
   * @example
   * const newUser = await api.post('/users/', { name: 'John', email: 'john@example.com' });
   */
  async post<T = unknown>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
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
      if (response.status === 204) return { success: true } as unknown as T;

      return response.json();
    } catch (error) {
      if ((error as Error).message === 'Session expired') throw error;
      console.error('API POST Error:', error);
      throw error;
    }
  },

  /**
   * Perform PUT request (full resource update)
   *
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param options - Optional fetch options
   * @returns Response data
   */
  async put<T = unknown>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
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
      if ((error as Error).message === 'Session expired') throw error;
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  /**
   * Perform PATCH request (partial resource update)
   *
   * @param endpoint - API endpoint
   * @param data - Partial request body
   * @param options - Optional fetch options
   * @returns Response data
   */
  async patch<T = unknown>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
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
      if ((error as Error).message === 'Session expired') throw error;
      console.error('API PATCH Error:', error);
      throw error;
    }
  },

  /**
   * Perform DELETE request
   *
   * @param endpoint - API endpoint
   * @param options - Optional fetch options
   * @returns Response data or { success: true } for 204
   */
  async delete<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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

      if (response.status === 204) return { success: true } as unknown as T;

      return response.json();
    } catch (error) {
      if ((error as Error).message === 'Session expired') throw error;
      console.error('API DELETE Error:', error);
      throw error;
    }
  },

  /**
   * Submit FormData for file uploads.
   * IMPORTANT: Does NOT set Content-Type header (browser sets multipart/form-data automatically)
   *
   * @param endpoint - API endpoint
   * @param formData - FormData object with file and fields
   * @param options - Optional fetch options
   * @returns Response data
   *
   * @example
   * const formData = new FormData();
   * formData.append('document', fileInput.files[0]);
   * formData.append('title', 'My Document');
   * const result = await api.formData('/documents/', formData);
   */
  async formData<T = unknown>(endpoint: string, formData: FormData, options: RequestInit = {}): Promise<T> {
    const url = normalizeUrl(endpoint);
    const token = getToken();
    // Don't set Content-Type for FormData - browser does it automatically with boundary
    const headers: Record<string, string> = {};
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
      if ((error as Error).message === 'Session expired') throw error;
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
 * @returns Token value or empty string on server
 */
export function getSessionToken(): string {
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
 * @returns User object or null if not found/invalid
 */
export function getStoredUser(): SessionUser | null {
  if (isServer) return null;
  const rawUser =
    window.localStorage.getItem('hr_user') ||
    window.sessionStorage.getItem('hr_user') ||
    readCookie('hr_user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Persist session data (token and user) to all storage locations.
 * Ensures backward compatibility with legacy code.
 *
 * @param token - Authentication token
 * @param user - User object to store
 */
export function persistSession(token: string, user: SessionUser): void {
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
export function clearSessionStorage(): void {
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
 * @param path - API path (will be prefixed with API_BASE_URL)
 * @param options - Fetch options
 * @returns Response data or null for 204
 *
 * @deprecated Use 'api' object methods instead for consistency
 */
// Extended options type to support responseType
interface ExtendedRequestInit extends RequestInit {
  responseType?: 'blob' | 'json';
}

export async function apiRequest<T = unknown>(path: string, options: ExtendedRequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const headers = new Headers(options.headers as HeadersInit || {});

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
    return null as unknown as T;
  }

  // Support blob responses (for file downloads)
  if (options.responseType === 'blob') {
    return response.blob() as unknown as T;
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
 * @returns Public pricing plans
 */
export async function getPublicPricingPlans(): Promise<unknown> {
  return apiRequest('/pricing/plans/public/');
}

/**
 * Get the highlighted/recommended pricing plan.
 *
 * @returns Highlighted plan data
 */
export async function getHighlightedPlan(): Promise<unknown> {
  return apiRequest('/pricing/plans/highlighted/');
}

/**
 * Get public pricing configuration (features, limits, etc.).
 *
 * @returns Public pricing configuration
 */
export async function getPublicPricingConfig(): Promise<unknown> {
  return apiRequest('/pricing/config/public/');
}

/**
 * Get current company's employee limits and usage.
 * Requires authentication - returns current plan limits.
 *
 * @returns Company limits data
 */
export async function getCompanyLimits(): Promise<unknown> {
  return apiRequest('/company/limits/');
}

// ============================================================
// GLOBAL SEARCH API (Legacy)
// ============================================================

/**
 * Perform global search across multiple entity types.
 *
 * @param query - Search query string
 * @param types - Entity types to search (default: ['employees', 'documents'])
 * @returns Search results grouped by type
 *
 * @example
 * const results = await globalSearch('marco', ['employees', 'documents']);
 */
export async function globalSearch(query: string, types: string[] = ['employees', 'documents']): Promise<unknown> {
  const params = new URLSearchParams({ q: query, types: types.join(',') });
  return apiRequest(`/search/?${params}`);
}

/**
 * Quick search for autocomplete/dropdown suggestions.
 * Lightweight endpoint optimized for speed.
 *
 * @param query - Search query
 * @returns Quick search results
 */
export async function quickSearch(query: string): Promise<unknown> {
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
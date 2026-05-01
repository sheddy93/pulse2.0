/**
 * src/api/adapters/restAdapter.ts
 * ===============================
 * Adapter REST API NestJS (future)
 * 
 * Userà in futuro quando migrando a NestJS
 * Endpoint: VITE_API_BASE_URL (default: http://localhost:3000/api)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const restAdapter = {
  async get(url: string, options?: any) {
    try {
      const query = new URLSearchParams(options?.params || {});
      const fullUrl = `${BASE_URL}${url}${query.toString() ? '?' + query.toString() : ''}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse(response);
      return { data };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async post(url: string, data: any, options?: any) {
    try {
      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await handleResponse(response);
      return { data: responseData };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async patch(url: string, data: any, options?: any) {
    try {
      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await handleResponse(response);
      return { data: responseData };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async delete(url: string, options?: any) {
    try {
      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 204) {
        return { data: { success: true } };
      }
      
      const data = await handleResponse(response);
      return { data };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async put(url: string, data: any, options?: any) {
    try {
      const fullUrl = `${BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await handleResponse(response);
      return { data: responseData };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async uploadFile(file: File, path?: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (path) formData.append('path', path);
      
      const response = await fetch(`${BASE_URL}/files/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const data = await handleResponse(response);
      return { data };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },
};
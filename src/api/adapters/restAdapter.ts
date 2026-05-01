/**
 * src/api/adapters/restAdapter.ts
 * ================================
 * REST API client per NestJS backend
 * Usa fetch API con JWT authentication
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const getAuthToken = () => localStorage.getItem('auth_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
});

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { error: error.message || 'API Error', status: response.status };
  }
  const data = await response.json();
  return { data, status: response.status };
};

const restAdapter = {
  // Entity CRUD
  get: async (entity: string, id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/entities/${entity}/${id}`, {
        headers: headers(),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  },

  list: async (entity: string, query = {}) => {
    try {
      const params = new URLSearchParams(query as any).toString();
      const response = await fetch(`${BASE_URL}/entities/${entity}?${params}`, {
        headers: headers(),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  },

  post: async (entity: string, data: any) => {
    try {
      const response = await fetch(`${BASE_URL}/entities/${entity}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  },

  patch: async (entity: string, id: string, data: any) => {
    try {
      const response = await fetch(`${BASE_URL}/entities/${entity}/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(data),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  },

  delete: async (entity: string, id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/entities/${entity}/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  },

  // File operations
  uploadFile: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${BASE_URL}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: formData,
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  },

  // Auth
  auth: {
    me: async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
          headers: headers(),
        });
        return await handleResponse(response);
      } catch (error: any) {
        return { error: error.message, status: 401 };
      }
    },
    login: async (email: string, password: string) => {
      try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await handleResponse(response);
        if (result.data?.token) {
          localStorage.setItem('auth_token', result.data.token);
        }
        return result;
      } catch (error: any) {
        return { error: error.message, status: 500 };
      }
    },
    logout: async () => {
      localStorage.removeItem('auth_token');
      return { data: { success: true }, status: 200 };
    },
  },

  // Functions
  invoke: async (functionName: string, payload: any) => {
    try {
      const response = await fetch(`${BASE_URL}/functions/${functionName}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      return await handleResponse(response);
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  },
};

export default restAdapter;
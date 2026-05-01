/**
 * src/api/adapters/base44Adapter.ts
 * ==================================
 * TEMPORANEO: Wrapper per Base44 SDK
 * Isoliamo tutte le chiamate Base44 in un unico punto
 * Per migrazione: sostituire con REST calls
 */

import { base44 } from '@/api/base44Client';

const base44Adapter = {
  // Entity CRUD
  get: async (entity: string, id: string) => {
    try {
      const result = await base44.entities[entity].get?.(id);
      return { data: result, status: 200 };
    } catch (error: any) {
      return { error: error.message, status: error.status || 500 };
    }
  },

  list: async (entity: string, query = {}) => {
    try {
      const result = await base44.entities[entity].filter?.(query);
      return { data: result || [], status: 200 };
    } catch (error: any) {
      return { error: error.message, status: error.status || 500 };
    }
  },

  post: async (entity: string, data: any) => {
    try {
      const result = await base44.entities[entity].create?.(data);
      return { data: result, status: 201 };
    } catch (error: any) {
      return { error: error.message, status: error.status || 500 };
    }
  },

  patch: async (entity: string, id: string, data: any) => {
    try {
      const result = await base44.entities[entity].update?.(id, data);
      return { data: result, status: 200 };
    } catch (error: any) {
      return { error: error.message, status: error.status || 500 };
    }
  },

  delete: async (entity: string, id: string) => {
    try {
      await base44.entities[entity].delete?.(id);
      return { data: { success: true }, status: 200 };
    } catch (error: any) {
      return { error: error.message, status: error.status || 500 };
    }
  },

  // File operations
  uploadFile: async (file: File) => {
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      return { data: result, status: 200 };
    } catch (error: any) {
      return { error: error.message, status: error.status || 500 };
    }
  },

  // Auth
  auth: {
    me: async () => {
      try {
        const user = await base44.auth.me();
        return { data: user, status: 200 };
      } catch (error: any) {
        return { error: error.message, status: 401 };
      }
    },
    logout: async () => {
      try {
        await base44.auth.logout();
        return { data: { success: true }, status: 200 };
      } catch (error: any) {
        return { error: error.message, status: error.status || 500 };
      }
    },
    login: async (email: string, password: string) => {
      // Base44 non ha login programmatico via SDK
      // Rimandare a pagina di login
      throw new Error('Use base44.auth.redirectToLogin() for login');
    },
  },

  // Functions
  invoke: async (functionName: string, payload: any) => {
    try {
      const result = await base44.functions.invoke(functionName, payload);
      return { data: result.data, status: 200 };
    } catch (error: any) {
      return { error: error.message, status: error.status || 500 };
    }
  },
};

export default base44Adapter;
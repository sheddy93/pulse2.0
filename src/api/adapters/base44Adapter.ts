/**
 * src/api/adapters/base44Adapter.ts
 * =================================
 * Adapter Base44 SDK
 * 
 * Wrapper intorno a Base44 per interfaccia standardizzata
 * Quando migriamo a NestJS, switch a restAdapter
 * 
 * TODO MIGRATION: Replace with NestJS REST API calls
 */

import { base44 } from '@/api/base44Client';

export const base44Adapter = {
  async get(url: string, options?: any) {
    // Parse URL pattern
    // GET /entities/User -> base44.entities.User.list()
    // GET /entities/User/123 -> base44.entities.User.filter({id: '123'})
    try {
      const parts = url.split('/').filter(Boolean);
      
      if (parts[0] === 'entities' && parts.length >= 2) {
        const entityName = parts[1];
        const id = parts[2];
        
        // Get entity class from base44
        const entity = (base44.entities as any)[entityName];
        if (!entity) throw new Error(`Entity ${entityName} not found`);
        
        if (id) {
          return { data: await entity.filter({ id }) };
        }
        
        const query = options?.params || {};
        return { data: await entity.filter(query) };
      }
      
      throw new Error(`Unsupported URL: ${url}`);
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async post(url: string, data: any, options?: any) {
    try {
      const parts = url.split('/').filter(Boolean);
      
      if (parts[0] === 'entities' && parts.length >= 2) {
        const entityName = parts[1];
        const entity = (base44.entities as any)[entityName];
        
        if (!entity) throw new Error(`Entity ${entityName} not found`);
        
        if (Array.isArray(data)) {
          return { data: await entity.bulkCreate(data) };
        }
        
        return { data: await entity.create(data) };
      }
      
      throw new Error(`Unsupported URL: ${url}`);
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async patch(url: string, data: any, options?: any) {
    try {
      const parts = url.split('/').filter(Boolean);
      
      if (parts[0] === 'entities' && parts.length >= 3) {
        const entityName = parts[1];
        const id = parts[2];
        const entity = (base44.entities as any)[entityName];
        
        if (!entity) throw new Error(`Entity ${entityName} not found`);
        
        return { data: await entity.update(id, data) };
      }
      
      throw new Error(`Unsupported URL: ${url}`);
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async delete(url: string, options?: any) {
    try {
      const parts = url.split('/').filter(Boolean);
      
      if (parts[0] === 'entities' && parts.length >= 3) {
        const entityName = parts[1];
        const id = parts[2];
        const entity = (base44.entities as any)[entityName];
        
        if (!entity) throw new Error(`Entity ${entityName} not found`);
        
        return { data: await entity.delete(id) };
      }
      
      throw new Error(`Unsupported URL: ${url}`);
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },

  async put(url: string, data: any, options?: any) {
    // PUT = POST per Base44 (idempotent create or update)
    return base44Adapter.patch(url, data, options);
  },

  async uploadFile(file: File, path?: string) {
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      return { data: { file_url: result.file_url } };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  },
};
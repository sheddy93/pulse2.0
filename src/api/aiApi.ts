/**
 * src/api/aiApi.ts
 * ================
 * API layer per AI/LLM functions
 * 
 * Routes to adapters (Base44 or future NestJS)
 */

import { apiClient } from './client';

export const aiApi = {
  async invokeLLM(payload: {
    prompt: string;
    response_json_schema?: any;
    add_context_from_internet?: boolean;
    file_urls?: string[];
    model?: string;
  }) {
    return apiClient.post('/ai/invoke-llm', payload);
  },

  async generateImage(payload: {
    prompt: string;
    existing_image_urls?: string[];
  }) {
    return apiClient.post('/ai/generate-image', payload);
  },

  async extractDataFromFile(payload: {
    file_url: string;
    json_schema: any;
  }) {
    return apiClient.post('/ai/extract-data', payload);
  },
};
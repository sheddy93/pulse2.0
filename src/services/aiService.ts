/**
 * src/services/aiService.ts
 * =========================
 * Business logic per AI/LLM integration
 * 
 * Abstraction layer per:
 * - InvokeLLM
 * - Image generation
 * - Data extraction
 * 
 * TODO MIGRATION: Move to NestJS backend for cost control
 */

import { aiApi } from '@/api/aiApi';
import { permissionService } from './permissionService';

export const aiService = {
  /**
   * askQuestion(prompt, schema, user)
   * Domanda LLM con risposta strutturata
   */
  async askQuestion(
    prompt: string,
    responseSchema?: any,
    currentUser?: any
  ) {
    if (currentUser && !permissionService.can(currentUser, 'use_ai_assistant')) {
      throw new Error('AI assistant not available for your role');
    }

    const response = await aiApi.invokeLLM({
      prompt,
      response_json_schema: responseSchema,
      add_context_from_internet: false,
    });

    return response;
  },

  /**
   * askWithContext(prompt, schema, user)
   * Domanda LLM con ricerca internet
   * (Costs more - use wisely)
   */
  async askWithContext(
    prompt: string,
    responseSchema?: any,
    currentUser?: any
  ) {
    if (currentUser && !permissionService.can(currentUser, 'use_ai_assistant')) {
      throw new Error('AI assistant not available');
    }

    const response = await aiApi.invokeLLM({
      prompt,
      response_json_schema: responseSchema,
      add_context_from_internet: true,
      model: 'gemini_3_flash', // Only Gemini supports web search
    });

    return response;
  },

  /**
   * generateImage(prompt, referenceImages)
   * Genera immagine da descrizione
   */
  async generateImage(
    prompt: string,
    referenceImages?: string[],
    currentUser?: any
  ) {
    if (currentUser && !permissionService.can(currentUser, 'use_ai_assistant')) {
      throw new Error('Image generation not available');
    }

    const response = await aiApi.generateImage({
      prompt,
      existing_image_urls: referenceImages,
    });

    return response.url;
  },

  /**
   * extractFromFile(fileUrl, schema)
   * Estrai dati strutturati da file
   * Supporta: CSV, Excel, JSON, PDF, image
   */
  async extractFromFile(
    fileUrl: string,
    schema: any,
    currentUser?: any
  ) {
    if (currentUser && !permissionService.can(currentUser, 'use_ai_assistant')) {
      throw new Error('Data extraction not available');
    }

    const response = await aiApi.extractDataFromFile({
      file_url: fileUrl,
      json_schema: schema,
    });

    if (response.status !== 'success') {
      throw new Error(response.details || 'Extraction failed');
    }

    return response.output;
  },

  /**
   * analyzeText(text, analysisType)
   * Analisa testo per sentiment, entities, etc
   */
  async analyzeText(
    text: string,
    analysisType: 'sentiment' | 'entities' | 'summary' | 'keywords',
    currentUser?: any
  ) {
    if (currentUser && !permissionService.can(currentUser, 'use_ai_assistant')) {
      throw new Error('AI analysis not available');
    }

    const prompts = {
      sentiment: `Analizza il sentiment del testo seguente e rispondi con JSON {sentiment: "positive"|"negative"|"neutral", confidence: 0-1}:\n${text}`,
      entities: `Estrai entità (persone, luoghi, organizzazioni) dal testo:\n${text}`,
      summary: `Riassumi in 2-3 frasi:\n${text}`,
      keywords: `Estrai 5 keyword principali dal testo:\n${text}`,
    };

    const response = await aiApi.invokeLLM({
      prompt: prompts[analysisType],
      response_json_schema:
        analysisType === 'sentiment'
          ? {
              type: 'object',
              properties: {
                sentiment: { type: 'string' },
                confidence: { type: 'number' },
              },
            }
          : undefined,
    });

    return response;
  },

  /**
   * generateReport(data, reportType)
   * Genera report/documento da dati
   */
  async generateReport(
    data: any,
    reportType: 'performance' | 'attendance' | 'payroll' | 'custom'
  ) {
    const prompts = {
      performance: `Genera un report di performance review strutturato in JSON basato su questi dati: ${JSON.stringify(data)}`,
      attendance: `Genera summary presenze in formato JSON: ${JSON.stringify(data)}`,
      payroll: `Genera sommario stipendio: ${JSON.stringify(data)}`,
      custom: `Genera report: ${JSON.stringify(data)}`,
    };

    const response = await aiApi.invokeLLM({
      prompt: prompts[reportType],
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
        },
      },
    });

    return response;
  },
};
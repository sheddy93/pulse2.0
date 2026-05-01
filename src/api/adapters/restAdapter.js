/**
 * src/api/adapters/restAdapter.js
 * ================================
 * REST API client adapter - calls backend NestJS API
 */

class RestAdapter {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'API error');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  // ========== CRUD Operations ==========
  async list(entity, query = {}) {
    const params = new URLSearchParams(query);
    const response = await fetch(`${this.baseURL}/${entity}?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async get(entity, id) {
    const response = await fetch(`${this.baseURL}/${entity}/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async post(entity, data) {
    const response = await fetch(`${this.baseURL}/${entity}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async patch(entity, id, data) {
    const response = await fetch(`${this.baseURL}/${entity}/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async delete(entity, id) {
    const response = await fetch(`${this.baseURL}/${entity}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // ========== Custom Endpoints ==========
  async postPath(path, data) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getPath(path) {
    const response = await fetch(`${this.baseURL}${path}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async patchPath(path, data) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // ========== File Operations ==========
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.baseURL}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  // ========== Function Invocation ==========
  async invoke(functionName, payload) {
    return this.postPath(`/functions/${functionName}`, payload);
  }
}

export const restAdapter = new RestAdapter();
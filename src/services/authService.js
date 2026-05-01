/**
 * src/services/authService.js
 * ============================
 * Authentication service completamente decoupled
 */

import { apiClient } from '@/api/client';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data || response;
    } catch (err) {
      throw new Error('Not authenticated');
    }
  },

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh', {});
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    return response;
  },

  async changePassword(oldPassword, newPassword) {
    return apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  },

  async requestPasswordReset(email) {
    return apiClient.post('/auth/password-reset', { email });
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
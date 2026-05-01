/**
 * src/services/authService.ts
 * ===========================
 * Business logic per authentication
 * Usa authApi come abstraction layer
 */

import { authApi } from '@/api/authApi';

export const authService = {
  async login(email: string, password: string) {
    const result = await authApi.login(email, password);
    if (result.status === 200) {
      localStorage.setItem('user', JSON.stringify(result.data));
    }
    return result;
  },

  async logout() {
    const result = await authApi.logout();
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    return result;
  },

  async getCurrentUser() {
    return authApi.me();
  },

  async changePassword(oldPassword: string, newPassword: string) {
    return authApi.changePassword(oldPassword, newPassword);
  },

  async enableTwoFactor() {
    return authApi.enableTwoFactor();
  },

  async verifyTotp(token: string) {
    return authApi.verifyTotp(token);
  },
};
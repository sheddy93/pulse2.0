/**
 * src/api/authApi.ts
 * ==================
 * Auth API module - login, logout, password reset, etc.
 */

import { apiClient } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.auth.login(email, password),

  logout: () => apiClient.auth.logout(),

  me: () => apiClient.auth.me(),

  refreshToken: () =>
    apiClient.invoke('refreshToken', {}),

  passwordReset: (email: string) =>
    apiClient.invoke('requestPasswordReset', { email }),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.invoke('changePassword', { oldPassword, newPassword }),

  enableTwoFactor: () =>
    apiClient.invoke('enableTwoFactorAuth', {}),

  disableTwoFactor: (token: string) =>
    apiClient.invoke('disableTwoFactorAuth', { token }),

  verifyTotp: (token: string) =>
    apiClient.invoke('verifyTotpToken', { token }),
};

export default authApi;
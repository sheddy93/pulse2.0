/**
 * Auth API Module
 * ==============
 * Endpoints per autenticazione e registrazione.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 * 
 * Endpoints:
 * - login: POST /auth/login/
 * - registerCompany: POST /public/company-registration/
 * - registerConsultant: POST /public/consultant-registration/
 * 
 * Redirect per ruolo dopo login:
 * - company_admin/company_owner → /dashboard/company
 * - labor_consultant/safety_consultant → /dashboard/consultant
 * - employee → /dashboard/employee
 */

import api from '../api';

export const authApi = {
  // Auth endpoints - no /api prefix since BASE_URL includes it
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
  passwordReset: (email) => api.post('/auth/password-reset/', { email }),
  
  // Registration endpoints - public, no auth required
  registerCompany: (data) => api.post('/public/company-registration/', data),
  registerConsultant: (data) => api.post('/public/consultant-registration/', data),
};
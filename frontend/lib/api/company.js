/**
 * Company API Module
 * ==================
 * Endpoints per gestione aziende e configurazioni.
 *
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 *
 * Endpoints:
 * - getProfile: GET /company/profile/
 * - updateProfile: PUT /company/profile/
 * - getLimits: GET /company/limits/
 * - getDepartments: GET /company/departments/
 * - createDepartment: POST /company/departments/
 * - getSettings: GET /company/settings/
 * - updateSettings: PUT /company/settings/
 */

import api from '../api';

export const companyApi = {
  // Profile - no /api prefix since BASE_URL includes it
  getProfile: () => api.get('/company/profile/'),
  updateProfile: (data) => api.put('/company/profile/', data),

  // Limits
  getLimits: () => api.get('/company/limits/'),

  // Departments
  getDepartments: () => api.get('/company/departments/'),
  createDepartment: (data) => api.post('/company/departments/', data),
  updateDepartment: (id, data) => api.put(`/company/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`/company/departments/${id}/`),

  // Settings
  getSettings: () => api.get('/company/settings/'),
  updateSettings: (data) => api.patch('/company/settings/', data),

  // Public registration (no auth required)
  register: (data) => api.post('/public/company-registration/', data),
};
/**
 * Onboarding API Module
 * =====================
 * Endpoints per tracking progresso onboarding utente.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 */

import api from '../api';

export const onboardingApi = {
  // Onboarding progress - no /api prefix since BASE_URL includes it
  getProgress: () => api.get('/onboarding/progress/'),
  updateProgress: (data) => api.patch('/onboarding/progress/', data),
  completeStep: (stepName) => api.patch('/onboarding/progress/', { step_name: stepName }),
};
/**
 * src/services/billingService.js
 * ===============================
 * Billing & subscription management
 */

import { apiClient } from '@/api/client';

export const billingService = {
  async getStatus(companyId) {
    return apiClient.get(`/billing/status?company_id=${companyId}`);
  },

  async listPlans(companyId) {
    const result = await apiClient.get('/billing/plans');
    return result.data || result || [];
  },

  async createCheckoutSession(companyId, planId, billingInterval, addons = []) {
    return apiClient.post('/billing/checkout', {
      company_id: companyId,
      plan_id: planId,
      billing_interval: billingInterval,
      addons,
    });
  },

  async cancelSubscription(companyId, reason = '') {
    return apiClient.post('/billing/cancel', {
      company_id: companyId,
      reason,
    });
  },

  async getPaymentHistory(companyId) {
    return apiClient.get(`/billing/history?company_id=${companyId}`);
  },
};
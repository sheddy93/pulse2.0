/**
 * src/services/billingService.js
 * ==============================
 * Business logic per billing e subscriptions
 */

import { billingApi } from '@/api/billingApi';

export const billingService = {
  async getSubscriptionStatus(companyId) {
    return billingApi.getSubscriptionStatus(companyId);
  },

  async listPlans() {
    const result = await billingApi.listPlans();
    return result.status === 200 ? result.data : [];
  },

  async createCheckoutSession(planId, addons) {
    return billingApi.createCheckoutSession(planId, addons);
  },

  async getCheckoutUrl(sessionId) {
    return billingApi.getCheckoutUrl(sessionId);
  },

  async createCustomerPortal(companyId, returnUrl) {
    return billingApi.createCustomerPortal(companyId, returnUrl);
  },

  async cancelSubscription(companyId, reason) {
    return billingApi.cancelSubscription(companyId, reason);
  },

  async getPaymentHistory(companyId) {
    const result = await billingApi.getPaymentHistory(companyId);
    return result.status === 200 ? result.data : [];
  },
};
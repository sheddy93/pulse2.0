/**
 * src/api/billingApi.ts
 * =====================
 * Billing API module - subscriptions, Stripe, pricing
 */

import { apiClient } from './client';

export const billingApi = {
  getSubscriptionStatus: (companyId: string) =>
    apiClient.invoke('getSubscriptionStatus', { companyId }),

  listPlans: () =>
    apiClient.list('SubscriptionPlan', { is_active: true }),

  createCheckoutSession: (planId: string, addons?: any[]) =>
    apiClient.invoke('createCheckoutSession', { planId, addons }),

  getCheckoutUrl: (sessionId: string) =>
    apiClient.invoke('getCheckoutUrl', { sessionId }),

  createCustomerPortal: (companyId: string, returnUrl: string) =>
    apiClient.invoke('createCustomerPortal', { companyId, returnUrl }),

  cancelSubscription: (companyId: string, reason?: string) =>
    apiClient.invoke('cancelSubscription', { companyId, reason }),

  getPaymentHistory: (companyId: string) =>
    apiClient.invoke('getPaymentHistory', { companyId }),
};

export default billingApi;
/**
 * src/api/billingApi.ts
 * =====================
 * API Billing & Stripe
 * 
 * TODO MIGRATION: Endpoint futuri
 * GET /api/billing/status
 * GET /api/billing/plans
 * POST /api/billing/create-checkout-session
 * POST /api/webhooks/stripe
 * GET /api/billing/customer-portal
 */

import { base44 } from '@/api/base44Client';

export const billingApi = {
  async getStatus(companyId: string) {
    // TODO MIGRATION: GET /api/billing/status
    try {
      const result = await base44.entities.CompanySubscription.filter({
        company_id: companyId,
      });
      return result[0] || null;
    } catch (error) {
      return null;
    }
  },

  async listPlans() {
    // TODO MIGRATION: GET /api/billing/plans
    try {
      const result = await base44.entities.SubscriptionPlan.filter({
        is_active: true,
      });
      return result || [];
    } catch (error) {
      return [];
    }
  },

  async createCheckoutSession(data: any) {
    // TODO MIGRATION: POST /api/billing/create-checkout-session
    // Must be invoked server-side in NestJS backend
    try {
      const response = await base44.functions.invoke('stripeCheckoutSession', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async getCustomerPortalUrl(stripeCustomerId: string) {
    // TODO MIGRATION: GET /api/billing/customer-portal
    // Must be invoked server-side in NestJS backend
    try {
      const response = await base44.functions.invoke('stripeCustomerPortal', {
        stripe_customer_id: stripeCustomerId,
      });
      return response.data?.url;
    } catch (error) {
      return null;
    }
  },
};
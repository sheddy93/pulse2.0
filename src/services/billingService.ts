/**
 * src/services/billingService.ts
 * =============================
 * Business logic per Billing & Stripe
 * 
 * Decouples Stripe integration from components
 * TODO MIGRATION: Stripe integration moves to NestJS backend
 */

import { billingApi } from '@/api/billingApi';
import { permissionService } from './permissionService';

export const billingService = {
  /**
   * createCheckoutSession(planId, addons, user)
   * Crea sessione Stripe Checkout
   */
  async createCheckoutSession(
    planId: string,
    addons: any[] = [],
    billingInterval: 'monthly' | 'yearly',
    currentUser: any
  ) {
    if (!permissionService.can(currentUser, 'manage_billing')) {
      throw new Error('Permission denied');
    }

    const response = await billingApi.createCheckout({
      plan_id: planId,
      addons: addons,
      billing_interval: billingInterval,
      company_id: currentUser.company_id,
    });

    if (!response.session_id) {
      throw new Error('Failed to create checkout session');
    }

    return response.session_id;
  },

  /**
   * getSubscriptionStatus(companyId)
   * Status abbonamento corrente
   */
  async getSubscriptionStatus(companyId: string) {
    const status = await billingApi.getSubscriptionStatus(companyId);
    return {
      plan: status.plan_name,
      status: status.status,
      current_period_start: status.current_period_start,
      current_period_end: status.current_period_end,
      amount: status.amount,
      interval: status.billing_interval,
      next_billing_date: status.next_billing_date,
      stripe_customer_id: status.stripe_customer_id,
      stripe_subscription_id: status.stripe_subscription_id,
    };
  },

  /**
   * listPlans()
   * Piani disponibili
   */
  async listPlans() {
    const plans = await billingApi.listPlans();
    return plans.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price_monthly: p.price_monthly,
      price_yearly: p.price_yearly,
      max_employees: p.max_employees,
      features: p.features,
      is_popular: p.is_popular,
      color: p.color,
      sort_order: p.sort_order,
      stripe_price_monthly_id: p.stripe_price_monthly_id,
      stripe_price_yearly_id: p.stripe_price_yearly_id,
    }));
  },

  /**
   * getAddons()
   * Addon disponibili
   */
  async getAddons() {
    const addons = await billingApi.listAddons();
    return addons.map(a => ({
      id: a.id,
      name: a.name,
      addon_type: a.addon_type,
      unit_label: a.unit_label,
      base_price: a.base_price,
      description: a.description,
      min_quantity: a.min_quantity,
      max_quantity: a.max_quantity,
      is_active: a.is_active,
    }));
  },

  /**
   * cancelSubscription(companyId, user)
   * Cancella abbonamento
   */
  async cancelSubscription(companyId: string, currentUser: any) {
    if (currentUser.company_id !== companyId) {
      throw new Error('Permission denied');
    }

    if (!permissionService.can(currentUser, 'manage_billing')) {
      throw new Error('Permission denied');
    }

    return await billingApi.cancelSubscription(companyId);
  },

  /**
   * getInvoiceHistory(companyId, limit)
   * Storico fatture
   */
  async getInvoiceHistory(companyId: string, limit: number = 20) {
    return await billingApi.getInvoiceHistory(companyId, limit);
  },

  /**
   * getCustomerPortalUrl(companyId)
   * URL portale cliente Stripe
   */
  async getCustomerPortalUrl(companyId: string) {
    const url = await billingApi.getCustomerPortalUrl(companyId);
    return url;
  },
};
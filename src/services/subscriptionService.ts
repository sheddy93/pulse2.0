/**
 * Subscription Service
 * ───────────────────
 * Business logic per gestire piani e add-ons.
 * ✅ Calcolo prezzi con sconti
 * ✅ Validazione add-ons per piano
 * ✅ Gestione sottoscrizioni
 * 
 * TODO MIGRATION: DB-agnostico, logica pura
 */

export class SubscriptionService {
  /**
   * Get pricing info completo
   */
  async getPricingInfo(): Promise<{
    plans: any[];
    addons: any[];
  }> {
    // TODO: Query SubscriptionPlan, SubscriptionAddon from DB
    return {
      plans: [],
      addons: [],
    };
  }

  /**
   * Calcola prezzo totale con sconti
   */
  calculateTotal(input: {
    base_price: number;
    addon_prices: number[];
    discount_percentage: number;
  }): {
    subtotal: number;
    discount_amount: number;
    total: number;
  } {
    const subtotal = input.base_price + input.addon_prices.reduce((a, b) => a + b, 0);
    const discount_amount = (subtotal * input.discount_percentage) / 100;
    const total = subtotal - discount_amount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(discount_amount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Filtra add-ons validi per il piano
   */
  filterValidAddons(planTier: string, allAddons: any[]): any[] {
    const tierRanking = { starter: 1, professional: 2, enterprise: 3 };
    return allAddons.filter(
      addon => 
        addon.is_active && 
        tierRanking[planTier] >= tierRanking[addon.required_tier]
    );
  }

  /**
   * Crea nuova sottoscrizione
   */
  async createSubscription(input: {
    company_id: string;
    company_name: string;
    contact_email: string;
    plan_tier: string;
    purchased_addon_ids: string[];
    discount_percentage?: number;
  }): Promise<any> {
    // TODO: Save to CompanySubscription
    // - Fetch plan e addon details
    // - Calcola total
    // - Create Stripe subscription
    // - Save record
    return {};
  }

  /**
   * Update sconti da SuperAdmin
   */
  async updateDiscount(input: {
    subscription_id: string;
    discount_percentage: number;
    discount_reason: string;
  }): Promise<void> {
    // TODO: Update CompanySubscription
    // Recalculate total
    // Update Stripe subscription
  }

  /**
   * Add add-on a sottoscrizione esistente
   */
  async addAddonToSubscription(input: {
    subscription_id: string;
    addon_id: string;
  }): Promise<void> {
    // TODO: Add to purchased_addons array
    // Update Stripe subscription
    // Recalculate total
  }

  /**
   * Rimuovi add-on da sottoscrizione
   */
  async removeAddonFromSubscription(input: {
    subscription_id: string;
    addon_id: string;
  }): Promise<void> {
    // TODO: Remove from purchased_addons
    // Update Stripe subscription
    // Recalculate total
  }

  /**
   * Check se feature è disponibile per azienda
   */
  async hasFeature(companyId: string, featureKey: string): Promise<boolean> {
    // TODO: Query CompanySubscription
    // Check se add-on con featureKey è in purchased_addons
    return false;
  }

  /**
   * Get subscription details per azienda
   */
  async getSubscriptionByCompanyId(companyId: string): Promise<any> {
    // TODO: Query CompanySubscription where company_id
    return null;
  }
}

export const subscriptionService = new SubscriptionService();
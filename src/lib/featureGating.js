/**
 * Feature Gating System
 * Controlla quali feature sono disponibili in base al piano e agli add-ons acquistati
 */
import React from 'react';
import { base44 } from '@/api/base44Client';

export const FEATURES = {
  // Base features per piano
  core_hr: { tier: 'startup', addon: null },
  attendance: { tier: 'startup', addon: null },
  leave_management: { tier: 'startup', addon: null },
  basic_analytics: { tier: 'startup', addon: null },
  
  // Professional features
  performance_reviews: { tier: 'professional', addon: null },
  advanced_analytics: { tier: 'professional', addon: null },
  workflow_automation: { tier: 'professional', addon: null },
  
  // Enterprise features
  custom_reports: { tier: 'enterprise', addon: 'custom_reports' },
  sso: { tier: 'enterprise', addon: 'sso' },
  white_label: { tier: 'enterprise', addon: 'white_label' },
  api_access: { tier: 'enterprise', addon: null },
  
  // Add-on features
  extra_employees: { tier: null, addon: 'extra_employees' },
  storage_gb: { tier: null, addon: 'storage_gb' },
  api_calls: { tier: null, addon: 'api_calls' },
};

/**
 * Controlla se una feature è disponibile per l'azienda
 */
export async function hasFeature(base44, companyId, featureName) {
  const feature = FEATURES[featureName];
  if (!feature) return false;

  try {
    const subscriptions = await base44.entities.CompanySubscription.filter({ 
      company_id: companyId,
      status: 'active'
    });

    if (!subscriptions[0]) return false;

    const subscription = subscriptions[0];

    // Check tier
    if (feature.tier) {
      const tierHierarchy = { startup: 1, professional: 2, enterprise: 3 };
      const requiredTier = tierHierarchy[feature.tier] || 0;
      const currentTier = tierHierarchy[subscription.plan_tier] || 0;
      if (currentTier < requiredTier) return false;
    }

    // Check add-on
    if (feature.addon) {
      const hasAddon = subscription.selected_addons?.some(a => a.addon_type === feature.addon);
      if (!hasAddon) return false;
    }

    return true;
  } catch (error) {
    console.error(`Feature gate error for ${featureName}:`, error);
    return false;
  }
}

/**
 * Ottieni tutte le feature disponibili per un'azienda
 */
export async function getAvailableFeatures(base44, companyId) {
  const available = {};
  
  for (const featureName of Object.keys(FEATURES)) {
    available[featureName] = await hasFeature(base44, companyId, featureName);
  }
  
  return available;
}

/**
 * Hook React per feature gating nei componenti
 */
export function useFeatureGate(featureName) {
  const [hasAccess, setHasAccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        const access = await hasFeature(base44, me.company_id, featureName);
        setHasAccess(access);
      } catch (error) {
        console.error(`Feature gate check failed:`, error);
      } finally {
        setLoading(false);
      }
    })();
  }, [featureName]);

  return { hasAccess, loading };
}
import { base44 } from '@/api/base44Client';

let featuresCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 min

/**
 * Ottiene tutte le feature disponibili
 */
export async function getAllFeatures() {
  const now = Date.now();
  
  // Usa cache se valido
  if (featuresCache && (now - cacheTime) < CACHE_DURATION) {
    return featuresCache;
  }

  try {
    const features = await base44.entities.FeaturePlan.list();
    featuresCache = features;
    cacheTime = now;
    return features;
  } catch (error) {
    console.warn('Error loading features:', error);
    return [];
  }
}

/**
 * Verifica se una feature è abilitata per un utente
 */
export async function isFeatureEnabled(featureKey, user, subscription) {
  const features = await getAllFeatures();
  const feature = features.find(f => f.feature_key === featureKey);

  if (!feature || !feature.is_active) {
    return false;
  }

  // Verifica ruolo
  if (feature.available_for_roles && !feature.available_for_roles.includes(user?.role)) {
    return false;
  }

  // Verifica tier di sottoscrizione
  if (feature.tier_requirements && feature.tier_requirements.length > 0) {
    if (!subscription || !feature.tier_requirements.includes(subscription.plan)) {
      return false;
    }
  }

  return true;
}

/**
 * Ottiene features disponibili per un utente
 */
export async function getUserFeatures(user, subscription) {
  const features = await getAllFeatures();
  const available = [];

  for (const feature of features) {
    if (await isFeatureEnabled(feature.feature_key, user, subscription)) {
      available.push(feature);
    }
  }

  return available;
}

/**
 * Feature mapping per navigazione
 */
export const FEATURE_MAP = {
  // Attendance
  'attendance_tracking': { path: '/dashboard/employee/attendance', role: 'employee' },
  'geofence_management': { path: '/dashboard/company/geofence', role: 'company_admin' },
  'attendance_analytics': { path: '/dashboard/company/attendance', role: 'company_admin' },
  
  // Documents
  'document_management': { path: '/dashboard/company/documents', role: 'company_admin' },
  'document_templates': { path: '/dashboard/company/document-templates', role: 'company_admin' },
  'document_signature': { path: '/dashboard/employee/documents', role: 'employee' },
  
  // Payroll
  'payroll_management': { path: '/dashboard/company/payroll-export', role: 'company_admin' },
  'expense_reimbursement': { path: '/dashboard/company/expenses', role: 'company_admin' },
  
  // Training
  'training_management': { path: '/dashboard/company/training', role: 'company_admin' },
  'training_portal': { path: '/dashboard/employee/training', role: 'employee' },
  'certification_tracking': { path: '/dashboard/company/certification-expiry', role: 'company_admin' },
  
  // Performance
  'performance_reviews': { path: '/dashboard/company/performance', role: 'company_admin' },
  'feedback_360': { path: '/dashboard/employee/feedback', role: 'employee' },
  
  // Shifts
  'shift_management': { path: '/dashboard/company/shifts', role: 'company_admin' },
  'shift_calendar': { path: '/dashboard/employee/shifts', role: 'employee' },
  
  // Analytics
  'hr_analytics': { path: '/dashboard/company/analytics', role: 'company_admin' },
  'ai_analytics': { path: '/dashboard/company/ai-analytics', role: 'company_admin' },
  
  // Integrations
  'slack_integration': { path: '/dashboard/company/integrations', role: 'company_admin' },
  'calendar_sync': { path: '/dashboard/company/integrations', role: 'company_admin' },
  'api_access': { path: '/dashboard/company/api', role: 'company_admin' }
};

/**
 * Filtra navigation items in base alle feature abilitate
 */
export async function filterNavItems(navItems, user, subscription) {
  const features = await getUserFeatures(user, subscription);
  const enabledFeatureKeys = features.map(f => f.feature_key);

  // Mapping item.path -> feature_key (customizzabile per esigenze specifiche)
  const pathToFeature = {
    '/dashboard/company/geofence': 'geofence_management',
    '/dashboard/company/training': 'training_management',
    '/dashboard/company/performance': 'performance_reviews',
    '/dashboard/company/shifts': 'shift_management',
    '/dashboard/company/analytics': 'hr_analytics',
    '/dashboard/company/ai-analytics': 'ai_analytics',
    '/dashboard/employee/training': 'training_portal',
    '/dashboard/employee/feedback': 'feedback_360',
    '/dashboard/employee/shifts': 'shift_calendar',
  };

  return navItems.filter(item => {
    const featureKey = pathToFeature[item.path];
    if (!featureKey) return true; // Se non mappata, mostra sempre
    return enabledFeatureKeys.includes(featureKey);
  });
}
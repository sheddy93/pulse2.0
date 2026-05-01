/**
 * White-Label Configuration Utility
 * Allows resellers to customize branding
 */

export const DEFAULT_BRANDING = {
  app_name: 'PulseHR',
  logo_url: 'https://...',
  primary_color: '#2563eb',
  secondary_color: '#1e40af',
  email_footer: 'PulseHR - HR Management Made Simple',
  support_email: 'support@pulsehr.it',
  support_phone: '+39 02 1234 5678'
};

/**
 * Get white-label branding for company
 * @param {string} companyId - Company ID
 * @param {object} base44 - SDK client
 * @returns {Promise<object>}
 */
export async function getCompanyBranding(companyId, base44) {
  try {
    const companies = await base44.entities.Company.filter({ id: companyId });
    
    if (companies.length === 0) {
      return DEFAULT_BRANDING;
    }

    const company = companies[0];
    
    // Merge company custom branding with defaults
    return {
      app_name: company.custom_app_name || DEFAULT_BRANDING.app_name,
      logo_url: company.custom_logo_url || DEFAULT_BRANDING.logo_url,
      primary_color: company.custom_primary_color || DEFAULT_BRANDING.primary_color,
      secondary_color: company.custom_secondary_color || DEFAULT_BRANDING.secondary_color,
      email_footer: company.custom_email_footer || DEFAULT_BRANDING.email_footer,
      support_email: company.custom_support_email || DEFAULT_BRANDING.support_email,
      support_phone: company.custom_support_phone || DEFAULT_BRANDING.support_phone,
      is_white_labeled: company.is_white_labeled || false
    };
  } catch (error) {
    console.error('Error fetching branding:', error);
    return DEFAULT_BRANDING;
  }
}

/**
 * Update company white-label branding
 * @param {string} companyId - Company ID
 * @param {object} branding - New branding data
 * @param {object} base44 - SDK client
 * @returns {Promise<object>}
 */
export async function updateCompanyBranding(companyId, branding, base44) {
  try {
    const companies = await base44.entities.Company.filter({ id: companyId });
    
    if (companies.length === 0) {
      throw new Error('Company not found');
    }

    const company = companies[0];
    
    // Update only white-label fields
    const updateData = {
      custom_app_name: branding.app_name,
      custom_logo_url: branding.logo_url,
      custom_primary_color: branding.primary_color,
      custom_secondary_color: branding.secondary_color,
      custom_email_footer: branding.email_footer,
      custom_support_email: branding.support_email,
      custom_support_phone: branding.support_phone,
      is_white_labeled: true
    };

    return await base44.entities.Company.update(company.id, updateData);
  } catch (error) {
    console.error('Error updating branding:', error);
    throw error;
  }
}

/**
 * Get CSS variables for white-labeled app
 * @param {object} branding - Branding config
 * @returns {string} CSS variable declarations
 */
export function generateCSSVariables(branding) {
  return `
    :root {
      --app-name: '${branding.app_name}';
      --primary-color: ${branding.primary_color};
      --secondary-color: ${branding.secondary_color};
    }
  `;
}
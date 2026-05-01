/**
 * lib/constants.js
 * Costanti globali app
 */

export const APP_NAME = 'AldevionHR';
export const APP_VERSION = '1.0.0';

// Enum stati
export const EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated',
  SUSPENDED: 'suspended',
};

export const LEAVE_TYPES = {
  VACATION: 'vacation',
  SICK: 'sick',
  PERMIT: 'permit',
  UNPAID: 'unpaid',
  MATERNITY: 'maternity',
  OTHER: 'other',
};

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const ATTENDANCE_TYPES = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
  BREAK_START: 'break_start',
  BREAK_END: 'break_end',
};

export const ATTENDANCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CORRECTED: 'corrected',
};

export const DOCUMENT_CATEGORIES = {
  CONTRACT: 'contract',
  PAYSLIP: 'payslip',
  POLICY: 'policy',
  CERTIFICATE: 'certificate',
  MEDICAL: 'medical',
  SAFETY: 'safety',
  OTHER: 'other',
};

export const COMPANY_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
  CANCELLED: 'cancelled',
};

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  STARTUP: 'startup',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  PAUSED: 'paused',
};

// Label mappe
export const LEAVE_TYPE_LABELS = {
  [LEAVE_TYPES.VACATION]: 'Ferie',
  [LEAVE_TYPES.SICK]: 'Malattia',
  [LEAVE_TYPES.PERMIT]: 'Permesso',
  [LEAVE_TYPES.UNPAID]: 'Non retribuito',
  [LEAVE_TYPES.MATERNITY]: 'Maternità',
  [LEAVE_TYPES.OTHER]: 'Altro',
};

export const ATTENDANCE_TYPE_LABELS = {
  [ATTENDANCE_TYPES.CHECK_IN]: 'Entrata',
  [ATTENDANCE_TYPES.CHECK_OUT]: 'Uscita',
  [ATTENDANCE_TYPES.BREAK_START]: 'Inizio pausa',
  [ATTENDANCE_TYPES.BREAK_END]: 'Fine pausa',
};

export const SUBSCRIPTION_PLAN_LABELS = {
  [SUBSCRIPTION_PLANS.FREE]: 'Gratis',
  [SUBSCRIPTION_PLANS.STARTUP]: 'Startup',
  [SUBSCRIPTION_PLANS.PROFESSIONAL]: 'Professionale',
  [SUBSCRIPTION_PLANS.ENTERPRISE]: 'Enterprise',
};
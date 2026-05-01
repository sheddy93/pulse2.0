/**
 * lib/constants.js
 * ================
 * Costanti globali dell'applicazione AldevionHR.
 * 
 * Questo file centralizza:
 * - Enumerazioni (status, types)
 * - Mappe di label per UI
 * - Configurazioni globali
 * 
 * Utilizzo:
 *   import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from '@/lib/constants';
 *   
 * Nota: Se aggiungi nuove enum qui, ricordati di aggiungere anche 
 * le label corrispondenti nella sezione "Label mappe" in fondo.
 */

export const APP_NAME = 'AldevionHR';
export const APP_VERSION = '1.0.0';

/**
 * EMPLOYMENT_STATUS
 * Stato occupazionale dipendente
 */
export const EMPLOYMENT_STATUS = {
  ACTIVE: 'active',       // Dipendente attivo
  INACTIVE: 'inactive',   // Temporaneamente inattivo (es. congedo)
  TERMINATED: 'terminated', // Contratto terminato
  SUSPENDED: 'suspended', // Sospensione disciplinare
};

/**
 * LEAVE_TYPES
 * Tipi di assenza dipendente
 */
export const LEAVE_TYPES = {
  VACATION: 'vacation',   // Ferie annuali
  SICK: 'sick',          // Malattia
  PERMIT: 'permit',      // Permessi
  UNPAID: 'unpaid',      // Non retribuito
  MATERNITY: 'maternity', // Maternità/Paternità
  OTHER: 'other',        // Altro (convenzione, esame, ecc)
};

/**
 * LEAVE_STATUS
 * Stato richiesta assenza (workflow)
 */
export const LEAVE_STATUS = {
  PENDING: 'pending',     // In attesa di approvazione
  APPROVED: 'approved',   // Approvata
  REJECTED: 'rejected',   // Rifiutata
  CANCELLED: 'cancelled', // Annullata da richiedente
};

/**
 * ATTENDANCE_TYPES
 * Tipi di evento timbratura
 */
export const ATTENDANCE_TYPES = {
  CHECK_IN: 'check_in',     // Entrata (mattina)
  CHECK_OUT: 'check_out',   // Uscita (sera)
  BREAK_START: 'break_start', // Inizio pausa
  BREAK_END: 'break_end',   // Fine pausa
};

/**
 * ATTENDANCE_STATUS
 * Stato timbratura (se richiede approvazione manager)
 */
export const ATTENDANCE_STATUS = {
  PENDING: 'pending',       // In attesa approvazione
  APPROVED: 'approved',     // Approvata
  REJECTED: 'rejected',     // Rifiutata (es. out of geofence)
  CORRECTED: 'corrected',   // Corretta da manager
};

/**
 * DOCUMENT_CATEGORIES
 * Categorie documenti aziendali
 */
export const DOCUMENT_CATEGORIES = {
  CONTRACT: 'contract',     // Contratto di lavoro
  PAYSLIP: 'payslip',      // Busta paga
  POLICY: 'policy',        // Politiche aziendali
  CERTIFICATE: 'certificate', // Certificati
  MEDICAL: 'medical',      // Documenti medici
  SAFETY: 'safety',        // Sicurezza sul lavoro
  OTHER: 'other',          // Altro
};

/**
 * COMPANY_STATUS
 * Stato subscription azienda
 * Nota: Non confondere con subscription_status, questo è il general status
 */
export const COMPANY_STATUS = {
  ACTIVE: 'active',         // Azienda attiva
  SUSPENDED: 'suspended',   // Sospesa (non pagamento)
  TRIAL: 'trial',          // In trial gratuito (14 giorni)
  CANCELLED: 'cancelled',  // Cancellata
};

/**
 * SUBSCRIPTION_PLANS
 * Piani disponibili (definiti in SubscriptionPlan entity)
 */
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',               // Gratuito (no features avanzate)
  STARTUP: 'startup',         // 50 dipendenti, presenze base, ferie
  PROFESSIONAL: 'professional', // 200 dipendenti, GPS, analytics
  ENTERPRISE: 'enterprise',   // Illimitato, SSO, supporto dedicato
};

/**
 * SUBSCRIPTION_STATUS
 * Stato pagamento subscription
 * Valori da Stripe webhook
 */
export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',           // Periodo di prova (14 giorni)
  ACTIVE: 'active',         // Abbonamento attivo e pagato
  PAST_DUE: 'past_due',     // Pagamento scaduto
  CANCELLED: 'cancelled',   // Abbonamento cancellato
  PAUSED: 'paused',         // Temporaneamente in pausa
};

/**
 * LABEL MAPPE
 * ============
 * Traduzioni per UI (usate nei dropdown, badge, label)
 * Nota: Per ogni enum aggiunta, aggiungi la label map corrispondente
 * 
 * Pattern:
 *   [ENUM.VALUE]: 'Label in italiano',
 */
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
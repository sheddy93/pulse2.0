/**
 * Internationalization (i18n) Setup
 * ──────────────────────────────────
 * Multi-language support for PulseHR.
 * Supported: EN, IT, DE, FR, ES, AR (RTL)
 * ✅ Language switching
 * ✅ Date/currency localization
 * ✅ RTL support for Arabic
 * 
 * TODO MIGRATION: i18n framework stays same across all tech stacks
 */

import { create } from 'zustand';

export type Language = 'en' | 'it' | 'de' | 'fr' | 'es' | 'ar';

const translations: Record<Language, Record<string, any>> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    dashboard: {
      title: 'Dashboard',
      total_employees: 'Total Employees',
      active_employees: 'Active Employees',
      pending_leaves: 'Pending Leave Requests',
      this_month: 'This Month',
    },
    leave: {
      title: 'Leave Requests',
      request_leave: 'Request Leave',
      leave_type: 'Leave Type',
      start_date: 'Start Date',
      end_date: 'End Date',
      days: 'Days',
      status: 'Status',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      ferie: 'Vacation',
      permesso: 'Permission',
      malattia: 'Sick Leave',
    },
    attendance: {
      title: 'Attendance',
      check_in: 'Check In',
      check_out: 'Check Out',
      break_start: 'Start Break',
      break_end: 'End Break',
      today: 'Today',
      history: 'History',
      location: 'Location',
    },
    employees: {
      title: 'Employees',
      name: 'Name',
      email: 'Email',
      department: 'Department',
      job_title: 'Job Title',
      hire_date: 'Hire Date',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
    },
  },
  it: {
    common: {
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
    },
    dashboard: {
      title: 'Pannello',
      total_employees: 'Dipendenti Totali',
      active_employees: 'Dipendenti Attivi',
      pending_leaves: 'Richieste Ferie in Sospeso',
      this_month: 'Questo Mese',
    },
    leave: {
      title: 'Richieste Ferie',
      request_leave: 'Richiedi Ferie',
      leave_type: 'Tipo Assenza',
      start_date: 'Data Inizio',
      end_date: 'Data Fine',
      days: 'Giorni',
      status: 'Stato',
      pending: 'In Sospeso',
      approved: 'Approvato',
      rejected: 'Rifiutato',
      ferie: 'Ferie',
      permesso: 'Permesso',
      malattia: 'Malattia',
    },
    attendance: {
      title: 'Presenze',
      check_in: 'Entrata',
      check_out: 'Uscita',
      break_start: 'Inizio Pausa',
      break_end: 'Fine Pausa',
      today: 'Oggi',
      history: 'Storico',
      location: 'Luogo',
    },
    employees: {
      title: 'Dipendenti',
      name: 'Nome',
      email: 'Email',
      department: 'Dipartimento',
      job_title: 'Posizione',
      hire_date: 'Data Assunzione',
      status: 'Stato',
      active: 'Attivo',
      inactive: 'Inattivo',
    },
  },
  de: {
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      loading: 'Wird geladen...',
      error: 'Fehler',
      success: 'Erfolg',
    },
    dashboard: {
      title: 'Dashboard',
      total_employees: 'Gesamtmitarbeiter',
      active_employees: 'Aktive Mitarbeiter',
      pending_leaves: 'Ausstehende Urlaubsanträge',
      this_month: 'Dieser Monat',
    },
    leave: {
      title: 'Urlaubsanträge',
      request_leave: 'Urlaub anfordern',
      leave_type: 'Abwesenheitstyp',
      start_date: 'Startdatum',
      end_date: 'Enddatum',
      days: 'Tage',
      status: 'Status',
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      ferie: 'Urlaub',
      permesso: 'Genehmigung',
      malattia: 'Krankheit',
    },
    attendance: {
      title: 'Anwesenheit',
      check_in: 'Eintrag',
      check_out: 'Austritt',
      break_start: 'Pause Start',
      break_end: 'Pause Ende',
      today: 'Heute',
      history: 'Verlauf',
      location: 'Ort',
    },
    employees: {
      title: 'Mitarbeiter',
      name: 'Name',
      email: 'Email',
      department: 'Abteilung',
      job_title: 'Jobposition',
      hire_date: 'Einstellungsdatum',
      status: 'Status',
      active: 'Aktiv',
      inactive: 'Inaktiv',
    },
  },
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
    },
    dashboard: {
      title: 'Tableau de bord',
      total_employees: 'Total des employés',
      active_employees: 'Employés actifs',
      pending_leaves: 'Demandes de congé en attente',
      this_month: 'Ce mois-ci',
    },
    leave: {
      title: 'Demandes de congé',
      request_leave: 'Demander un congé',
      leave_type: 'Type de congé',
      start_date: 'Date de début',
      end_date: 'Date de fin',
      days: 'Jours',
      status: 'Statut',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      ferie: 'Vacances',
      permesso: 'Permission',
      malattia: 'Congé maladie',
    },
    attendance: {
      title: 'Présence',
      check_in: 'Arrivée',
      check_out: 'Départ',
      break_start: 'Début pause',
      break_end: 'Fin pause',
      today: "Aujourd'hui",
      history: 'Historique',
      location: 'Lieu',
    },
    employees: {
      title: 'Employés',
      name: 'Nom',
      email: 'Email',
      department: 'Département',
      job_title: 'Poste',
      hire_date: 'Date d\'embauche',
      status: 'Statut',
      active: 'Actif',
      inactive: 'Inactif',
    },
  },
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
    },
    dashboard: {
      title: 'Panel de control',
      total_employees: 'Total de empleados',
      active_employees: 'Empleados activos',
      pending_leaves: 'Solicitudes de permiso pendientes',
      this_month: 'Este mes',
    },
    leave: {
      title: 'Solicitudes de permiso',
      request_leave: 'Solicitar permiso',
      leave_type: 'Tipo de permiso',
      start_date: 'Fecha de inicio',
      end_date: 'Fecha de fin',
      days: 'Días',
      status: 'Estado',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      ferie: 'Vacaciones',
      permesso: 'Permiso',
      malattia: 'Baja por enfermedad',
    },
    attendance: {
      title: 'Asistencia',
      check_in: 'Entrada',
      check_out: 'Salida',
      break_start: 'Inicio pausa',
      break_end: 'Fin pausa',
      today: 'Hoy',
      history: 'Historial',
      location: 'Ubicación',
    },
    employees: {
      title: 'Empleados',
      name: 'Nombre',
      email: 'Email',
      department: 'Departamento',
      job_title: 'Posición',
      hire_date: 'Fecha de contratación',
      status: 'Estado',
      active: 'Activo',
      inactive: 'Inactivo',
    },
  },
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
    },
    dashboard: {
      title: 'لوحة التحكم',
      total_employees: 'إجمالي الموظفين',
      active_employees: 'الموظفون النشطون',
      pending_leaves: 'طلبات الإجازات المعلقة',
      this_month: 'هذا الشهر',
    },
    leave: {
      title: 'طلبات الإجازة',
      request_leave: 'طلب إجازة',
      leave_type: 'نوع الإجازة',
      start_date: 'تاريخ البداية',
      end_date: 'تاريخ النهاية',
      days: 'أيام',
      status: 'الحالة',
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      ferie: 'إجازة',
      permesso: 'إذن',
      malattia: 'إجازة مرضية',
    },
    attendance: {
      title: 'الحضور',
      check_in: 'تسجيل الدخول',
      check_out: 'تسجيل الخروج',
      break_start: 'بداية الفاصل',
      break_end: 'نهاية الفاصل',
      today: 'اليوم',
      history: 'السجل',
      location: 'الموقع',
    },
    employees: {
      title: 'الموظفون',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      department: 'القسم',
      job_title: 'المنصب',
      hire_date: 'تاريخ التوظيف',
      status: 'الحالة',
      active: 'نشط',
      inactive: 'غير نشط',
    },
  },
};

/**
 * i18n Store (Zustand)
 */
interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string; // Translation function
  isRTL: () => boolean;
}

export const useI18n = create<I18nState>((set, get) => ({
  language: (localStorage.getItem('language') as Language) || 'en',

  setLanguage: (lang: Language) => {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    set({ language: lang });
  },

  t: (key: string) => {
    const { language } = get();
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key; // Fallback to key if not found
  },

  isRTL: () => {
    const { language } = get();
    return language === 'ar';
  },
}));

/**
 * Date formatter with locale
 */
export function formatDate(date: Date, language: Language = 'en'): string {
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
}

/**
 * Currency formatter
 */
export function formatCurrency(amount: number, language: Language = 'en', currency: string = 'EUR'): string {
  const locale = language === 'ar' ? 'ar-SA' : language === 'it' ? 'it-IT' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
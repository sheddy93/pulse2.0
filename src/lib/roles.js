/**
 * lib/roles.js
 * Centralizzata fonte di verità per ruoli e loro proprietà
 * Pronto per futura migrazione: roles da DB PostgreSQL
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMPANY_OWNER: 'company_owner',
  COMPANY_ADMIN: 'company_admin',
  HR_MANAGER: 'hr_manager',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  EXTERNAL_CONSULTANT: 'external_consultant',
};

/**
 * Ruoli che hanno accesso agli strumenti di amministrazione dell'azienda
 * TODO MIGRATION: Questi ruoli avranno permessi specifici nel backend
 */
export const COMPANY_SUB_ROLES = [
  {
    value: ROLES.COMPANY_OWNER,
    label: 'Titolare',
    desc: 'Accesso completo a tutte le funzionalità aziendali',
  },
  {
    value: ROLES.COMPANY_ADMIN,
    label: 'Admin Azienda',
    desc: 'Gestisce dipendenti, documenti, presenze e ferie',
  },
  {
    value: ROLES.HR_MANAGER,
    label: 'HR Manager',
    desc: 'Gestisce dipendenti, presenze, ferie e payroll',
  },
  {
    value: ROLES.MANAGER,
    label: 'Manager',
    desc: 'Visualizza e approva ferie e presenze del team',
  },
];

/**
 * Genera una password temporanea sicura (10 caratteri)
 * Formato: 2 maiuscole + 2 minuscole + 2 numeri + 4 caratteri speciali
 * TODO MIGRATION: Questa logica si sposterà nel backend per maggiore sicurezza
 */
export const generateTempPassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const pw = [
    upper[Math.floor(Math.random() * upper.length)],
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
    special[Math.floor(Math.random() * special.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
  ];
  
  return pw.sort(() => Math.random() - 0.5).join('');
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.COMPANY_OWNER]: 'Titolare',
  [ROLES.COMPANY_ADMIN]: 'Admin Azienda',
  [ROLES.HR_MANAGER]: 'HR Manager',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.EMPLOYEE]: 'Dipendente',
  [ROLES.EXTERNAL_CONSULTANT]: 'Consulente Esterno',
};

export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: 'bg-red-100 text-red-800',
  [ROLES.COMPANY_OWNER]: 'bg-purple-100 text-purple-800',
  [ROLES.COMPANY_ADMIN]: 'bg-blue-100 text-blue-800',
  [ROLES.HR_MANAGER]: 'bg-indigo-100 text-indigo-800',
  [ROLES.MANAGER]: 'bg-cyan-100 text-cyan-800',
  [ROLES.EMPLOYEE]: 'bg-green-100 text-green-800',
  [ROLES.EXTERNAL_CONSULTANT]: 'bg-orange-100 text-orange-800',
};

// Gerarchia ruoli per controlli di accesso
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 7,
  [ROLES.COMPANY_OWNER]: 6,
  [ROLES.COMPANY_ADMIN]: 5,
  [ROLES.HR_MANAGER]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.EMPLOYEE]: 2,
  [ROLES.EXTERNAL_CONSULTANT]: 1,
};

export const isRoleHigherThan = (userRole, targetRole) => {
  return (ROLE_HIERARCHY[userRole] || 0) > (ROLE_HIERARCHY[targetRole] || 0);
};

export const isCompanyRole = (role) => {
  return [ROLES.COMPANY_OWNER, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.EMPLOYEE].includes(role);
};

export const isConsultantRole = (role) => {
  return role === ROLES.EXTERNAL_CONSULTANT;
};

export const isSuperAdmin = (role) => {
  return role === ROLES.SUPER_ADMIN;
};

/**
 * Mappa ruolo → dashboard path
 * TODO MIGRATION: Logica di routing deve restare nel frontend anche dopo migrazione
 */
/**
 * Ritorna il label leggibile del ruolo
 */
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || 'Utente';
};

/**
 * Ritorna le classi Tailwind per il colore del ruolo
 */
export const getRoleColor = (role) => {
  return ROLE_COLORS[role] || 'bg-slate-100 text-slate-800';
};

/**
 * Mappa ruolo → dashboard path
 * TODO MIGRATION: Logica di routing deve restare nel frontend anche dopo migrazione
 */
export const getDashboardPath = (role) => {
  const paths = {
    [ROLES.SUPER_ADMIN]: '/dashboard/admin',
    [ROLES.COMPANY_OWNER]: '/dashboard/company',
    [ROLES.COMPANY_ADMIN]: '/dashboard/company',
    [ROLES.HR_MANAGER]: '/dashboard/company',
    [ROLES.MANAGER]: '/dashboard/company',
    [ROLES.EMPLOYEE]: '/dashboard/employee',
    [ROLES.EXTERNAL_CONSULTANT]: '/dashboard/consultant',
  };
  return paths[role] || null;
};
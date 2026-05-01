/**
 * lib/roles.js
 * ============
 * Gestione centralizzata dei ruoli e permessi AldevionHR.
 * 
 * ⚠️ IMPORTANTE: Questo è il single source of truth per i ruoli.
 * Se aggiungi/modifichi un ruolo:
 * 1. Aggiungi qui in ROLES
 * 2. Aggiungi in ROLE_LABELS e ROLE_COLORS
 * 3. Aggiungi in ROLE_HIERARCHY
 * 4. Aggiungi permessi in lib/permissions.js (ROLE_PERMISSIONS_MAP)
 * 5. Aggiungi routing in App.jsx (NAV object in AppShell)
 * 
 * Gerarchia ruoli:
 *   super_admin (7) > company_owner (6) > company_admin (5) > 
 *   hr_manager (4) > manager (3) > employee (2) > consultant (1)
 * 
 * TODO MIGRATION: Quando pronto, migrare roles a PostgreSQL 
 * per permettere ruoli custom per azienda (es. "Safety Officer")
 */

/**
 * ROLES
 * Tutti i ruoli disponibili nel sistema
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',           // Admin piattaforma: vede tutto
  COMPANY_OWNER: 'company_owner',       // Proprietario azienda: accesso completo
  COMPANY_ADMIN: 'company_admin',       // Admin azienda: gestisce HR
  HR_MANAGER: 'hr_manager',             // Manager HR: approva ferie, payroll
  MANAGER: 'manager',                   // Manager team: approva ferie team
  EMPLOYEE: 'employee',                 // Dipendente: vede propri dati
  EXTERNAL_CONSULTANT: 'external_consultant', // Consulente esterno: vede dati clienti
};

/**
 * COMPANY_SUB_ROLES
 * Ruoli che hanno accesso all'area company (non super admin)
 * Usato in dropdown per assegnazione ruoli
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
 * generateTempPassword()
 * =====================
 * Genera password temporanea sicura per nuovi admin
 * 
 * Formato: 2 maiuscole + 2 minuscole + 2 numeri + 4 speciali
 * Esempio: "Rk9#$pL5!@"
 * 
 * Usata in:
 *   - Creazione admin company
 *   - Reset password
 *   - Login temporanei
 * 
 * ⚠️ TODO MIGRATION: Spostare logica in backend per maggiore sicurezza.
 * Al momento è client-side per UX, ma rischio è minimo se HTTPS sempre.
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

/**
 * ROLE_HIERARCHY
 * Numerazione per controllo accesso
 * Usata per verificare se user A può modificare user B
 * 
 * Esempio: 
 *   - company_owner (6) PUÒ modificare hr_manager (4) ✓
 *   - manager (3) NON PUÒ modificare company_admin (5) ✗
 *   - super_admin (7) PUÒ fare tutto ✓
 */
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 7,               // Admin piattaforma
  [ROLES.COMPANY_OWNER]: 6,             // Proprietario azienda
  [ROLES.COMPANY_ADMIN]: 5,             // Admin azienda
  [ROLES.HR_MANAGER]: 4,                // Manager HR
  [ROLES.MANAGER]: 3,                   // Manager team
  [ROLES.EMPLOYEE]: 2,                  // Dipendente base
  [ROLES.EXTERNAL_CONSULTANT]: 1,       // Consulente esterno (minore)
};

/**
 * isRoleHigherThan(userRole, targetRole)
 * ========================================
 * Verifica se user ha ruolo superiore per modificare target
 * 
 * Uso:
 *   if (isRoleHigherThan(user.role, target.role)) {
 *     // Permesso: user può modificare target
 *   }
 */
export const isRoleHigherThan = (userRole, targetRole) => {
  return (ROLE_HIERARCHY[userRole] || 0) > (ROLE_HIERARCHY[targetRole] || 0);
};

/**
 * isCompanyRole(role)
 * User appartiene a un'azienda? (non super admin, non consultant)
 */
export const isCompanyRole = (role) => {
  return [ROLES.COMPANY_OWNER, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.EMPLOYEE].includes(role);
};

/**
 * isConsultantRole(role)
 * Consulente esterno che collega a multiple aziende
 */
export const isConsultantRole = (role) => {
  return role === ROLES.EXTERNAL_CONSULTANT;
};

/**
 * isSuperAdmin(role)
 * Admin della piattaforma intera (accesso a tutte aziende)
 */
export const isSuperAdmin = (role) => {
  return role === ROLES.SUPER_ADMIN;
};

/**
 * getRoleLabel(role)
 * Traduzione ruolo → label italiano per UI
 * Usato in badge, dropdown, pagine
 * 
 * Esempio: 'company_owner' → 'Titolare'
 */
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || 'Utente';
};

/**
 * getRoleColor(role)
 * Classi Tailwind per styling ruolo (background + text color)
 * Usato in badge nelle liste utenti, header dashboard
 * 
 * Esempio: 'company_owner' → 'bg-purple-100 text-purple-800'
 */
export const getRoleColor = (role) => {
  return ROLE_COLORS[role] || 'bg-slate-100 text-slate-800';
};

/**
 * getDashboardPath(role)
 * =====================
 * Mappa ruolo → path principale dashboard
 * 
 * Usato in:
 *   - RoleRedirect.jsx (dopo login, dove mandare user?)
 *   - AppShell.jsx (breadcrumb home)
 * 
 * Nota: Aggiungere nuovi ruoli qui E in App.jsx <Route>
 * 
 * Paths:
 *   - super_admin → /dashboard/admin
 *   - company_* → /dashboard/company
 *   - manager/employee → /dashboard/employee
 *   - consultant → /dashboard/consultant
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
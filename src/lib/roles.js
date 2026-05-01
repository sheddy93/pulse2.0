/**
 * roles.js
 * --------
 * Definizione centralizzata di tutti i ruoli utente della piattaforma.
 * Usato da: AppShell (navigazione), RoleRedirect (routing), UI (label/colori).
 *
 * Funzioni esportate:
 *  - getDashboardPath(role)   → path dashboard per il ruolo (es. "/dashboard/company")
 *  - getRoleLabel(role)       → label UI leggibile (es. "Consulente del Lavoro")
 *  - getRoleColor(role)       → classe Tailwind colore (es. "bg-blue-600")
 *  - isCompanyRole(role)      → true se appartiene al gruppo aziendale
 *  - isConsultantRole(role)   → true se è un tipo di consulente
 *  - generatePublicId(prefix) → ID pubblico univoco (es. "CONS-XXXXXXXX")
 *  - generateTempPassword()   → password temporanea sicura per nuovi utenti
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CONSULTANT: "consultant",
  COMPANY: "company",
  EMPLOYEE: "employee",
};

export const COMPANY_SUB_ROLES = [
  { value: "company_admin", label: "Admin Aziendale", desc: "Accesso completo alla gestione aziendale" },
  { value: "hr_manager", label: "HR Manager", desc: "Gestione dipendenti, presenze, documenti e formazione" },
  { value: "manager", label: "Manager", desc: "Approvazione ferie, straordinari e gestione team" },
];

export function getDashboardPath(role) {
  switch (role) {
    case "super_admin": return "/dashboard/admin";
    case "consultant":
    case "labor_consultant":
    case "external_consultant":
    case "safety_consultant":
      return "/dashboard/consultant";
    case "company":
    case "company_owner":
    case "company_admin":
    case "hr_manager":
    case "manager":
      return "/dashboard/company";
    case "employee": return "/dashboard/employee";
    default: return null;
  }
}

export function isCompanyRole(role) {
  return ["company", "company_owner", "company_admin", "hr_manager", "manager"].includes(role);
}

export function isConsultantRole(role) {
  return ["consultant", "labor_consultant", "external_consultant", "safety_consultant"].includes(role);
}

export function getRoleLabel(role) {
  const labels = {
    super_admin: "Super Admin",
    company: "Azienda",
    company_owner: "Titolare",
    company_admin: "Admin Aziendale",
    hr_manager: "HR Manager",
    manager: "Manager",
    consultant: "Consulente",
    labor_consultant: "Consulente del Lavoro",
    external_consultant: "Consulente Esterno",
    safety_consultant: "Consulente Sicurezza",
    employee: "Dipendente",
  };
  return labels[role] || role;
}

export function getRoleColor(role) {
  const colors = {
    super_admin: "bg-red-600",
    company: "bg-blue-600",
    company_owner: "bg-blue-700",
    company_admin: "bg-blue-500",
    hr_manager: "bg-indigo-600",
    manager: "bg-violet-600",
    consultant: "bg-emerald-600",
    labor_consultant: "bg-emerald-600",
    external_consultant: "bg-teal-600",
    safety_consultant: "bg-cyan-600",
    employee: "bg-slate-500",
  };
  return colors[role] || "bg-slate-500";
}

export function generatePublicId(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${id}`;
}

export function generateTempPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNP23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}
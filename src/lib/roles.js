export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CONSULTANT: "consultant",
  COMPANY: "company",
  EMPLOYEE: "employee",
};

export function getDashboardPath(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN: return "/dashboard/admin";
    case ROLES.CONSULTANT: return "/dashboard/consultant";
    case ROLES.COMPANY: return "/dashboard/company";
    case ROLES.EMPLOYEE: return "/dashboard/employee";
    default: return null;
  }
}

export function isConsultant(role) { return role === ROLES.CONSULTANT; }
export function isCompany(role) { return role === ROLES.COMPANY; }
export function isEmployee(role) { return role === ROLES.EMPLOYEE; }
export function isSuperAdmin(role) { return role === ROLES.SUPER_ADMIN; }

export function generatePublicId(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${id}`;
}

export function generateTempPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNP";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  consultant: "Consulente",
  company: "Azienda",
  employee: "Dipendente",
};
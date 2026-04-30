export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CONSULTANT: "consultant",
  COMPANY: "company",
  EMPLOYEE: "employee",
};

export function getDashboardPath(role) {
  switch (role) {
    case "super_admin": return "/dashboard/admin";
    case "consultant": return "/dashboard/consultant";
    case "company": return "/dashboard/company";
    case "employee": return "/dashboard/employee";
    default: return null;
  }
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
import { StatusBadge } from "@/components/ui/status-badge";

const ROLE_LABELS = {
  super_admin: "Super admin",
  platform_owner: "Proprietario piattaforma",
  company_owner: "Titolare azienda",
  company_admin: "Admin aziendale",
  hr_manager: "HR manager",
  manager: "Manager",
  external_consultant: "Consulente esterno",
  labor_consultant: "Consulente del lavoro",
  safety_consultant: "Consulente sicurezza",
  employee: "Dipendente",
};

export function RoleBadge({ role }) {
  return <StatusBadge label={ROLE_LABELS[role] || role} status="info" />;
}

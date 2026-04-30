import { StatusBadge } from "@/components/ui/status-badge";

export function CompanyStatusBadge({ label, status }) {
  return <StatusBadge label={label} status={status} />;
}

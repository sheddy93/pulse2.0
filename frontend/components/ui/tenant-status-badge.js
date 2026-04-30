import { StatusBadge } from "@/components/ui/status-badge";

export function TenantStatusBadge({ label, status }) {
  return <StatusBadge label={label} status={status} />;
}

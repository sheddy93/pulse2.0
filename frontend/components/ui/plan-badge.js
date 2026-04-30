import { StatusBadge } from "@/components/ui/status-badge";

export function PlanBadge({ label }) {
  return <StatusBadge label={label} status="info" />;
}

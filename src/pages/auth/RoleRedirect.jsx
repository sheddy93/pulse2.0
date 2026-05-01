import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDashboardPath, isCompanyRole, isConsultantRole } from "@/lib/roles";

export default function RoleRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    base44.auth.me().then((user) => {
      if (!user) { base44.auth.redirectToLogin(); return; }
      const path = getDashboardPath(user.role);
      navigate(path || "/error/unknown-role", { replace: true });
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
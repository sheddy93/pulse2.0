import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContextDecoupled";
import { getDashboardPath } from "@/lib/roles";

export default function RoleRedirect() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!user) {
        window.location.href = '/';
        return;
      }
      const path = getDashboardPath(user.role);
      navigate(path || "/error/unknown-role", { replace: true });
    }
  }, [user, isLoadingAuth, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
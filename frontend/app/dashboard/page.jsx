"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

/**
 * Dashboard redirect page
 * ========================
 * This page handles automatic redirect to the appropriate dashboard
 * based on the logged-in user's role.
 * 
 * Routes:
 * - /dashboard/admin → Admin Dashboard (platform owners, super admins)
 * - /dashboard/company → Company Dashboard (owners, admins, HR, managers)
 * - /dashboard/consultant → Consultant Dashboard (labor, safety, external)
 * - /dashboard/employee → Employee Dashboard
 * 
 * If no auth, redirects to /login
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const determineDashboard = async () => {
      try {
        // Get current user info from backend
        const user = await api.get("/auth/me/");
        
        const role = user?.role || user?.user_type || "";
        
        let redirectPath = "/dashboard/company"; // Default fallback
        
        // Role-based redirects
        if (role === "super_admin" || role === "platform_owner") {
          redirectPath = "/dashboard/admin";
        } else if (
          role === "company_owner" ||
          role === "company_admin" ||
          role === "hr_manager" ||
          role === "manager"
        ) {
          redirectPath = "/dashboard/company";
        } else if (
          role === "labor_consultant" ||
          role === "safety_consultant" ||
          role === "external_consultant"
        ) {
          redirectPath = "/dashboard/consultant";
        } else if (role === "employee") {
          redirectPath = "/dashboard/employee";
        }

        router.replace(redirectPath);
      } catch (error) {
        console.error("Dashboard redirect error:", error);
        // Not authenticated - redirect to login
        router.push("/login");
      }
    };

    determineDashboard();
  }, [router]);

  // Loading state while determining dashboard
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Caricamento dashboard...</p>
      </div>
    </div>
  );
}
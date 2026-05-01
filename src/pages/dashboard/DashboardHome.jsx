/**
 * Dashboard Home dinamico basato su role
 * Reindirizza a dashboard specifico per ruolo
 */
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageLoader from '@/components/layout/PageLoader';

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user) {
        window.location.href = '/';
        return;
      }

      // Reindirizza a dashboard specifico per ruolo
      const dashboardMap = {
        super_admin: '/dashboard/admin',
        company_owner: '/dashboard/company',
        company_admin: '/dashboard/company',
        hr_manager: '/dashboard/company',
        manager: '/dashboard/company',
        consultant: '/dashboard/consultant',
        labor_consultant: '/dashboard/consultant',
        external_consultant: '/dashboard/consultant',
        safety_consultant: '/dashboard/consultant',
        employee: '/dashboard/employee'
      };

      const dashPath = dashboardMap[user.role] || '/dashboard/employee';
      window.location.href = dashPath;
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;
  return null;
}
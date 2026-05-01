/**
 * Dashboard Home dinamico basato su role
 * Reindirizza a dashboard specifico per ruolo
 */
import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import PageLoader from '@/components/layout/PageLoader';

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await authService.me();
        if (user?.role === 'employee') {
          window.location.href = '/dashboard/employee';
        } else if (user?.role === 'super_admin') {
          window.location.href = '/dashboard/admin';
        } else {
          window.location.href = '/dashboard/company';
        }
      } catch (err) {
        window.location.href = '/';
      }
    })();
  }, []);

  if (loading) return <PageLoader color="blue" />;
  return null;
}
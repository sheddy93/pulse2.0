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
    // TODO: Replace with authService.me() call
    setLoading(false);
  }, []);

  if (loading) return <PageLoader color="blue" />;
  return null;
}
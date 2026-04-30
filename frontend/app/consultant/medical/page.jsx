'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { 
  Building2,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  ArrowRight
} from 'lucide-react';

const CONSULTANT_ROLES = ['external_consultant', 'labor_consultant', 'safety_consultant'];

// Client card with medical summary
function ClientMedicalCard({ client, stats }) {
  return (
    <div className="bg-card rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-primary">
            {client.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{client.name}</h4>
            <p className="text-xs text-muted">{client.employees} dipendenti</p>
          </div>
        </div>
        <Link 
          href={`/consultant/companies/${client.id}/medical`}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4 text-muted" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "p-3 rounded-lg text-center",
          stats.certificates > 0 ? 'bg-success/10' : 'bg-gray-800'
        )}>
          <p className="text-lg font-bold text-white">{stats.certificates}</p>
          <p className="text-xs text-muted">Certificati</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg text-center",
          stats.pending > 0 ? 'bg-warning/10' : 'bg-gray-800'
        )}>
          <p className="text-lg font-bold text-white">{stats.pending}</p>
          <p className="text-xs text-muted">In attesa</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg text-center",
          stats.expiring > 0 ? 'bg-danger/10' : 'bg-gray-800'
        )}>
          <p className="text-lg font-bold text-white">{stats.expiring}</p>
          <p className="text-xs text-muted">Scadenze</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg text-center",
          stats.overdue > 0 ? 'bg-danger/10' : 'bg-gray-800'
        )}>
          <p className="text-lg font-bold text-white">{stats.overdue}</p>
          <p className="text-xs text-muted">In ritardo</p>
        </div>
      </div>
    </div>
  );
}

// Certificate row for list
function CertificateRow({ cert }) {
  const isActive = cert.is_active;
  const daysLeft = cert.end_date ? Math.ceil((new Date(cert.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isActive ? 'bg-success/10 text-success' : 'bg-gray-800 text-muted'
        )}>
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{cert.employee_name}</p>
          <p className="text-xs text-muted">
            {cert.company_name} - {cert.certificate_type}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-muted">Scadenza</p>
          <p className={cn(
            "text-sm font-medium",
            daysLeft !== null && daysLeft <= 7 ? 'text-warning' : 'text-white'
          )}>
            {cert.end_date ? new Date(cert.end_date).toLocaleDateString('it-IT') : '-'}
            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && ` (${daysLeft}d)`}
          </p>
        </div>
        
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          cert.status === 'validated' ? 'bg-success/10 text-success' :
          cert.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-gray-700 text-gray-400'
        )}>
          {cert.status === 'validated' ? 'Confermato' :
           cert.status === 'pending' ? 'In attesa' : cert.status}
        </span>
        
        <Link 
          href={`/consultant/companies/${cert.company}/certificates/${cert.id}`}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Dettagli <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// Main component
export default function ConsultantMedicalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await apiRequest('/medical/dashboard/');
        setData(result);
      } catch (error) {
        console.error('Error fetching medical data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <AuthGuard allowedRoles={CONSULTANT_ROLES}>
        <AppShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </AppShell>
      </AuthGuard>
    );
  }
  
  const stats = data?.stats || {};
  
  // Mock client data - in production would come from API
  const clients = [
    { id: 1, name: 'Alpha SRL', employees: 45, certificates: 3, pending: 1, expiring: 1, overdue: 0 },
    { id: 2, name: 'Beta Corp', employees: 28, certificates: 1, pending: 0, expiring: 0, overdue: 1 },
    { id: 3, name: 'Gamma SpA', employees: 156, certificates: 8, pending: 2, expiring: 2, overdue: 0 },
    { id: 4, name: 'Delta SRL', employees: 12, certificates: 0, pending: 0, expiring: 0, overdue: 0 },
  ];
  
  const activeCerts = data?.active_certificates || [];
  const expiringCerts = data?.expiring_certificates || [];

  return (
    <AuthGuard allowedRoles={CONSULTANT_ROLES}>
      <AppShell contentClassName="w-full">
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-muted text-sm mb-1">
              <Link href="/dashboard/consultant" className="hover:text-primary">Dashboard</Link>
              <span>/</span>
              <span>Gestione Medica</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Medica Consulente</h1>
            <p className="text-sm text-muted mt-1">Monitora certificati e visite mediche di tutti i clienti</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.active_certificates || 0}</p>
                  <p className="text-xs text-muted">Certificati attivi</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.pending_validation || 0}</p>
                  <p className="text-xs text-muted">In attesa validazione</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-danger/10 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-danger" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.expiring_soon || 0}</p>
                  <p className="text-xs text-muted">In scadenza (7gg)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.scheduled_visits || 0}</p>
                  <p className="text-xs text-muted">Visite programmate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Overview */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Riepilogo Clienti</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clients.map((client) => (
                    <ClientMedicalCard 
                      key={client.id} 
                      client={client}
                      stats={{
                        certificates: client.certificates,
                        pending: client.pending,
                        expiring: client.expiring,
                        overdue: client.overdue
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Active Certificates */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Certificati Attivi</h3>
                <div className="space-y-3">
                  {activeCerts.length === 0 ? (
                    <div className="text-center py-8 text-muted bg-card rounded-xl border border-gray-800">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                      <p>Nessun certificato attivo</p>
                    </div>
                  ) : (
                    activeCerts.map((cert) => (
                      <CertificateRow key={cert.id} cert={cert} />
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Expiring Soon */}
              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Scadono a breve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expiringCerts.length === 0 ? (
                    <p className="text-center text-muted py-4">Nessuna scadenza</p>
                  ) : (
                    <div className="space-y-3">
                      {expiringCerts.map((cert) => (
                        <div key={cert.id} className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                          <p className="text-sm font-medium text-white">{cert.employee_name}</p>
                          <p className="text-xs text-warning mt-1">
                            Scade: {new Date(cert.end_date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Visits Overdue */}
              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-danger" />
                    Visite in ritardo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-white">{stats.overdue_visits || 0}</p>
                    <p className="text-xs text-muted">visite non completate</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <div className="bg-card rounded-xl border border-gray-800 p-4">
                <h4 className="text-sm font-medium text-white mb-3">Azioni Rapide</h4>
                <div className="space-y-2">
                  <Link 
                    href="/consultant/tasks"
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-white">Task Console</p>
                      <p className="text-xs text-muted">Gestisci attivita</p>
                    </div>
                  </Link>
                  <Link 
                    href="/consultant/companies"
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Building2 className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-white">Tutti i Clienti</p>
                      <p className="text-xs text-muted">Lista completa</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
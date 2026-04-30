'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { 
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Filter,
  Search,
  Eye,
  X,
  Download,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

// Status badge
function CertStatusBadge({ status }) {
  const config = {
    pending: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock, label: 'In attesa' },
    validated: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle, label: 'Confermato' },
    rejected: { color: 'bg-danger/10 text-danger border-danger/20', icon: X, label: 'Rifiutato' },
    expired: { color: 'bg-gray-700 text-gray-400 border-gray-600', icon: AlertTriangle, label: 'Scaduto' },
  };
  
  const { color, icon: Icon, label } = config[status] || config.pending;
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// Certificate card
function CertificateCard({ cert, onValidate, onReject }) {
  const isActive = cert.is_active;
  const daysLeft = cert.end_date ? Math.ceil((new Date(cert.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <div className={cn(
      "bg-card rounded-xl border p-5 transition-all hover:shadow-lg",
      isActive ? 'border-success/30' : 'border-gray-800',
      daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 ? 'border-l-4 border-l-warning' : ''
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isActive ? 'bg-success/10 text-success' : 'bg-gray-800 text-muted'
          )}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{cert.employee_name}</h4>
            <p className="text-xs text-muted">{cert.certificate_type}</p>
          </div>
        </div>
        <CertStatusBadge status={cert.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted mb-1">Data inizio</p>
          <p className="text-sm font-medium text-white">{new Date(cert.start_date).toLocaleDateString('it-IT')}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Data fine</p>
          <p className={cn(
            "text-sm font-medium",
            daysLeft !== null && daysLeft <= 7 ? 'text-warning' : 'text-white'
          )}>
            {new Date(cert.end_date).toLocaleDateString('it-IT')}
            {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft}d)`}
          </p>
        </div>
      </div>
      
      {cert.inps_code && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-muted">Codice INPS</p>
          <p className="text-sm font-mono text-white">{cert.inps_code}</p>
        </div>
      )}
      
      {cert.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-gray-800">
          <button 
            onClick={() => onValidate(cert.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-success/10 hover:bg-success/20 text-success rounded-lg text-xs font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Valida
          </button>
          <button 
            onClick={() => onReject(cert.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg text-xs font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Rifiuta
          </button>
        </div>
      )}
    </div>
  );
}

// Stats cards
function MedStatsCard({ icon: Icon, label, value, color = 'primary', trend }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
  };
  
  return (
    <div className="bg-card rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

// Visit card
function VisitCard({ visit }) {
  const isOverdue = visit.is_overdue;
  const isExpiring = visit.is_expiring_soon;
  
  return (
    <div className={cn(
      "bg-card rounded-xl border p-4 transition-all hover:border-gray-700",
      isOverdue ? 'border-l-4 border-l-danger' : isExpiring ? 'border-l-4 border-l-warning' : 'border-gray-800'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">{visit.employee_name}</span>
        </div>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full",
          visit.status === 'completed' ? 'bg-success/10 text-success' :
          visit.status === 'scheduled' ? 'bg-info/10 text-info' : 'bg-gray-700 text-gray-400'
        )}>
          {visit.status === 'scheduled' ? 'Programmata' : visit.status === 'completed' ? 'Completata' : visit.status}
        </span>
      </div>
      
      <div className="space-y-2 text-xs text-muted">
        <p><span className="text-white">{visit.visit_type}</span> - {visit.location || 'Da definire'}</p>
        <p>Data: <span className="text-white">{new Date(visit.scheduled_date).toLocaleDateString('it-IT')}</span></p>
        {visit.doctor_name && <p>Medico: <span className="text-white">{visit.doctor_name}</span></p>}
      </div>
      
      {isOverdue && (
        <div className="mt-3 p-2 bg-danger/10 rounded-lg flex items-center gap-2 text-xs text-danger">
          <AlertTriangle className="w-4 h-4" />
          Visita in ritardo
        </div>
      )}
    </div>
  );
}

// Main component
const COMPANY_ROLES = ['company_owner', 'company_admin', 'hr_manager', 'manager'];

export default function MedicalCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showNewCert, setShowNewCert] = useState(false);
  
  // Fetch data using useEffect to avoid during build
  useEffect(() => {
    async function fetchData() {
      try {
        const [certData, visitData] = await Promise.all([
          apiRequest('/medical-certificates/'),
          apiRequest('/medical-visits/'),
        ]);
        setCertificates(certData);
        setVisits(visitData);
      } catch (error) {
        console.error('Error fetching medical data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  const stats = useMemo(() => ({
    total: certificates.length,
    active: certificates.filter(c => c.is_active).length,
    pending: certificates.filter(c => c.status === 'pending').length,
    expiring: certificates.filter(c => {
      const daysLeft = Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft >= 0;
    }).length,
    scheduledVisits: visits.filter(v => v.status === 'scheduled').length,
    overdueVisits: visits.filter(v => v.is_overdue).length,
  }), [certificates, visits]);
  
  const filteredCerts = useMemo(() => {
    let result = [...certificates];
    
    if (filter !== 'all') {
      result = result.filter(c => c.status === filter);
    }
    
    if (search) {
      result = result.filter(c => 
        c.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.inps_code?.includes(search)
      );
    }
    
    return result;
  }, [certificates, filter, search]);
  
  const handleValidate = async (certId) => {
    try {
      await apiRequest(`/medical-certificates/${certId}/validate/`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Certificato validato' }),
      });
      // Refresh
      const data = await apiRequest('/medical-certificates/');
      setCertificates(data);
    } catch (error) {
      console.error('Error validating:', error);
    }
  };
  
  const handleReject = async (certId) => {
    try {
      await apiRequest(`/medical-certificates/${certId}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Documentazione non valida' }),
      });
      const data = await apiRequest('/medical-certificates/');
      setCertificates(data);
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={COMPANY_ROLES}>
        <AppShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={COMPANY_ROLES}>
      <AppShell contentClassName="w-full">
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted text-sm mb-1">
                <Link href="/dashboard/company" className="hover:text-primary">Dashboard</Link>
                <span>/</span>
                <span>Certificati Medici</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Certificati Medici</h1>
              <p className="text-sm text-muted mt-1">Gestisci certificati INPS, visite mediche e assenze</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNewCert(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm text-primary-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuovo Certificato
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MedStatsCard icon={FileText} label="Totale certificati" value={stats.total} color="primary" />
            <MedStatsCard icon={CheckCircle} label="Attivi" value={stats.active} color="success" />
            <MedStatsCard icon={Clock} label="In attesa" value={stats.pending} color="warning" />
            <MedStatsCard icon={AlertTriangle} label="In scadenza" value={stats.expiring} color="danger" />
            <MedStatsCard icon={Calendar} label="Visite programmate" value={stats.scheduledVisits} color="info" />
            <MedStatsCard icon={AlertCircle} label="Visite in ritardo" value={stats.overdueVisits} color="danger" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text"
                  placeholder="Cerca per nome o codice INPS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-primary w-64"
                />
              </div>
              
              <div className="flex gap-2">
                {['all', 'pending', 'validated', 'expired'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      filter === f 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-gray-800 text-muted hover:text-white'
                    )}
                  >
                    {f === 'all' ? 'Tutti' : 
                     f === 'pending' ? 'In attesa' :
                     f === 'validated' ? 'Confermati' : 'Scaduti'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-muted">
              {filteredCerts.length} certificati
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Certificates */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Certificati</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCerts.map((cert) => (
                  <CertificateCard 
                    key={cert.id} 
                    cert={cert}
                    onValidate={handleValidate}
                    onReject={handleReject}
                  />
                ))}
                {filteredCerts.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                    <p>Nessun certificato trovato</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visits Sidebar */}
            <div className="space-y-6">
              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-white">Prossime Visite Mediche</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visits.filter(v => v.status === 'scheduled').length === 0 ? (
                    <p className="text-center text-muted py-4">Nessuna visita programmata</p>
                  ) : (
                    visits.filter(v => v.status === 'scheduled').map((visit) => (
                      <VisitCard key={visit.id} visit={visit} />
                    ))
                  )}
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <div className="bg-card rounded-xl border border-gray-800 p-4">
                <h4 className="text-sm font-medium text-white mb-3">Azioni Rapide</h4>
                <div className="space-y-2">
                  <Link 
                    href="/company/leave"
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-white">Gestisci Ferie</p>
                      <p className="text-xs text-muted">Vedi tutte le richieste</p>
                    </div>
                  </Link>
                  <Link 
                    href="/company/attendance"
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Users className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-white">Presenze</p>
                      <p className="text-xs text-muted">Verifica timbrature</p>
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
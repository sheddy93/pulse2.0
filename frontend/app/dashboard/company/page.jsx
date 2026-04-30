"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  BarChart3, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  X,
  Download,
  UserPlus,
  Check,
  FileSignature,
  Eye,
  Target,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  UserCog,
  FileUp,
  Send,
  Building2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { ReminderBadge, ReminderBell } from '@/components/reminder-system';
import { cn } from '@/lib/cn';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import api from '@/lib/api';

// ============================================================================
// Company Dashboard Page - Centro Operativo HR
// ============================================================================

export default function CompanyDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tutti');
  const [onboardingCompleted, setOnboardingCompleted] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/dashboard/company/summary/');
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching company dashboard:', err);
      setError(err.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate tasks from real data
  // Backend returns alerts as object: { missing_checkout, pending_approvals }
  const alertsObj = dashboardData?.alerts || {};
  const urgentAlerts = typeof alertsObj === 'object' && !Array.isArray(alertsObj)
    ? (alertsObj.missing_checkout || 0) + (alertsObj.pending_approvals || 0)
    : (Array.isArray(alertsObj) ? alertsObj.filter(a => a.urgent).length : 0);
  const pendingDocsCount = dashboardData?.documents?.filter(d => d.status === 'pending').length || 0;
  const pendingLeavesCount = dashboardData?.pending_leaves?.length || 0;
  const totalPendingTasks = urgentAlerts + pendingDocsCount + pendingLeavesCount;

  // Calculate KPI data
  const kpiData = [
    {
      title: 'Presenti Oggi',
      value: dashboardData?.today_attendance?.present || 0,
      subtitle: `di ${dashboardData?.today_attendance?.total || 0} totali`,
      action: 'Vedi presenze',
      icon: CheckCircle,
      color: 'success',
    },
    {
      title: 'Ferie da Approvare',
      value: pendingLeavesCount,
      subtitle: 'in attesa',
      action: 'Gestisci',
      icon: Calendar,
      color: 'warning',
    },
    {
      title: 'Documenti da Firmare',
      value: pendingDocsCount,
      subtitle: 'in attesa',
      action: 'Firma ora',
      icon: FileText,
      color: 'danger',
    },
    {
      title: 'Alert Anomalie',
      value: urgentAlerts,
      subtitle: 'urgenti',
      action: 'Risolvi',
      icon: AlertCircle,
      color: 'info',
    },
  ];

  // Filter employees
  const employees = dashboardData?.employees || [];
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Tutti' || emp.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Attivo</span>;
      case 'absent':
        return <span className="badge badge-warning">Assente</span>;
      case 'pending':
        return <span className="badge badge-danger">In attesa</span>;
      default:
        return <span className="badge badge-neutral">Neutro</span>;
    }
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case 'danger':
        return { bg: 'bg-danger/10', border: 'border-danger/30', icon: 'text-danger', badge: 'bg-danger/10 text-danger' };
      case 'warning':
        return { bg: 'bg-warning/10', border: 'border-warning/30', icon: 'text-warning', badge: 'bg-warning/10 text-warning' };
      case 'info':
        return { bg: 'bg-info/10', border: 'border-info/30', icon: 'text-info', badge: 'bg-info/10 text-info' };
      default:
        return { bg: 'bg-muted', border: 'border-border', icon: 'text-muted', badge: 'bg-muted text-muted' };
    }
  };

  // Determine next action
  const getNextAction = () => {
    if (urgentAlerts > 0) {
      return {
        title: `Risolvi ${urgentAlerts} Alert Urgente${urgentAlerts > 1 ? 'i' : ''}`,
        description: 'Ci sono situazioni critiche che richiedono attenzione immediata.',
        icon: AlertTriangle,
        color: 'danger',
        primaryBtn: 'Gestisci Alert',
        secondaryBtn: 'Vedi Dettagli'
      };
    }
    if (pendingLeavesCount > 0) {
      return {
        title: `Approva ${pendingLeavesCount} Richiesta${pendingLeavesCount > 1 ? 'e' : 'a'} Ferie`,
        description: `${pendingLeavesCount} dipendent${pendingLeavesCount > 1 ? 'i sono' : 'e e'} in attesa di approvazione ferie.`,
        icon: Calendar,
        color: 'warning',
        primaryBtn: 'Approva Ferie',
        secondaryBtn: 'Rivedi'
      };
    }
    if (pendingDocsCount > 0) {
      return {
        title: `Firma ${pendingDocsCount} Document${pendingDocsCount > 1 ? 'i' : 'o'}`,
        description: 'Documenti aziendali in attesa della tua firma.',
        icon: FileSignature,
        color: 'info',
        primaryBtn: 'Firma Documenti',
        secondaryBtn: 'Rivedi'
      };
    }
    return {
      title: 'Tutto sotto Controllo!',
      description: 'Non ci sono azioni urgenti. La tua azienda e gestita perfettamente.',
      icon: CheckCircle2,
      color: 'success',
      primaryBtn: null,
      secondaryBtn: 'Vedi Report'
    };
  };

  const nextAction = getNextAction();
  const NextActionIcon = nextAction.icon;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-64 bg-muted rounded" />
        <ErrorState
          title="Impossibile caricare il dashboard"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  // Empty state when no data - Guided with CTA
  if (!dashboardData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-64 bg-muted rounded" />
        <EmptyState
          icon={Building2}
          title="Benvenuto nel Centro Operativo HR"
          description="Inizia configurando la tua azienda aggiungendo il primo dipendente. Potrai gestire presenze, ferie, documenti e molto altro."
          action="Aggiungi il Primo Dipendente"
          href="/company/employees/new"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header - Task-Driven */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centro Operativo HR</h1>
          <p className="text-sm text-muted">{totalPendingTasks} azioni in attesa</p>
        </div>
        <div className="flex items-center gap-2">
          {dashboardData?.reminder_count > 0 && (
            <ReminderBell count={dashboardData.reminder_count} />
          )}
          {totalPendingTasks > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-danger" />
              <span className="text-sm font-semibold text-danger">{totalPendingTasks} task</span>
            </div>
          )}
        </div>
      </div>

      {/* 1. NEXT ACTION CARD - Priorita #1 */}
      <Card className={cn(
        "border-2 overflow-hidden animate-fade-in",
        nextAction.color === 'danger' && "border-danger/30 bg-danger/5",
        nextAction.color === 'warning' && "border-warning/30 bg-warning/5",
        nextAction.color === 'info' && "border-info/30 bg-info/5",
        nextAction.color === 'success' && "border-success/30 bg-success/5"
      )}>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0",
              nextAction.color === 'danger' && "bg-danger/20",
              nextAction.color === 'warning' && "bg-warning/20",
              nextAction.color === 'info' && "bg-info/20",
              nextAction.color === 'success' && "bg-success/20"
            )}>
              <NextActionIcon className={cn(
                "w-8 h-8",
                nextAction.color === 'danger' && "text-danger",
                nextAction.color === 'warning' && "text-warning",
                nextAction.color === 'info' && "text-info",
                nextAction.color === 'success' && "text-success"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Azione Consigliata #1</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{nextAction.title}</h3>
              <p className="text-sm text-muted mb-4">{nextAction.description}</p>
              {nextAction.primaryBtn && (
                <div className="flex gap-3">
                  <button className={cn(
                    "btn py-2.5 px-5 text-sm font-semibold",
                    nextAction.color === 'danger' && "bg-danger text-white hover:bg-danger/90",
                    nextAction.color === 'warning' && "bg-warning text-white hover:bg-warning/90",
                    nextAction.color === 'info' && "bg-info text-white hover:bg-info/90",
                    nextAction.color === 'success' && "bg-success text-white hover:bg-success/90"
                  )}>
                    {nextAction.primaryBtn}
                  </button>
                  {nextAction.secondaryBtn && (
                    <button className="btn btn-outline py-2.5 px-5 text-sm">
                      {nextAction.secondaryBtn}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Checklist - Prossimi step */}
      <OnboardingChecklist
        role="company"
        initialCompleted={onboardingCompleted}
        onTaskComplete={(taskId, completed) => setOnboardingCompleted(completed)}
        maxVisible={3}
      />

      {/* 2. TASK PENDING SECTION */}
      {(pendingLeavesCount > 0 || pendingDocsCount > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ferie da Approvare */}
          {pendingLeavesCount > 0 && dashboardData?.pending_leaves && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-warning" />
                    Ferie da Approvare
                  </CardTitle>
                  <span className="badge badge-warning">{pendingLeavesCount}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.pending_leaves.map((leave) => (
                  <div key={leave.id} className="p-4 rounded-lg bg-white border border-border hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{leave.name}</p>
                        <p className="text-xs text-muted">{leave.type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          leave.priority === 'high' ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                        )}>
                          {leave.days} giorni
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted mb-3">{leave.period}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 btn btn-sm bg-success/10 text-success hover:bg-success/20 py-2">
                        <Check className="w-4 h-4" />
                        Approva
                      </button>
                      <button className="flex-1 btn btn-sm bg-danger/10 text-danger hover:bg-danger/20 py-2">
                        <X className="w-4 h-4" />
                        Rifiuta
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documenti da Firmare */}
          {pendingDocsCount > 0 && dashboardData?.documents && (
            <Card className="border-info/30 bg-info/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-info" />
                    Documenti da Firmare
                  </CardTitle>
                  <span className="badge badge-info">{pendingDocsCount}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.documents.filter(d => d.status === 'pending').map((doc) => (
                  <div key={doc.id} className="p-4 rounded-lg bg-white border border-border hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-info/10">
                        <FileSignature className="w-4 h-4 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{doc.title}</p>
                        <p className="text-xs text-muted mt-1">{doc.date} - {doc.type}</p>
                      </div>
                    </div>
                    <button className="w-full btn btn-sm bg-info text-white hover:bg-info/90 py-2">
                      <FileText className="w-4 h-4" />
                      Firma Documento
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 3. KPI UTILI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted font-medium">{kpi.title}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-foreground">{kpi.value}</span>
                      {kpi.subtitle && (
                        <span className="text-xs text-muted">{kpi.subtitle}</span>
                      )}
                    </div>
                    <button className="mt-2 text-xs text-primary hover:underline font-medium">
                      {kpi.action}
                    </button>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-lg",
                    kpi.color === 'primary' && "bg-primary/10",
                    kpi.color === 'success' && "bg-success/10",
                    kpi.color === 'warning' && "bg-warning/10",
                    kpi.color === 'info' && "bg-info/10",
                    kpi.color === 'danger' && "bg-danger/10"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      kpi.color === 'primary' && "text-primary",
                      kpi.color === 'success' && "text-success",
                      kpi.color === 'warning' && "text-warning",
                      kpi.color === 'info' && "text-info",
                      kpi.color === 'danger' && "text-danger"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Elenco Dipendenti</CardTitle>
                  <CardDescription>{filteredEmployees.length} dipendenti trovati</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cerca dipendente..."
                      className="input pl-9 py-2 w-full sm:w-56"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="input py-2 w-full sm:w-32"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="Tutti">Tutti</option>
                    <option value="active">Attivi</option>
                    <option value="absent">Assenti</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredEmployees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dipendente</TableHead>
                      <TableHead>Reparto</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {employee.avatar || employee.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{employee.name}</p>
                              <p className="text-xs text-muted">{employee.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{employee.department}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(employee.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 rounded-md hover:bg-bg-muted transition-colors" title="Visualizza">
                              <Eye className="w-4 h-4 text-muted" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nessun dipendente aggiunto</h3>
                  <p className="text-sm text-muted mb-4 max-w-sm mx-auto">
                    Aggiungi il primo dipendente per iniziare a gestire presenze, documenti e ferie.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/company/employees/new'}
                    className="btn bg-primary text-white hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Dipendente
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* 4. QUICK ACTIONS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Azioni Rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button 
                onClick={() => window.location.href = '/company/employees/new'}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">Aggiungi Dipendente</p>
                  <p className="text-xs text-muted">Registra nuovo dipendente</p>
                </div>
                <Plus className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </button>

              <button 
                onClick={() => window.location.href = '/company/leaves'}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-success/5 hover:border-success/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                  <Calendar className="w-4 h-4 text-success" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">Approva Ferie</p>
                  <p className="text-xs text-muted">{pendingLeavesCount} richieste</p>
                </div>
                <Check className="w-4 h-4 text-muted group-hover:text-success transition-colors" />
              </button>

              <button 
                onClick={() => window.location.href = '/company/documents'}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-info/5 hover:border-info/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-info/10 group-hover:bg-info/20 transition-colors">
                  <FileUp className="w-4 h-4 text-info" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">Carica Documento</p>
                  <p className="text-xs text-muted">Upload documento aziendale</p>
                </div>
                <FileText className="w-4 h-4 text-muted group-hover:text-info transition-colors" />
              </button>

              <button 
                onClick={() => window.location.href = '/company/reports'}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/5 hover:border-accent/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">Genera Report</p>
                  <p className="text-xs text-muted">Esporta dati presenze</p>
                </div>
                <Download className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
              </button>

              <button 
                onClick={() => window.location.href = '/company/consultants/invite'}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-warning/5 hover:border-warning/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                  <Send className="w-4 h-4 text-warning" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">Invita Consulente</p>
                  <p className="text-xs text-muted">Associa consulente HR</p>
                </div>
                <UserCog className="w-4 h-4 text-muted group-hover:text-warning transition-colors" />
              </button>
            </CardContent>
          </Card>

          {/* Presenze Odierne */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Presenze Oggi</CardTitle>
                  <CardDescription>{dashboardData?.today_date || new Date().toLocaleDateString('it-IT')}</CardDescription>
                </div>
                <span className="badge badge-success">
                  {dashboardData?.today_attendance?.present || 0}/{dashboardData?.today_attendance?.total || 0}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData?.today_checkins && dashboardData.today_checkins.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {dashboardData.today_checkins.map((checkin) => (
                      <div key={checkin.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-xs font-semibold text-success">
                              {checkin.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface flex items-center justify-center">
                              <Check className="w-2 h-2 text-success" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{checkin.name}</p>
                            <p className="text-xs text-muted">{checkin.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{checkin.time}</p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            checkin.status === 'check_in' && "bg-success/10 text-success",
                            checkin.status === 'late' && "bg-warning/10 text-warning"
                          )}>
                            {checkin.status === 'check_in' ? 'OK' : 'Ritardo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <button className="w-full btn btn-outline py-2 text-sm">
                      <Clock className="w-4 h-4" />
                      Vedi tutte le presenze
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <Clock className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-sm text-muted">Nessuna presenza oggi</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert/Anomalies Card */}
          {urgentAlerts > 0 && dashboardData?.alerts && (
            <Card className="border-danger/30 bg-danger/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-danger" />
                    Alert Urgenti
                  </CardTitle>
                  <span className="badge badge-danger">{urgentAlerts}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.alerts.filter(a => a.urgent).map((alert) => {
                  const styles = getAlertStyles(alert.type);
                  const AlertIcon = alert.icon ? 
                    ({ AlertCircle, AlertTriangle, FileText }[alert.icon] || AlertCircle) : 
                    AlertCircle;
                  return (
                    <div key={alert.id} className={cn("flex items-center gap-4 p-4 rounded-lg border animate-fade-in", styles.bg, styles.border)}>
                      <div className={cn("p-2.5 rounded-lg bg-surface", styles.icon)}>
                        <AlertIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{alert.title}</p>
                        <p className="text-xs text-muted mt-0.5">{alert.description}</p>
                      </div>
                      <button className="btn btn-sm bg-danger text-white hover:bg-danger/90">
                        Risolvi
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 5. ATTIVITA RECENTE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-muted" />
            Attivita Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_activity.map((activity) => {
                const ActivityIcon = activity.icon ? 
                  ({ UserPlus, CheckCircle, FileSignature }[activity.icon] || Activity) : 
                  Activity;
                return (
                  <div key={activity.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      activity.color === 'success' && "bg-success/10",
                      activity.color === 'info' && "bg-info/10",
                      activity.color === 'primary' && "bg-primary/10"
                    )}>
                      <ActivityIcon className={cn(
                        "w-5 h-5",
                        activity.color === 'success' && "text-success",
                        activity.color === 'info' && "text-info",
                        activity.color === 'primary' && "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted mt-0.5">{activity.user}</p>
                    </div>
                    <span className="text-xs text-muted">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-4">Nessuna attivita recente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

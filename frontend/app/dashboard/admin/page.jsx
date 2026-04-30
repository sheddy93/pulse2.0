"use client";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import {
  Building2,
  Users,
  CreditCard,
  Shield,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Server,
  Database,
  UserPlus,
  FileText,
  Wifi,
  WifiOff,
  Clock
} from "lucide-react";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";

// ============================================================================
// Componente System Health Indicator
// ============================================================================

function SystemHealthIndicator({ health }) {
  const statusConfig = {
    healthy: {
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/30",
      icon: Wifi,
      label: "Operativo",
      description: "Tutti i sistemi funzionano"
    },
    degraded: {
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/30",
      icon: AlertTriangle,
      label: "Degradato",
      description: "Prestazioni ridotte"
    },
    outage: {
      color: "text-danger",
      bg: "bg-danger/10",
      border: "border-danger/30",
      icon: WifiOff,
      label: "Non Operativo",
      description: "Servizio interrotto"
    }
  };

  const config = statusConfig[health?.status || "healthy"];
  const IconComponent = config.icon;
  const uptimePercent = health?.uptime || null;

  return (
    <div className={cn("p-5 rounded-xl border", config.bg, config.border)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bg)}>
            <IconComponent className={cn("w-5 h-5", config.color)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">System Health</p>
            <p className="text-xs text-muted">{config.label}</p>
          </div>
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", config.bg, config.color)}>
          {uptimePercent}%
        </span>
      </div>
      <p className="text-xs text-muted">{config.description}</p>
      {health?.lastCheck && (
        <p className="text-xs text-muted mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Ultimo check: {health.lastCheck}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Componente Billing Status
// ============================================================================

function BillingStatusCard({ billing }) {
  const pendingPayments = billing?.pendingPayments || 0;
  const totalRevenue = billing?.totalRevenue || 0;

  return (
    <div className="p-5 rounded-xl border bg-surface border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Billing Status</p>
          <p className="text-xs text-muted">Stato pagamenti</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Entrate Mensili</span>
          <span className="text-sm font-semibold text-success">{totalRevenue.toLocaleString('it-IT')} EUR</span>
        </div>
        {pendingPayments > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Pagamenti Pendenti</span>
            <span className="text-sm font-semibold text-warning">{pendingPayments}</span>
          </div>
        )}
        {pendingPayments > 0 && (
          <button className="w-full btn btn-sm bg-warning text-white hover:bg-warning/90 mt-2">
            Gestisci Pagamenti
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Componente KPI Card per Platform Health
// ============================================================================

function PlatformKpiCard({ title, value, subtitle, action, icon: Icon, accentColor }) {
  const accentClasses = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger bg-danger/10",
    info: "text-info bg-info/10",
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden transition-all hover:border-border-hover hover:shadow-md cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-muted mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-text-primary">{value}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-2">{subtitle}</p>}
          {action && (
            <button className="mt-2 text-xs text-primary hover:underline font-medium">
              {action}
            </button>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", accentClasses[accentColor])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Componente Recent Companies Table
// ============================================================================

function RecentCompaniesTable({ companies }) {
  const statusStyles = {
    active: "bg-success/10 text-success",
    trial: "bg-warning/10 text-warning",
    suspended: "bg-danger/10 text-danger",
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Aziende Recenti</h2>
          <p className="text-sm text-text-muted">Ultime aziende registrate</p>
        </div>
        <Link
          href="/admin/companies"
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          Vedi tutte
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                Azienda
              </th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                Settore
              </th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                Utenti
              </th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                Piano
              </th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                Stato
              </th>
              <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-bg-muted/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{company.name}</p>
                      <p className="text-xs text-text-muted">Dal {company.since}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-text-secondary">{company.industry}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-text-primary font-medium">{company.users}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-text-secondary">{company.plan}</span>
</td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs font-medium px-2 py-1 rounded-full", statusStyles[company.status])}>
                    {company.status === "active" ? "Attiva" : company.status === "trial" ? "Trial" : "Sospesa"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-muted rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-muted rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-muted rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Admin Dashboard Page - Platform Health Center
// ============================================================================

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/dashboard/admin/summary/');
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate pending tasks from real data
  const urgentAlerts = dashboardData?.system_alerts?.filter(a => a.urgent).length || 0;
  const pendingRegistrationsCount = dashboardData?.pending_registrations?.length || 0;
  const criticalErrors = dashboardData?.system_errors?.filter(e => e.severity === 'critical').length || 0;
  const totalPendingTasks = urgentAlerts + pendingRegistrationsCount + criticalErrors;

  // Determine next action
  const getNextAction = () => {
    if (criticalErrors > 0) {
      const criticalError = dashboardData?.system_errors?.find(e => e.severity === 'critical');
      return {
        title: `Errore Critico di Sistema`,
        description: `${criticalError?.message || 'Errore sistema'} - ${criticalError?.count || 0} occorrenze`,
        icon: AlertTriangle,
        color: 'danger',
        primaryBtn: 'Risolvi Ora',
        secondaryBtn: 'Vedi Log'
      };
    }
    
    if (urgentAlerts > 0) {
      const urgentAlert = dashboardData?.system_alerts?.find(a => a.urgent);
      return {
        title: urgentAlert?.title || 'Alert di Sistema',
        description: urgentAlert?.message || 'Ci sono alert urgenti',
        icon: Shield,
        color: 'warning',
        primaryBtn: 'Gestisci Alert',
        secondaryBtn: 'Vedi Dettagli'
      };
    }
    
    if (pendingRegistrationsCount > 0) {
      return {
        title: `${pendingRegistrationsCount} Nuov${pendingRegistrationsCount > 1 ? 'e' : 'a'} Registrazion${pendingRegistrationsCount > 1 ? 'i' : 'e'}`,
        description: `Ci sono ${pendingRegistrationsCount} aziende in attesa di approvazione.`,
        icon: UserPlus,
        color: 'info',
        primaryBtn: 'Approva Aziende',
        secondaryBtn: 'Rivedi'
      };
    }
    
    return {
      title: 'Sistema Operativo!',
      description: 'Tutti i sistemi funzionano correttamente. Nessuna azione richiesta.',
      icon: CheckCircle2,
      color: 'success',
      primaryBtn: null,
      secondaryBtn: 'Vedi Dashboard'
    };
  };

  const nextAction = getNextAction();
  const NextActionIcon = nextAction.icon;

  // Loading state
  if (loading) {
    return (
      <AuthGuard allowedRoles={["super_admin", "platform_owner"]}>
        <AppShell user={{ role: "super_admin" }} role="admin">
          <div className="space-y-6">
            <div className="h-10 w-64 bg-muted rounded animate-pulse" />
            <LoadingSkeleton variant="card" />
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <AuthGuard allowedRoles={["super_admin", "platform_owner"]}>
        <AppShell user={{ role: "super_admin" }} role="admin">
          <div className="space-y-6">
            <div className="h-10 w-64 bg-muted rounded" />
            <ErrorState
              title="Impossibile caricare il dashboard"
              message={error}
              onRetry={fetchDashboardData}
            />
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  // Empty state when no data - Guided with CTA
  if (!dashboardData) {
    return (
      <AuthGuard allowedRoles={["super_admin", "platform_owner"]}>
        <AppShell user={{ role: "super_admin" }} role="admin">
          <div className="space-y-6">
            <div className="h-10 w-64 bg-muted rounded" />
            <EmptyState
              icon={Server}
              title="Benvenuto nel Platform Health Center"
              description="Inizia a gestire la tua piattaforma aggiungendo la prima azienda. Monitora utenti, billing e stato del sistema."
              action="Aggiungi la Prima Azienda"
              href="/admin/companies/new"
            />
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const data = dashboardData;

  return (
    <AuthGuard allowedRoles={["super_admin", "platform_owner"]}>
      <AppShell user={{ role: "super_admin" }} role="admin">
        <div className="space-y-6">
          {/* Header - Platform Health Center */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Platform Health Center</h1>
              <p className="text-sm text-text-muted mt-1">
                {totalPendingTasks} azioni di sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              {totalPendingTasks > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-danger" />
                  <span className="text-sm font-semibold text-danger">{totalPendingTasks} urgenti</span>
                </div>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-bg-muted transition-colors">
                <Activity className="w-4 h-4" />
                Esporta Report
              </button>
            </div>
          </div>

          {/* 1. NEXT ACTION CARD - Azione Consigliata #1 */}
          <div className={cn(
            "border-2 rounded-xl overflow-hidden animate-fade-in p-6",
            nextAction.color === 'danger' && "border-danger/30 bg-danger/5",
            nextAction.color === 'warning' && "border-warning/30 bg-warning/5",
            nextAction.color === 'info' && "border-info/30 bg-info/5",
            nextAction.color === 'success' && "border-success/30 bg-success/5"
          )}>
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
                <h3 className="text-xl font-bold text-text-primary mb-2">{nextAction.title}</h3>
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
          </div>

          {/* 2. SYSTEM HEALTH + BILLING STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Health Indicator */}
            <SystemHealthIndicator 
              health={data.system_health || { status: 'healthy', uptime: null, lastCheck: 'Ora' }} 
            />
            
            {/* Billing Status */}
            <BillingStatusCard 
              billing={data.billing_summary || { totalRevenue: 0, pendingPayments: 0 }}
            />
          </div>

          {/* 3. TASK PENDING SECTION */}
          {(urgentAlerts > 0 || pendingRegistrationsCount > 0 || criticalErrors > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Alerts */}
              {urgentAlerts > 0 && data.system_alerts && (
                <div className="card p-5 border-warning/30 bg-warning/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <Shield className="w-5 h-5 text-warning" />
                      Alert di Sistema
                    </h3>
                    <span className="badge badge-warning">{urgentAlerts}</span>
                  </div>
                  <div className="space-y-3">
                    {data.system_alerts.filter(a => a.urgent).map((alert) => (
                      <div key={alert.id} className="p-3 rounded-lg bg-white border border-border">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{alert.title}</p>
                            <p className="text-xs text-muted mt-1">{alert.message}</p>
                          </div>
                        </div>
                        <button className="w-full mt-2 btn btn-sm bg-warning text-white hover:bg-warning/90">
                          Risolvi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Registrations */}
              {pendingRegistrationsCount > 0 && data.pending_registrations && (
                <div className="card p-5 border-info/30 bg-info/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-info" />
                      Nuove Registrazioni
                    </h3>
                    <span className="badge badge-info">{pendingRegistrationsCount}</span>
                  </div>
                  <div className="space-y-3">
                    {data.pending_registrations.map((reg) => (
                      <div key={reg.id} className="p-3 rounded-lg bg-white border border-border">
                        <p className="text-sm font-medium text-foreground mb-1">{reg.company}</p>
                        <p className="text-xs text-muted mb-2">{reg.users} utenti - {reg.plan}</p>
                        <div className="flex gap-2">
                          <button className="flex-1 btn btn-sm bg-success/10 text-success hover:bg-success/20">
                            Approva
                          </button>
                          <button className="flex-1 btn btn-sm bg-danger/10 text-danger hover:bg-danger/20">
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Errors */}
              {criticalErrors > 0 && data.system_errors && (
                <div className="card p-5 border-danger/30 bg-danger/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <Database className="w-5 h-5 text-danger" />
                      Errori Recenti
                    </h3>
                    <span className="badge badge-danger">{criticalErrors}</span>
                  </div>
                  <div className="space-y-3">
                    {data.system_errors.filter(e => e.severity === 'critical').map((error) => (
                      <div key={error.id} className="p-3 rounded-lg bg-white border border-border">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-danger mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{error.type}</p>
                            <p className="text-xs text-muted mt-1">{error.message}</p>
                            <p className="text-xs text-danger mt-1 font-medium">{error.count} occorrenze</p>
                          </div>
                        </div>
                        <button className="w-full mt-2 btn btn-sm bg-danger text-white hover:bg-danger/90">
                          Debug Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. KPI UTILI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlatformKpiCard
              title="Aziende Attive"
              value={data.platform_health?.active_companies || 0}
              subtitle="sottoscrizioni attive"
              action="Vedi tutte"
              icon={Building2}
              accentColor="primary"
            />
            <PlatformKpiCard
              title="Utenti Attivi"
              value={(data.platform_health?.total_users || 0).toLocaleString("it-IT")}
              subtitle="Utenti unici sulla piattaforma"
              action="Gestisci"
              icon={Users}
              accentColor="info"
            />
            <PlatformKpiCard
              title="Sottoscrizioni Attive"
              value={data.platform_health?.active_subscriptions || 0}
              subtitle="professional, enterprise"
              action="Vedi piani"
              icon={CreditCard}
              accentColor="success"
            />
            <PlatformKpiCard
              title="Alert di Sistema"
              value={data.platform_health?.system_alerts || 0}
              subtitle={`${urgentAlerts} urgenti`}
              action="Risolvi"
              icon={AlertCircle}
              accentColor="danger"
            />
          </div>

          {/* Recent Companies Table */}
          {data.recent_companies && data.recent_companies.length > 0 && (
            <RecentCompaniesTable companies={data.recent_companies} />
          )}

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 5. QUICK ACTIONS */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Azioni Rapide
                </h2>
              </div>

              <div className="p-4 space-y-3">
                <Link
                  href="/admin/companies/new"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text-primary">Aggiungi Azienda</p>
                    <p className="text-xs text-text-muted">Registra nuova azienda</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted" />
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text-primary">Gestisci Utenti</p>
                    <p className="text-xs text-text-muted">Amministra utenti piattaforma</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted" />
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text-primary">Report Analytics</p>
                    <p className="text-xs text-text-muted">Visualizza statistiche</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted" />
                </Link>
              </div>
            </div>

            {/* Platform Stats Summary */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-info/10">
                    <BarChart3 className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Statistiche</h2>
                    <p className="text-sm text-text-muted">Metriche piattaforma</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-text-muted">MRR</span>
                  <span className="text-sm font-medium text-success">{(data.billing_summary?.mrr || 0).toLocaleString('it-IT')} EUR</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-text-muted">ARR</span>
                  <span className="text-sm font-medium text-success">{(data.billing_summary?.arr || 0).toLocaleString('it-IT')} EUR</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-text-muted">Fatture attive</span>
                  <span className="text-sm font-medium text-text-primary">{data.billing_summary?.active_invoices || 0}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-text-muted">Ticket aperti</span>
                  <span className="text-sm font-medium text-text-primary">{data.billing_summary?.open_tickets || 0}</span>
                </div>
              </div>
            </div>

            {/* 6. ATTIVITA RECENTE */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Activity className="w-5 h-5 text-muted" />
                  Attivita Recente
                </h2>
              </div>

              <div className="p-5 space-y-3">
                {data.recent_activity && data.recent_activity.length > 0 ? (
                  data.recent_activity.map((activity) => {
                    const ActivityIcon = activity.icon ? 
                      ({ Building2, Server, CheckCircle }[activity.icon] || Activity) : 
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
                          <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                          <p className="text-xs text-text-muted mt-0.5">{activity.detail}</p>
                        </div>
                        <span className="text-xs text-muted">{activity.time}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center">
                    <Activity className="w-10 h-10 text-muted mx-auto mb-3" />
                    <p className="text-sm text-muted">Nessuna attivita recente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

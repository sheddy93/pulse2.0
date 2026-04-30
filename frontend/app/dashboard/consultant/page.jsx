"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Users,
  ChevronDown,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  X,
  Target,
  Zap,
  Activity,
  CheckCircle2,
  FileSignature,
  BarChart3,
  UserPlus,
  Send,
  Copy,
  Link2,
  UserCog,
  Inbox,
  ClipboardCheck,
  Sparkles,
  IdCard,
  Building,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/cn";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function KpiCard({ icon: Icon, label, value, action, variant = "default" }) {
  const variants = {
    default: "bg-surface border-border",
    primary: "bg-primary/5 border-primary/20",
    warning: "bg-warning/5 border-warning/20",
    danger: "bg-danger/5 border-danger/20",
    success: "bg-success/5 border-success/20",
  };

  const iconColors = {
    default: "text-primary",
    primary: "text-primary",
    warning: "text-warning",
    danger: "text-danger",
    success: "text-success",
  };

  return (
    <div className={cn("card p-5 border hover:shadow-md transition-shadow", variants[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted font-medium">{label}</p>
          <h3 className="text-3xl font-bold text-text-primary mt-1">{value}</h3>
          {action && (
            <button className="mt-2 text-xs text-primary hover:underline font-medium">
              {action}
            </button>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColors[variant], variants[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, onClick, badge, variant = "default" }) {
  const variants = {
    default: "border-border hover:border-primary/30 hover:bg-primary/5",
    primary: "border-primary/30 bg-primary/5",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
  };

  const iconColors = {
    default: "text-primary",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border bg-surface text-left transition-all hover:shadow-md group",
        variants[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", variants[variant])}>
          <Icon className={cn("w-5 h-5", iconColors[variant])} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
{badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1">{description}</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function CompanyCard({ company, onClick, isSelected }) {
  const hasPendingItems = (company.pending_tasks || 0) > 0 || (company.pending_docs || 0) > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
        isSelected
          ? "bg-primary/5 border-primary/30"
          : "bg-surface border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary truncate">{company.name}</h4>
          <p className="text-xs text-muted mt-0.5">{company.employees || 0} dipendenti</p>
        </div>
        {hasPendingItems && (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-warning/10 text-warning">
            {((company.pending_tasks || 0) + (company.pending_docs || 0))}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-sm font-bold text-text-primary">{company.employees || 0}</p>
          <p className="text-xs text-muted">Dipendenti</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-text-primary">{company.pending_tasks || 0}</p>
          <p className="text-xs text-muted">Task</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-text-primary">{company.pending_docs || 0}</p>
          <p className="text-xs text-muted">Docs</p>
        </div>
      </div>
    </div>
  );
}

function ConsultantIdCard({ consultantId, onCopyId }) {
  const formatId = (id) => {
    if (!id) return "CONS-------";
    const str = String(id).padStart(6, '0');
    return `CONS-${str}`;
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <IdCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider">ID Consulente</p>
            <p className="text-lg font-bold text-text-primary font-mono">{formatId(consultantId)}</p>
          </div>
        </div>
        <button
          onClick={onCopyId}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-white border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copia ID
        </button>
      </div>
    </div>
  );
}

function LinkCompanyCard({ onSubmit, inputValue, setInputValue, isLoading, error }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-primary">Collega azienda</h4>
          <p className="text-xs text-muted">Inserisci l'ID azienda per collegarti</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="ID azienda (es. COMP-123456)"
          className="input flex-1 text-sm"
        />
        <button
          onClick={onSubmit}
          disabled={!inputValue.trim() || isLoading}
          className="btn btn-primary px-4 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-danger mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - Dashboard Consulente
// ============================================================================

export default function ConsultantDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyLinkInput, setCompanyLinkInput] = useState("");
  const [linkingCompany, setLinkingCompany] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/dashboard/consultant/summary/');
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching consultant dashboard:', err);
      setError(err.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCopyId = async () => {
    const consultantId = dashboardData?.consultant_id || dashboardData?.user?.id || "";
    const formattedId = `CONS-${String(consultantId).padStart(6, '0')}`;
    try {
      await navigator.clipboard.writeText(formattedId);
    } catch (e) {
      console.log('Could not copy to clipboard');
    }
  };

  const handleLinkCompany = async () => {
    if (!companyLinkInput.trim()) return;
    
    setLinkingCompany(true);
    setLinkError(null);
    
    try {
      await api.post('/dashboard/consultant/link-company/', {
        company_id: companyLinkInput.trim()
      });
      setCompanyLinkInput("");
      fetchDashboardData();
    } catch (err) {
      setLinkError(err.message || "Errore nel collegamento dell'azienda");
    } finally {
      setLinkingCompany(false);
    }
  };

  // Calculate KPIs
  const kpis = {
    linkedCompanies: dashboardData?.linked_companies?.length || dashboardData?.managed_companies?.length || 0,
    managedEmployees: dashboardData?.linked_companies?.reduce((sum, c) => sum + (c.employees || 0), 0) || 
                      dashboardData?.managed_companies?.reduce((sum, c) => sum + (c.employees || 0), 0) || 0,
    pendingRequests: dashboardData?.pending_requests || 0,
    documentsToCheck: dashboardData?.documents_to_review || 0,
  };

  const linkedCompanies = dashboardData?.linked_companies || dashboardData?.managed_companies || [];

  // Loading state
  if (loading) {
    return (
      <AppShell user={{ role: "labor_consultant" }} role="consultant">
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted/50 rounded animate-pulse" />
          </div>
          <LoadingSkeleton variant="card" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
          </div>
          <LoadingSkeleton variant="card" />
        </div>
      </AppShell>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <AppShell user={{ role: "labor_consultant" }} role="consultant">
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-72 bg-muted/50 rounded" />
          </div>
          <ErrorState
            title="Impossibile caricare il dashboard"
            message={error}
            onRetry={fetchDashboardData}
          />
        </div>
      </AppShell>
    );
  }

  // Empty state when no companies linked
  if (!dashboardData || linkedCompanies.length === 0) {
    return (
      <AppShell user={dashboardData?.user || { role: "labor_consultant" }} role="consultant">
        <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">Dashboard Consulente</h1>
            <p className="text-sm text-muted">Gestisci le aziende clienti e i loro dipendenti</p>
          </div>

          {/* Hero Section */}
          <ConsultantIdCard 
            consultantId={dashboardData?.consultant_id || dashboardData?.user?.id}
            onCopyId={handleCopyId}
          />

          <LinkCompanyCard
            onSubmit={handleLinkCompany}
            inputValue={companyLinkInput}
            setInputValue={setCompanyLinkInput}
            isLoading={linkingCompany}
            error={linkError}
          />

          {/* Empty State */}
          <EmptyState
            icon={Building}
            title="Nessuna azienda collegata"
            description="Collega la tua prima azienda cliente per iniziare a gestire dipendenti, documenti e richieste."
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => setCompanyLinkInput("")}
                  className="btn btn-primary"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Collega azienda
                </button>
                <button className="btn btn-outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Richiedi accesso
                </button>
              </div>
            }
          />

          {/* Quick Actions */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              Prossime azioni
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ActionCard
                icon={Link2}
                title="Collega azienda cliente"
                description="Connettiti a un'azienda esistente"
                variant="primary"
                onClick={() => document.querySelector('input')?.focus()}
              />
              <ActionCard
                icon={Send}
                title="Invita azienda tramite ID"
                description="Invia l'ID consulente ai tuoi clienti"
                onClick={handleCopyId}
                badge="Cons-XXXXXX"
              />
              <ActionCard
                icon={UserPlus}
                title="Crea o importa lavoratori"
                description="Aggiungi dipendenti alle aziende collegate"
                onClick={() => {}}
              />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={dashboardData?.user || { role: "labor_consultant" }} role="consultant">
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-text-primary">Dashboard Consulente</h1>
            <p className="text-sm text-muted">
              {linkedCompanies.length} {linkedCompanies.length === 1 ? 'azienda' : 'aziende'} collegate
              {kpis.managedEmployees > 0 && ` - ${kpis.managedEmployees} dipendenti`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ConsultantIdCard 
              consultantId={dashboardData?.consultant_id || dashboardData?.user?.id}
              onCopyId={handleCopyId}
            />
          </div>
        </div>

        {/* Link Company Card */}
        <LinkCompanyCard
          onSubmit={handleLinkCompany}
          inputValue={companyLinkInput}
          setInputValue={setCompanyLinkInput}
          isLoading={linkingCompany}
          error={linkError}
        />

        {/* Discreet Error Banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-danger/5 border border-danger/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
            <p className="text-sm text-danger flex-1">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="text-xs text-danger hover:underline font-medium"
            >
              Riprova
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Building2}
            label="Aziende collegate"
            value={kpis.linkedCompanies}
            variant="primary"
          />
          <KpiCard
            icon={Users}
            label="Dipendenti gestiti"
            value={kpis.managedEmployees}
            variant="default"
          />
          <KpiCard
            icon={Inbox}
            label="Richieste in attesa"
            value={kpis.pendingRequests}
            variant="warning"
          />
          <KpiCard
            icon={ClipboardCheck}
            label="Documenti da controllare"
            value={kpis.documentsToCheck}
            variant="default"
          />
        </div>

        {/* Prossime Azioni */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            Prossime azioni
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ActionCard
              icon={Link2}
              title="Collega prima azienda cliente"
              description="Inizia gestendo un'azienda"
              variant={linkedCompanies.length === 0 ? "primary" : "default"}
              onClick={() => document.querySelector('input')?.focus()}
              badge={linkedCompanies.length === 0 ? "Da fare" : null}
            />
            <ActionCard
              icon={Send}
              title="Invita azienda tramite ID"
              description="Condividi il tuo ID con i clienti"
              onClick={handleCopyId}
            />
            <ActionCard
              icon={UserPlus}
              title="Crea o importa lavoratori"
description="Aggiungi dipendenti alle aziende"
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Aziende Clienti */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Aziende clienti
            </h3>
            <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
              {linkedCompanies.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca azienda..."
              className="input pl-10 w-full text-sm"
            />
          </div>

          {/* Company Grid */}
          {linkedCompanies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onClick={() => {}}
                  isSelected={false}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="Nessuna azienda"
              description="Collega la tua prima azienda cliente per iniziare."
              action={
                <button 
                  onClick={() => document.querySelector('input')?.focus()}
                  className="btn btn-primary"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Collega azienda
                </button>
              }
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Azioni Rapide */}
          <div className="card p-5">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              Azioni rapide
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-center">
                <Plus className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">Nuova attivita</p>
              </button>
              <button className="p-4 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-center">
                <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">Documenti</p>
              </button>
              <button className="p-4 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-center">
                <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">Aziende</p>
              </button>
              <button className="p-4 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-center">
                <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">Report</p>
              </button>
            </div>
          </div>

          {/* Attivita Recente */}
          <div className="card p-5">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-muted" />
              Attivita recente
            </h3>
            {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recent_activity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                      <p className="text-xs text-muted mt-0.5">{activity.company || 'Sistema'}</p>
                    </div>
                    <span className="text-xs text-muted">{activity.time || 'Ora'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Activity className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Nessuna attivita recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/cn';
import Link from 'next/link';

// Formatter per valute
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Formatter per numeri
const formatNumber = (num) => {
  return new Intl.NumberFormat('it-IT').format(num);
};

// Formatter per percentuali
const formatPercent = (num) => {
  return `${num.toFixed(1)}%`;
};

// ===== KPI CARD COMPONENTS =====

function BusinessKpiCard({ title, value, subtitle, trend, trendValue, icon: Icon, color = 'primary', delay = 0 }) {
  const colorClasses = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
    success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
    warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
    danger: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' },
    info: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
  };
  
  const colors = colorClasses[color];
  
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border p-5 relative overflow-hidden",
        "animate-fadeIn hover:scale-[1.02] transition-transform duration-200",
        colors.border
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>
      </div>
      
      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-3 text-xs font-medium",
          trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted'
        )}>
          {trend === 'up' ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : trend === 'down' ? (
            <ArrowDownRight className="w-3 h-3" />
          ) : null}
          <span>{trendValue}</span>
          <span className="text-muted ml-1">vs mese scorso</span>
        </div>
      )}
    </div>
  );
}

function RevenueChart({ data }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Revenue Trend</CardTitle>
          <div className="flex gap-2">
            <select className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none">
              <option>MRR</option>
              <option>ARR</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-end justify-between gap-2">
          {data.map((month, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-gradient-to-t from-primary/40 to-primary rounded-t-sm"
                style={{ height: `${(month.revenue / data[data.length-1].revenue) * 100}%` }}
              />
              <span className="text-xs text-muted">{month.label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-muted">
          <span>Min: {formatCurrency(Math.min(...data.map(d => d.revenue)))}</span>
          <span>Max: {formatCurrency(Math.max(...data.map(d => d.revenue)))}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionFunnel({ data }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((stage, i) => (
          <div key={stage.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{stage.count}</span>
                {i > 0 && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    stage.rate >= 70 ? 'bg-success/10 text-success' :
                    stage.rate >= 40 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                  )}>
                    {stage.rate}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  i === 0 ? "bg-primary" : i === 1 ? "bg-info" : i === 2 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${stage.rate}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlanDistribution({ data }) {
  const colors = {
    starter: 'bg-gray-500',
    professional: 'bg-primary',
    enterprise: 'bg-warning',
    trial: 'bg-info',
  };
  
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Piani Distribuzione</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((plan) => (
            <div key={plan.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", colors[plan.name.toLowerCase()] || 'bg-gray-500')} />
                <span className="text-sm text-white">{plan.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white w-20 text-right">
                  {plan.count} ({plan.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TenantHealthTable({ tenants }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Tenant Health</CardTitle>
          <Link 
            href="/admin/companies"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Vedi tutti <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted border-b border-gray-800">
                <th className="text-left py-3 px-2 font-medium">Azienda</th>
                <th className="text-left py-3 px-2 font-medium">Piano</th>
                <th className="text-center py-3 px-2 font-medium">Utenti</th>
                <th className="text-center py-3 px-2 font-medium">Stato</th>
                <th className="text-right py-3 px-2 font-medium">MRR</th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 8).map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-primary">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      tenant.plan === 'enterprise' ? 'bg-warning/10 text-warning' :
                      tenant.plan === 'professional' ? 'bg-primary/10 text-primary' : 'bg-gray-700 text-gray-400'
                    )}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-muted">{tenant.users}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={cn(
                      "flex items-center justify-center gap-1 text-xs",
                      tenant.status === 'active' ? 'text-success' :
                      tenant.status === 'trial' ? 'text-info' : 'text-danger'
                    )}>
                      {tenant.status === 'active' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : tenant.status === 'trial' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {tenant.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-white">
                    {formatCurrency(tenant.mrr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsList({ alerts }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Alert Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p>Nessun alert critico</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div 
              key={i}
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                alert.severity === 'critical' ? 'bg-danger/5 border-danger/20' :
                alert.severity === 'warning' ? 'bg-warning/5 border-warning/20' : 'bg-info/5 border-info/20'
              )}
            >
              <div className={cn(
                "p-1.5 rounded",
                alert.severity === 'critical' ? 'bg-danger/20 text-danger' :
                alert.severity === 'warning' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'
              )}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{alert.title}</p>
                <p className="text-xs text-muted mt-1">{alert.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted">{alert.time}</span>
                  <Link href={alert.link} className="text-xs text-primary hover:underline">
                    Gestisci
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PaymentFailuresList({ failures }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Pagamenti Falliti</CardTitle>
      </CardHeader>
      <CardContent>
        {failures.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p>Nessun pagamento fallito</p>
          </div>
        ) : (
          <div className="space-y-3">
            {failures.map((failure, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-danger/5 rounded-lg border border-danger/20">
                <div>
                  <p className="text-sm font-medium text-white">{failure.company}</p>
                  <p className="text-xs text-muted">{failure.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-danger">{formatCurrency(failure.amount)}</p>
                  <button className="text-xs text-primary hover:underline mt-1">
                    Riprova
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SystemStatus({ status }) {
  const statusColors = {
    healthy: 'bg-success',
    degraded: 'bg-warning',
    down: 'bg-danger',
  };
  
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.map((service, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", statusColors[service.status])} />
              <span className="text-sm text-white">{service.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{service.latency}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded",
                service.status === 'healthy' ? 'bg-success/10 text-success' :
                service.status === 'degraded' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
              )}>
                {service.status}
              </span>
            </div>
          </div>
        ))}
        <div className="pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Uptime ultimo mese</span>
            <span className="text-success font-semibold">99.7%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== MAIN COMPONENT =====

export default function AdminCockpitPage() {
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Mock data - in produzione sostituire con chiamate API reali
  const metrics = useMemo(() => ({
    mrr: { value: 48500, trend: 'up', trendValue: '+8.2%' },
    arr: { value: 582000, trend: 'up', trendValue: '+12.5%' },
    activeTenants: { value: 142, trend: 'up', trendValue: '+5' },
    trialTenants: { value: 23, trend: 'down', trendValue: '-3' },
    churnRate: { value: 2.1, trend: 'down', trendValue: '-0.3%' },
    conversionRate: { value: 68.5, trend: 'up', trendValue: '+4.2%' },
    mrrChurn: { value: 1250, trend: 'down', trendValue: '€1250 perso' },
    avgRevenue: { value: 342, trend: 'up', trendValue: '+€28' },
  }), [refreshKey]);
  
  const revenueData = useMemo(() => [
    { label: 'Ott', revenue: 32000 },
    { label: 'Nov', revenue: 35000 },
    { label: 'Dic', revenue: 38000 },
    { label: 'Gen', revenue: 41000 },
    { label: 'Feb', revenue: 44500 },
    { label: 'Mar', revenue: 48500 },
  ], []);
  
  const conversionData = useMemo(() => [
    { label: 'Registrati', count: 156, rate: 100 },
    { label: 'Trial attivato', count: 98, rate: 63 },
    { label: 'Onboarding completo', count: 72, rate: 46 },
    { label: 'Convertiti', count: 48, rate: 31 },
  ], []);
  
  const planDistribution= useMemo(() => [
    { name: 'Enterprise', count: 18, percentage: 13 },
    { name: 'Professional', count: 67, percentage: 47 },
    { name: 'Starter', count: 34, percentage: 24 },
    { name: 'Trial', count: 23, percentage: 16 },
  ], []);
  
  const tenantsData = useMemo(() => [
    { id: 1, name: 'Azienda Alpha', plan: 'enterprise', users: 245, status: 'active', mrr: 499 },
    { id: 2, name: 'Beta Corp', plan: 'professional', users: 89, status: 'active', mrr: 199 },
    { id: 3, name: 'Gamma SRL', plan: 'professional', users: 156, status: 'active', mrr: 299 },
    { id: 4, name: 'Delta SpA', plan: 'trial', users: 12, status: 'trial', mrr: 0 },
    { id: 5, name: 'Epsilon SRL', plan: 'starter', users: 8, status: 'active', mrr: 49 },
    { id: 6, name: 'Zeta Corp', plan: 'enterprise', users: 312, status: 'active', mrr: 999 },
    { id: 7, name: 'Eta SpA', plan: 'professional', users: 45, status: 'active', mrr: 149 },
    { id: 8, name: 'Theta SRL', plan: 'trial', users: 5, status: 'trial', mrr: 0 },
  ], []);
  
  const alerts = useMemo(() => [
    {
      severity: 'critical',
      title: '3 tenant con pagamenti falliti',
      description: 'Richiedono attenzione immediata per evitare sospensione',
      time: '2 ore fa',
      link: '/admin/companies?filter=failed'
    },
    {
      severity: 'warning',
      title: '5 trial in scadenza questa settimana',
      description: 'Considera follow-up per conversione',
      time: '1 giorno fa',
      link: '/admin/companies?filter=expiring'
    },
    {
      severity: 'warning',
      title: 'Utilizzo storage critico',
      description: '2 aziende hanno superato il 90% del limite',
      time: '3 ore fa',
      link: '/admin/companies?filter=storage'
    },
    {
      severity: 'info',
      title: 'Upgrade in arrivo',
      description: 'Zeta Corp passerà a Enterprise entro fine mese',
      time: '5 ore fa',
      link: '/admin/companies/6'
    },
  ], []);
  
  const paymentFailures = useMemo(() => [
    { company: 'Sigma SRL', date: '18 Apr 2026', amount: 199 },
    { company: 'Omega Corp', date: '15 Apr 2026', amount: 499 },
    { company: 'Phi SpA', date: '12 Apr 2026', amount: 99 },
  ], []);
  
  const systemStatus = useMemo(() => [
    { name: 'API Server', status: 'healthy', latency: '12ms' },
    { name: 'Database', status: 'healthy', latency: '8ms' },
    { name: 'Storage', status: 'healthy', latency: '45ms' },
    { name: 'Email Service', status: 'healthy', latency: '120ms' },
    { name: 'Payment Gateway', status: 'healthy', latency: '89ms' },
  ], []);

  useEffect(() => {
    // Simula caricamento dati
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(k => k + 1);
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['super_admin', 'platform_owner']}>
        <AppShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="text-muted">Caricamento business cockpit...</p>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['super_admin', 'platform_owner']}>
      <AppShell contentClassName="w-full">
        <div className="space-y-6 animate-fadeIn">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted text-sm mb-1">
                <Link href="/dashboard/admin" className="hover:text-primary">Dashboard</Link>
                <span>/</span>
                <span>Business Cockpit</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Business Cockpit</h1>
              <p className="text-sm text-muted mt-1">Panoramica revenue, churn e health del sistema</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Aggiorna
              </button>
              <Link 
                href="/admin/analytics"
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm text-primary-foreground transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            </div>
          </div>

          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BusinessKpiCard
              title="MRR"
              value={formatCurrency(metrics.mrr.value)}
              subtitle="Monthly Recurring Revenue"
              trend={metrics.mrr.trend}
              trendValue={metrics.mrr.trendValue}
              icon={DollarSign}
              color="primary"
              delay={0}
            />
            <BusinessKpiCard
              title="ARR"
              value={formatCurrency(metrics.arr.value)}
              subtitle="Annual Recurring Revenue"
              trend={metrics.arr.trend}
              trendValue={metrics.arr.trendValue}
              icon={TrendingUp}
              color="success"
              delay={50}
            />
            <BusinessKpiCard
              title="Churn Rate"
              value={formatPercent(metrics.churnRate.value)}
              subtitle="Monthly churn"
              trend={metrics.churnRate.trend}
              trendValue={metrics.churnRate.trendValue}
              icon={TrendingDown}
              color="danger"
              delay={100}
            />
            <BusinessKpiCard
              title="Avg Revenue"
              value={formatCurrency(metrics.avgRevenue.value)}
              subtitle="Per tenant"
              trend={metrics.avgRevenue.trend}
              trendValue={metrics.avgRevenue.trendValue}
              icon={BarChart3}
              color="info"
              delay={150}
            />
          </div>

          {/* Tenant & Conversion KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BusinessKpiCard
              title="Tenant Attivi"
              value={metrics.activeTenants.value}
              subtitle="Aziende attive"
              trend={metrics.activeTenants.trend}
              trendValue={metrics.activeTenants.trendValue}
              icon={Building2}
              color="primary"
              delay={200}
            />
            <BusinessKpiCard
              title="Trial in corso"
              value={metrics.trialTenants.value}
              subtitle="Da convertire"
              trend={metrics.trialTenants.trend}
              trendValue={metrics.trialTenants.trendValue}
              icon={Clock}
              color="warning"
              delay={250}
            />
            <BusinessKpiCard
              title="Conversion Rate"
              value={formatPercent(metrics.conversionRate.value)}
              subtitle="Trial → Paid"
              trend={metrics.conversionRate.trend}
              trendValue={metrics.conversionRate.trendValue}
              icon={CheckCircle}
              color="success"
              delay={300}
            />
            <BusinessKpiCard
              title="MRR Churn"
              value={formatCurrency(metrics.mrrChurn.value)}
              subtitle="Perso questo mese"
              trend={metrics.mrrChurn.trend}
              trendValue={metrics.mrrChurn.trendValue}
              icon={XCircle}
              color="danger"
              delay={350}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={revenueData} />
            </div>
            <ConversionFunnel data={conversionData} />
          </div>

          {/* Plans Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlanDistribution data={planDistribution} />
            <TenantHealthTable tenants={tenantsData} />
          </div>

          {/* Alerts & System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AlertsList alerts={alerts} />
            <PaymentFailuresList failures={paymentFailures} />
            <SystemStatus status={systemStatus} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/admin/companies"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-primary/50 transition-colors group"
            >
              <Building2 className="w-6 h-6 text-primary mb-3" />
              <p className="text-sm font-medium text-white group-hover:text-primary">Gestisci Aziende</p>
              <p className="text-xs text-muted mt-1">CRUD tenant e impostazioni</p>
            </Link>
            <Link 
              href="/admin/pricing"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-info/50 transition-colors group"
            >
              <DollarSign className="w-6 h-6 text-info mb-3" />
              <p className="text-sm font-medium text-white group-hover:text-info">Gestisci Prezzi</p>
              <p className="text-xs text-muted mt-1">Piani tariffari e coupon</p>
            </Link>
            <Link 
              href="/admin/analytics"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-warning/50 transition-colors group"
            >
              <PieChart className="w-6 h-6 text-warning mb-3" />
              <p className="text-sm font-medium text-white group-hover:text-warning">Report Dettagliati</p>
              <p className="text-xs text-muted mt-1">Analytics avanzate</p>
            </Link>
            <Link 
              href="/settings/security"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-success/50 transition-colors group"
            >
              <Settings className="w-6 h-6 text-success mb-3" />
              <p className="text-sm font-medium text-white group-hover:text-success">Impostazioni</p>
              <p className="text-xs text-muted mt-1">Configurazione sistema</p>
            </Link>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
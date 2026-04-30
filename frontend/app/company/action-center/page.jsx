'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  Building2,
  Bell,
  ArrowRight,
  Plus,
  Filter,
  RefreshCw,
  ChevronRight,
  X,
  Check,
  Eye
} from 'lucide-react';

// Status badge component
function StatusBadge({ status }) {
  const config = {
    completed: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle, label: 'Completato' },
    pending: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock, label: 'In attesa' },
    in_progress: { color: 'bg-info/10 text-info border-info/20', icon: Activity, label: 'In corso' },
    overdue: { color: 'bg-danger/10 text-danger border-danger/20', icon: AlertTriangle, label: 'In ritardo' },
  };
  
  const { color, icon: Icon, label } = config[status] || config.pending;
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// Priority indicator
function PriorityDot({ priority }) {
  const colors = {
    high: 'bg-danger',
    medium: 'bg-warning',
    low: 'bg-info',
  };
  
  return (
    <div className={cn("w-2 h-2 rounded-full", colors[priority])} title={`Priorità ${priority}`} />
  );
}

// Action item card
function ActionItem({ item, onComplete }) {
  return (
    <div className={cn(
      "bg-card rounded-xl border p-4 transition-all hover:shadow-lg",
      item.priority === 'high' ? 'border-l-4 border-l-danger border-gray-800' : 'border-gray-800 hover:border-gray-700'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <PriorityDot priority={item.priority} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-white">{item.title}</h4>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-muted">{item.description}</p>
            
            <div className="flex items-center gap-3 mt-3">
              {item.dueDate && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs",
                  item.status === 'overdue' ? 'bg-danger/10 text-danger' : 'bg-gray-800 text-muted'
                )}>
                  <Calendar className="w-3 h-3" />
                  {item.dueDate}
                </span>
              )}
              {item.category && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded text-xs text-muted">
                  {item.category}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {item.status !== 'completed' && (
            <button 
              onClick={() => onComplete(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 hover:bg-success/20 text-success rounded-lg text-xs font-medium transition-colors"
            >
              <Check className="w-3 h-3" />
              Completa
</button>
          )}
          {item.actionUrl && (
            <Link 
              href={item.actionUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Eye className="w-3 h-3" />
              Apri
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat card
function ActionStatCard({ icon: Icon, label, value, color = 'primary', trend }) {
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
        {trend !== undefined && (
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

// Anomaly alert card
function AnomalyAlert({ anomaly }) {
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      anomaly.severity === 'high' ? 'bg-danger/5 border-danger/20' :
      anomaly.severity === 'medium' ? 'bg-warning/5 border-warning/20' : 'bg-info/5 border-info/20'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          anomaly.severity === 'high' ? 'bg-danger/20 text-danger' :
          anomaly.severity === 'medium' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'
        )}>
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{anomaly.title}</h4>
          <p className="text-xs text-muted mt-1">{anomaly.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Link 
              href={anomaly.link}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Gestisci <ChevronRight className="w-3 h-3" />
            </Link>
            <span className="text-xs text-muted">{anomaly.count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing documents card
function MissingDocumentsCard({ documents }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-warning" />
          Documenti mancanti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-sm text-muted">Tutti i documenti presenti</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-warning/5 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-warning" />
                  <span className="text-sm text-white">{doc.type}</span>
                </div>
                <span className="text-xs text-warning font-medium">{doc.missingSince}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Payroll status card
function PayrollStatusCard({ payroll }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-success" />
          Stato Paghe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payroll.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">{item.month}</p>
              <p className="text-xs text-muted">{item.status}</p>
            </div>
            <StatusBadge status={item.status === 'approved' ? 'completed' : item.status === 'pending' ? 'pending' : 'in_progress'} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Employee overview card
function EmployeeOverviewCard({ employees }) {
  const active = employees.filter(e => e.status === 'active').length;
  const onLeave = employees.filter(e => e.status === 'on_leave').length;
  
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-info" />
          Panoramica Dipendenti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <p className="text-2xl font-bold text-white">{employees.length}</p>
            <p className="text-xs text-muted">Totale</p>
          </div>
          <div className="text-center p-3 bg-success/5 rounded-lg">
            <p className="text-2xl font-bold text-success">{active}</p>
            <p className="text-xs text-muted">Attivi</p>
          </div>
          <div className="text-center p-3 bg-warning/5 rounded-lg">
            <p className="text-2xl font-bold text-warning">{onLeave}</p>
            <p className="text-xs text-muted">In ferie</p>
          </div>
        </div>
        <Link 
          href="/employees"
          className="flex items-center justify-center gap-2 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors"
        >
          Gestisci dipendenti <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

// Medical reminders card
function MedicalRemindersCard({ reminders }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Visite Mediche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reminders.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-sm text-muted">Nessuna scadenza</p>
          </div>
        ) : (
          reminders.map((rem, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-warning/5 border border-warning/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <div className="flex-1">
                <p className="text-sm text-white">{rem.title}</p>
                <p className="text-xs text-muted">{rem.date}</p>
              </div>
            </div>
          ))
        )}
        <Link 
          href="/company/medical"
          className="flex items-center justify-center gap-2 w-full py-2 mt-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-primary transition-colors"
        >
          Gestisci Certificati <ArrowRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

// Reminders card
function RemindersCard({ reminders }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Promemoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reminders.map((rem, i) => (
          <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
            <div className={cn(
              "w-2 h-2 rounded-full",
              rem.urgent ? 'bg-danger' : 'bg-primary'
            )} />
            <span className="text-sm text-white flex-1">{rem.text}</span>
            <span className="text-xs text-muted">{rem.date}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ===== MAIN COMPONENT =====

const COMPANY_ROLES = ['company_owner', 'company_admin', 'hr_manager', 'manager'];

export default function CompanyActionCenterPage() {
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Mock data - in produzione sostituire con chiamate API
  const stats = useMemo(() => ({
    actionsPending: 6,
    completedToday: 4,
    anomalies: 3,
    overdue: 2,
    employees: 45,
    onLeave: 3,
    documentsMissing: 5,
  }), [refreshKey]);
  
  const actionItems = useMemo(() => [
    {
      id: 1,
      title: 'Revisiona presenze Marzo',
      description: '2 dipendenti con anomalie da verificare',
      status: 'pending',
      priority: 'high',
      dueDate: 'Oggi',
      category: 'Presenze',
      actionUrl: '/company/attendance',
    },
    {
      id: 2,
      title: 'Approva ferie Q2',
      description: '5 richieste ferie in attesa di approvazione',
      status: 'pending',
      priority: 'high',
      dueDate: 'Domani',
      category: 'Ferie',
      actionUrl: '/company/leave',
    },
    {
      id: 3,
      title: 'Verifica documento CUD',
      description: 'CUD 2025 dipendente Mario Rossi mancante',
      status: 'overdue',
      priority: 'medium',
      dueDate: 'Scaduto',
      category: 'Documenti',
      actionUrl: '/company/documents',
    },
    {
      id: 4,
      title: 'Conferma busta paga Aprile',
      description: 'Revisione calcolo straordinari',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '22 Apr',
      category: 'Paghe',
      actionUrl: '/company/payroll',
    },
    {
      id: 5,
      title: 'Aggiorna anagrafica',
      description: 'Nuovo IBAN per dipendente Luca Verdi',
      status: 'pending',
      priority: 'low',
      dueDate: '25 Apr',
      category: 'HR',
      actionUrl: '/company/users',
    },
    {
      id: 6,
      title: 'Invio comunicazione',
      description: 'Comunicazione ferie estive ai dipendenti',
      status: 'completed',
      priority: 'low',
      category: 'Comunicazioni',
    },
    {
      id: 7,
      title: 'Verifica scadenza contratto',
      description: 'Contratto consulente expires in 30 giorni',
      status: 'pending',
      priority: 'low',
      dueDate: '30 Apr',
      category: 'Consulenti',
      actionUrl: '/company/consultants',
    },
    {
      id: 8,
      title: 'Review prestazioni Q1',
      description: 'Compila valutazioni performance team',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '15 Apr',
      category: 'HR',
      actionUrl: '/employees',
    },
  ], []);
  
  const anomalies = useMemo(() => [
    {
      title: 'Presenze incomplete',
      description: '2 dipendenti non hanno completato timbrature',
      severity: 'high',
      count: '2 anomalie',
      link: '/company/attendance?filter=anomalies',
    },
    {
      title: 'Ferie non approvate',
      description: 'Richieste ferie oltre limite annuale',
      severity: 'medium',
      count: '3 richieste',
      link: '/company/leave?filter=pending',
    },
    {
      title: 'Storage in esaurimento',
      description: 'Azienda ha usato 85% dello storage disponibile',
      severity: 'low',
      count: '85%',
      link: '/company/documents',
    },
  ], []);
  
  const missingDocuments = useMemo(() => [
    { type: 'CUD 2025 - Mario Rossi', missingSince: '5 giorni' },
    { type: 'Contratto Luca Verdi', missingSince: '3 giorni' },
    { type: 'Certificato safety - 3 dipendenti', missingSince: '1 settimana' },
  ], []);
  
  const payroll = useMemo(() => [
    { month: 'Febbraio 2026', status: 'approved' },
    { month: 'Marzo 2026', status: 'approved' },
    { month: 'Aprile 2026', status: 'pending' },
  ], []);
  
  const employees = useMemo(() => [
    { name: 'Mario Rossi', status: 'active' },
    { name: 'Luca Verdi', status: 'active' },
    { name: 'Anna Bianchi', status: 'on_leave' },
    { name: 'Paolo Nero', status: 'active' },
  ], []);
  
  const reminders = useMemo(() => [
    { text: 'Team meeting', date: 'Oggi 10:00', urgent: true },
    { text: 'Scadenza fiscale mensile', date: '22 Apr', urgent: false },
    { text: 'Review performance', date: '25 Apr', urgent: false },
    { text: 'Aggiornamento sistema', date: '1 Mag', urgent: false },
  ], []);
  
  const medicalReminders = useMemo(() => [
    { title: 'Visita Mario Rossi', date: '22 Apr 2026' },
    { title: 'Scadenza certificato Luca', date: '25 Apr 2026' },
  ], []);
  
  const filteredActions = useMemo(() => {
    if (filter === 'all') return actionItems;
    if (filter === 'overdue') return actionItems.filter(a => a.status === 'overdue');
    return actionItems.filter(a => a.status === filter);
  }, [actionItems, filter]);
  
  const handleCompleteAction = (actionId) => {
    console.log('Completing action:', actionId);
  };
  
  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <AuthGuard allowedRoles={COMPANY_ROLES}>
      <AppShell contentClassName="w-full">
        <div className="space-y-6 animate-fadeIn">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted text-sm mb-1">
                <Link href="/dashboard/company" className="hover:text-primary">Dashboard</Link>
                <span>/</span>
                <span>Centro Operativo</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Centro Operativo</h1>
              <p className="text-sm text-muted mt-1">Action center giornaliero per gestione azienda</p>
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
                href="/employees/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm text-primary-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuovo Dipendente
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionStatCard 
              icon={Activity} 
              label="Azioni in attesa" 
              value={stats.actionsPending} 
              color="warning" 
            />
            <ActionStatCard 
              icon={CheckCircle} 
              label="Completate oggi" 
              value={stats.completedToday} 
              color="success" 
              trend={20}
            />
            <ActionStatCard 
              icon={AlertTriangle} 
              label="Anomalie" 
              value={stats.anomalies} 
              color="danger" 
            />
            <ActionStatCard 
              icon={Clock} 
              label="In ritardo" 
              value={stats.overdue} 
              color="danger" 
            />
          </div>

          {/* Anomalies Alert */}
          {anomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Anomalie da risolvere
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {anomalies.map((anomaly, i) => (
                  <AnomalyAlert key={i} anomaly={anomaly} />
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Action Items - 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filter tabs */}
              <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted" />
                  <div className="flex gap-2">
                    {[
                      { key: 'all', label: 'Tutte' },
                      { key: 'pending', label: 'In attesa' },
                      { key: 'overdue', label: 'In ritardo' },
                      { key: 'in_progress', label: 'In corso' },
                      { key: 'completed', label: 'Completate' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          filter === tab.key 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-gray-800 text-muted hover:text-white'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted">
                  {filteredActions.length} azioni
                </span>
              </div>

              {/* Action Items List */}
              <div className="space-y-3">
                {filteredActions.map((item) => (
                  <ActionItem 
                    key={item.id} 
                    item={item}
                    onComplete={handleCompleteAction}
                  />
                ))}
                {filteredActions.length === 0 && (
                  <div className="text-center py-12 bg-card rounded-xl border border-gray-800">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
                    <p className="text-lg font-medium text-white">Nessuna azione da mostrare</p>
                    <p className="text-sm text-muted mt-1">Tutto in ordine!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Employee Overview */}
              <EmployeeOverviewCard employees={employees} />

              {/* Payroll Status */}
              <PayrollStatusCard payroll={payroll} />

              {/* Missing Documents */}
              <MissingDocumentsCard documents={missingDocuments} />
              
              {/* Medical Reminders */}
              <MedicalRemindersCard reminders={medicalReminders} />

              {/* Reminders */}
              <RemindersCard reminders={reminders} />
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/employees"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-primary/50 transition-colors group text-center"
            >
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-primary">Dipendenti</p>
              <p className="text-xs text-muted mt-1">{stats.employees} totali</p>
            </Link>
            <Link 
              href="/company/attendance"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-success/50 transition-colors group text-center"
            >
              <Activity className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-success">Presenze</p>
              <p className="text-xs text-muted mt-1">{stats.anomalies} anomalie</p>
            </Link>
            <Link 
              href="/company/leave"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-warning/50 transition-colors group text-center"
            >
              <Calendar className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-warning">Ferie</p>
              <p className="text-xs text-muted mt-1">Gestisci richieste</p>
            </Link>
            <Link 
              href="/company/payroll"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-info/50 transition-colors group text-center"
            >
              <DollarSign className="w-6 h-6 text-info mx-auto mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-info">Paghe</p>
              <p className="text-xs text-muted mt-1">{payroll.length} mesi</p>
            </Link>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
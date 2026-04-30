'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { 
  CheckSquare,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Users,
  ArrowRight,
  Filter,
  SortAsc,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  MoreVertical,
  RefreshCw,
  Plus
} from 'lucide-react';

// Task status badge
function TaskStatusBadge({ status }) {
  const statusConfig = {
    pending: { color: 'bg-gray-700 text-gray-300', icon: Clock, label: 'In attesa' },
    in_progress: { color: 'bg-warning/10 text-warning', icon: Play, label: 'In corso' },
    completed: { color: 'bg-success/10 text-success', icon: CheckCircle, label: 'Completato' },
    blocked: { color: 'bg-danger/10 text-danger', icon: XCircle, label: 'Bloccato' },
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Task priority indicator
function TaskPriority({ priority }) {
  const colors = {
    high: 'bg-danger',
    medium: 'bg-warning',
    low: 'bg-info',
  };
  
  return (
    <div className={cn("w-2 h-full rounded-full", colors[priority])} title={`Priorità ${priority}`} />
  );
}

// Task card component
function TaskCard({ task, onComplete }) {
  return (
    <div className="bg-card rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors group">
      <div className="flex items-start gap-3">
        <TaskPriority priority={task.priority} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                {task.title}
              </h4>
              <p className="text-xs text-muted mt-1 line-clamp-2">{task.description}</p>
            </div>
            <button className="p-1 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-muted" />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded text-xs text-muted">
              <Building2 className="w-3 h-3" />
              {task.company}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded text-xs text-muted">
              <Calendar className="w-3 h-3" />
              {task.dueDate}
            </span>
            <TaskStatusBadge status={task.status} />
          </div>
          
          {task.actionRequired && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <button 
                onClick={() => onComplete(task.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Completa azione richiesta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat card for header
function StatCard({ icon: Icon, label, value, color = 'primary', trend }) {
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
          <div className={cn("p-2 rounded-lg", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend > 0 ? 'text-success' : 'text-danger'
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

// Client overview card
function ClientCard({ client, onSelect }) {
  const urgencyColor = {
    high: 'border-l-danger bg-danger/5',
    medium: 'border-l-warning bg-warning/5',
    low: 'border-l-primary bg-primary/5',
  };
  
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-gray-800 p-4 cursor-pointer hover:border-gray-700 transition-colors border-l-4",
        urgencyColor[client.urgency]
      )}
      onClick={() => onSelect(client.id)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-white">{client.name}</h4>
          <p className="text-xs text-muted mt-1">{client.industry}</p>
        </div>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          client.status === 'active' ? 'bg-success/10 text-success' :
          client.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-gray-700 text-gray-400'
        )}>
          {client.status}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-800">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{client.employees}</p>
          <p className="text-xs text-muted">Dipendenti</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{client.tasks}</p>
          <p className="text-xs text-muted">Task</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-success">{client.revenue}€</p>
          <p className="text-xs text-muted">MRR</p>
        </div>
      </div>
    </div>
  );
}

// Deadlines list
function DeadlinesList({ deadlines }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Scadenze imminenti
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deadlines.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold",
                item.urgent ? 'bg-danger/10 text-danger' : 'bg-gray-700 text-muted'
              )}>
                {item.daysLeft}d
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-muted">{item.company}</p>
              </div>
            </div>
            <Link 
              href={item.link}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Apri <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Payroll monitor
function PayrollMonitor({ payrollData }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-success" />
          Monitor Paghe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payrollData.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                item.status === 'ready' ? 'bg-success/10 text-success' :
                item.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-gray-700 text-muted'
              )}>
                {item.month.substring(0, 3)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.company}</p>
                <p className="text-xs text-muted">{item.employees} dipendenti</p>
              </div>
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              item.status === 'ready' ? 'bg-success/10 text-success' :
              item.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-gray-700 text-gray-400'
            )}>
              {item.status === 'ready' ? 'Pronto' : item.status === 'pending' ? 'In attesa' : 'Draft'}
            </span>
          </div>
        ))}
</CardContent>
    </Card>
  );
}

// Documents missing
function DocumentsMissing({ missing }) {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-danger" />
          Documenti mancanti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {missing.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-sm text-muted">Tutti i documenti presenti</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missing.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{item.type}</p>
                  <p className="text-xs text-muted">{item.company}</p>
                </div>
                <span className="text-xs text-danger font-medium">{item.missingSince}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== MAIN COMPONENT =====

const CONSULTANT_ROLES = ['external_consultant', 'labor_consultant', 'safety_consultant'];

export default function ConsultantTasksPage() {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Mock data - in produzione sostituire con chiamate API
  const stats = useMemo(() => ({
    totalTasks: 24,
    pendingTasks: 8,
    completedToday: 3,
    overdueTasks: 2,
    clients: 12,
    urgentDeadlines: 4,
  }), []);
  
  const tasks = useMemo(() => [
    {
      id: 1,
      title: 'Revisione buste paga Aprile',
      description: 'Verificare tutti i cedolini prima dell\'invio ai dipendenti',
      company: 'Alpha SRL',
      dueDate: 'Oggi',
      status: 'pending',
      priority: 'high',
      actionRequired: true,
    },
    {
      id: 2,
      title: 'Upload documenti INPS',
      description: 'Caricare modello EMens per il mese di Marzo',
      company: 'Beta Corp',
      dueDate: 'Domani',
      status: 'pending',
      priority: 'high',
      actionRequired: true,
    },
    {
      id: 3,
      title: 'Verifica presenze Marzo',
      description: 'Rivedere anomalie segnalate dall\'HR',
      company: 'Gamma SpA',
      dueDate: '22 Apr',
      status: 'in_progress',
      priority: 'medium',
      actionRequired: false,
    },
    {
      id: 4,
      title: 'Approvazione ferie Q2',
      description: 'Consuntivare ferie dipendenti per il secondo trimestre',
      company: 'Delta SRL',
      dueDate: '25 Apr',
      status: 'pending',
      priority: 'low',
      actionRequired: false,
    },
    {
      id: 5,
      title: 'Report mensile safety',
      description: 'Generare report ispezioni di sicurezza',
      company: 'Epsilon Corp',
      dueDate: '28 Apr',
      status: 'pending',
      priority: 'medium',
      actionRequired: false,
    },
    {
      id: 6,
      title: 'Aggiornamento anagrafica',
      description: 'Inserire nuovi dipendenti nel sistema',
      company: 'Zeta SpA',
      dueDate: '2 Mag',
      status: 'completed',
      priority: 'low',
      actionRequired: false,
    },
    {
      id: 7,
      title: 'Calcolo TFR',
      description: 'Liquidazione TFR per dipendente in uscita',
      company: 'Eta SRL',
      dueDate: 'Scaduto',
      status: 'blocked',
      priority: 'high',
      actionRequired: true,
    },
  ], []);
  
  const clients = useMemo(() => [
    { id: 1, name: 'Alpha SRL', industry: 'Manifatturiero', status: 'active', employees: 45, tasks: 5, revenue: 299, urgency: 'high' },
    { id: 2, name: 'Beta Corp', industry: 'Servizi', status: 'active', employees: 28, tasks: 3, revenue: 199, urgency: 'medium' },
    { id: 3, name: 'Gamma SpA', industry: 'Logistica', status: 'pending', employees: 156, tasks: 8, revenue: 499, urgency: 'high' },
    { id: 4, name: 'Delta SRL', industry: 'Retail', status: 'active', employees: 12, tasks: 2, revenue: 99, urgency: 'low' },
    { id: 5, name: 'Epsilon Corp', industry: 'Tech', status: 'active', employees: 67, tasks: 4, revenue: 299, urgency: 'medium' },
    { id: 6, name: 'Zeta SpA', industry: 'Costruzioni', status: 'active', employees: 89, tasks: 6, revenue: 399, urgency: 'low' },
  ], []);
  
  const deadlines = useMemo(() => [
    { title: 'Buste paga Aprile', company: 'Alpha SRL', daysLeft: 1, urgent: true, link: '/consultant/payroll' },
    { title: 'Denuncia INPS', company: 'Beta Corp', daysLeft: 3, urgent: false, link: '/consultant/documents' },
    { title: 'Report safety', company: 'Gamma SpA', daysLeft: 5, urgent: false, link: '/consultant/safety' },
    { title: 'Ferie Q2', company: 'Delta SRL', daysLeft: 7, urgent: false, link: '/consultant/leave' },
  ], []);
  
  const payrollData = useMemo(() => [
    { company: 'Alpha SRL', month: 'Aprile 2026', employees: 45, status: 'ready' },
    { company: 'Beta Corp', month: 'Aprile 2026', employees: 28, status: 'pending' },
    { company: 'Gamma SpA', month: 'Marzo 2026', employees: 156, status: 'draft' },
    { company: 'Delta SRL', month: 'Aprile 2026', employees: 12, status: 'ready' },
  ], []);
  
  const documentsMissing = useMemo(() => [
    { type: 'CUD 2025', company: 'Epsilon Corp', missingSince: '5 giorni' },
    { type: 'Modello AA01', company: 'Zeta SpA', missingSince: '2 giorni' },
  ], []);
  
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    if (filter !== 'all') {
      result = result.filter(t => t.status === filter);
    }
    
    result.sort((a, b) => {
      if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate);
      if (sortBy === 'priority') {
        const p = { high: 3, medium: 2, low: 1 };
        return p[b.priority] - p[a.priority];
      }
      if (sortBy === 'company') return a.company.localeCompare(b.company);
      return 0;
    });
    
    return result;
  }, [tasks, filter, sortBy]);
  
  const handleCompleteTask = (taskId) => {
    // In produzione: chiamare API per completare task
    console.log('Completing task:', taskId);
  };
  
  const handleSelectClient = (clientId) => {
    setSelectedClient(clientId);
    // In produzione: navigare alla scheda cliente
  };

  return (
    <AuthGuard allowedRoles={CONSULTANT_ROLES}>
      <AppShell contentClassName="w-full">
        <div className="space-y-6 animate-fadeIn">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted text-sm mb-1">
                <Link href="/dashboard/consultant" className="hover:text-primary">Dashboard</Link>
                <span>/</span>
                <span>Task Console</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Task Console</h1>
              <p className="text-sm text-muted mt-1">Gestisci task e priorità per tutti i clienti</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors">
                <Plus className="w-4 h-4" />
                Nuovo Task
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={CheckSquare} label="Task totali" value={stats.totalTasks} color="primary" />
            <StatCard icon={Clock} label="In attesa" value={stats.pendingTasks} color="warning" />
            <StatCard icon={CheckCircle} label="Completati oggi" value={stats.completedToday} color="success" />
            <StatCard icon={AlertTriangle} label="In ritardo" value={stats.overdueTasks} color="danger" />
            <StatCard icon={Building2} label="Clienti" value={stats.clients} color="info" />
            <StatCard icon={Calendar} label="Scadenze urgenti" value={stats.urgentDeadlines} color="warning" />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task List - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters & Sort */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted" />
                  <div className="flex gap-2">
                    {['all', 'pending', 'in_progress', 'completed'].map((f) => (
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
                         f === 'in_progress' ? 'In corso' : 'Completati'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-muted" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-800 border-none text-white text-xs rounded px-2 py-1.5 outline-none"
                  >
                    <option value="dueDate">Scadenza</option>
                    <option value="priority">Priorità</option>
                    <option value="company">Azienda</option>
                  </select>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onComplete={handleCompleteTask}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-muted">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
                    <p className="text-lg font-medium">Nessun task da mostrare</p>
                    <p className="text-sm">Hai completato tutti i task!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Clients Grid */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Clienti
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {clients.map((client) => (
                    <ClientCard 
                      key={client.id} 
                      client={client}
                      onSelect={handleSelectClient}
                    />
                  ))}
                </div>
              </div>

              {/* Deadlines */}
              <DeadlinesList deadlines={deadlines} />

              {/* Payroll Monitor */}
              <PayrollMonitor payrollData={payrollData} />

              {/* Documents Missing */}
              <DocumentsMissing missing={documentsMissing} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/consultant/companies"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-primary/50 transition-colors group"
            >
              <Building2 className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-primary">Tutti i clienti</p>
            </Link>
            <Link 
              href="/consultant/payroll"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-success/50 transition-colors group"
            >
              <DollarSign className="w-5 h-5 text-success mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-success">Gestione paghe</p>
            </Link>
            <Link 
              href="/consultant/documents"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-warning/50 transition-colors group"
            >
              <FileText className="w-5 h-5 text-warning mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-warning">Documenti</p>
            </Link>
            <Link 
              href="/consultant/attendance"
              className="p-4 bg-card rounded-xl border border-gray-800 hover:border-info/50 transition-colors group"
            >
              <CheckSquare className="w-5 h-5 text-info mb-2" />
              <p className="text-sm font-medium text-white group-hover:text-info">Presenze</p>
            </Link>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
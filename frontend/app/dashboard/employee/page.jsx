"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  LogIn, 
  LogOut, 
  Clock,
  Calendar, 
  FileText, 
  User,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MapPin,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import api from '@/lib/api';

// ============================================================================
// Employee Dashboard Page
// ============================================================================

export default function EmployeeDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAtWork, setIsAtWork] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch both summaries in parallel
      const [summaryData, timeData] = await Promise.all([
        api.get('/dashboard/employee/summary/'),
        api.get('/time/today/').catch(() => null)
      ]);
      setDashboardData({ ...summaryData, time_today: timeData });
      setIsAtWork(summaryData.is_at_work || false);
    } catch (err) {
      console.error('Error fetching employee dashboard:', err);
      setError(err.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleClock = async () => {
    setClockLoading(true);
    try {
      const endpoint = isAtWork ? '/time/check-out/' : '/time/check-in/';
      await api.post(endpoint);
      // Refresh data after clock action
      await fetchDashboardData();
    } catch (err) {
      console.error('Error during clock action:', err);
      // Show error but don't block the user
      alert('Errore durante la timbratura: ' + (err.message || 'Riprova'));
    } finally {
      setClockLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <div className="h-10 w-64 bg-muted rounded" />
        <ErrorState
          title="Impossibile caricare il dashboard"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  // Empty state when no data
  if (!dashboardData) {
    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <div className="h-10 w-64 bg-muted rounded" />
        <EmptyState
          icon={Clock}
          title="Nessun dato disponibile"
          description="I tuoi dati di presenza appariranno qui una volta attivato il tracking."
          action="Attiva Tracking"
          href="/employee/settings"
        />
      </div>
    );
  }

  const lastClock = dashboardData?.last_clock;
  const hoursToday = dashboardData?.hours_today || '0:00';
  const hoursWeek = dashboardData?.hours_week || '0:00';
  const leaveBalance = dashboardData?.leave_balance;
  const recentClocks = dashboardData?.recent_clocks || [];
  const documents = dashboardData?.documents || [];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Benvenuto, {dashboardData?.user_name || 'Dipendente'}!
        </h1>
        <p className="text-sm text-muted">
          {currentTime.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* STATUS + BIG CLOCK BUTTON */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg">
        <CardContent className="py-6">
          <div className="text-center">
            {/* Current Time Display */}
            <div className="mb-4">
              <p className="text-5xl font-bold text-foreground tabular-nums">
                {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-muted mt-1">
                {currentTime.toLocaleTimeString('it-IT', { second: '2-digit' }).split(':')[2]} secondi
              </p>
            </div>

            {/* Status Indicator */}
            <div className="mb-6">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                isAtWork 
                  ? "bg-success/10 border border-success/30" 
                  : "bg-muted border border-border"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isAtWork ? "bg-success animate-pulse" : "bg-muted"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isAtWork ? "text-success" : "text-muted"
                )}>
                  {isAtWork ? 'Al lavoro' : 'Fuori sede'}
                </span>
              </div>
            </div>

            {/* Last Clock Info */}
            {lastClock && (
              <div className="mb-4">
                <p className="text-xs text-muted">
                  Ultima timbratura: <span className="font-medium text-foreground">{lastClock.time}</span> ({lastClock.type})
                </p>
                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted">
                  <MapPin className="w-3 h-3" />
                  <span>{lastClock.location || 'Sede'}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* BIG CLOCK BUTTON */}
          <button 
            onClick={handleClock}
            disabled={clockLoading}
            className={cn(
              "w-full h-20 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card",
              isAtWork 
                ? "bg-danger text-white hover:bg-danger/90 hover:scale-105 active:scale-95" 
                : "bg-primary text-white hover:bg-primary-strong hover:scale-105 active:scale-95",
              clockLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {clockLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isAtWork ? (
                  <>
                    <LogOut className="w-7 h-7" />
                    <span>Timbra Uscita</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-7 h-7" />
                    <span>Timbra Entrata</span>
                  </>
                )}
              </>
            )}
          </button>

          {/* Geolocation notice */}
          <p className="text-xs text-muted text-center mt-3 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>Timbratura geolocalizzata</span>
          </p>
        </CardContent>
      </Card>

      {/* ORE OGGI E SETTIMANA */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="py-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-sm text-muted font-medium">Ore Oggi</p>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{hoursToday}</p>
            <p className="text-xs text-muted mt-1">su {dashboardData?.expected_hours_today || 8}:00 previste</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="py-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted font-medium">Ore Settimana</p>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{hoursWeek}</p>
            <p className="text-xs text-muted mt-1">su {dashboardData?.expected_hours_week || 40}:00 previste</p>
          </CardContent>
        </Card>
      </div>

      {/* FERIE RESIDUE */}
      {leaveBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-primary" />
              Saldo Ferie {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{leaveBalance.available || 0}</p>
                <p className="text-xs text-muted mt-1">Disponibili</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted">{leaveBalance.used || 0}</p>
                <p className="text-xs text-muted mt-1">Godute</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{leaveBalance.pending || 0}</p>
                <p className="text-xs text-muted mt-1">In attesa</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-success to-primary transition-all"
                style={{ width: `${((leaveBalance.used || 0) / (leaveBalance.total || 1)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted text-center mt-2">
              {leaveBalance.used || 0} / {leaveBalance.total || 0} giorni utilizzati
            </p>
          </CardContent>
        </Card>
      )}

      {/* QUICK ACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary group">
            <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">Richiedi Ferie</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-accent/5 hover:border-accent/30 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent group">
            <div className="p-2.5 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs font-medium text-foreground">Documenti</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-success/5 hover:border-success/30 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success group">
            <div className="p-2.5 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
              <User className="w-5 h-5 text-success" />
            </div>
            <span className="text-xs font-medium text-foreground">Profilo</span>
          </button>
        </CardContent>
      </Card>

      {/* TIMBRATURE RECENTI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted" />
            Timbrature Recenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentClocks.length > 0 ? (
            <div className="space-y-3">
              {recentClocks.map((clock) => (
                <div 
                  key={clock.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      clock.type === 'Entrata' ? "bg-success/10" : "bg-danger/10"
                    )}>
                      {clock.type === 'Entrata' ? (
                        <LogIn className="w-4 h-4 text-success" />
                      ) : (
                        <LogOut className="w-4 h-4 text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{clock.type}</p>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <MapPin className="w-3 h-3" />
                        <span>{clock.location || 'Sede'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{clock.time}</p>
                    <p className="text-xs text-muted">{clock.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Nessuna timbratura"
              description="Timbra la tua prima entrata per iniziare"
              action="Timbra Entrata"
              onClick={handleClock}
            />
          )}
        </CardContent>
      </Card>

      {/* DOCUMENTI */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted" />
              I Miei Documenti
            </CardTitle>
            {documents.length > 0 && (
              <span className="text-xs text-primary font-medium">Vedi tutti</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.slice(0, 3).map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.title}</p>
                      <p className="text-xs text-muted">{doc.date}</p>
                    </div>
                  </div>
                  {doc.status === 'available' && (
                    <button className="btn btn-sm btn-ghost text-xs">
                      Scarica
                    </button>
                  )}
                  {doc.status === 'signed' && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {doc.status === 'pending' && (
                    <AlertCircle className="w-5 h-5 text-warning" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nessun documento"
              description="I tuoi documenti appariranno qui"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
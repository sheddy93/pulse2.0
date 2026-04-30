import { useState } from 'react';
import { LogIn, LogOut, Clock, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function QuickAttendanceCard({ employee, onStamped }) {
  const [loading, setLoading] = useState(false);
  const [lastEntry, setLastEntry] = useState(null);
  const [error, setError] = useState(null);

  const isClockedIn = lastEntry?.type === 'check_in' || lastEntry?.type === 'break_end';

  const handleStamp = async () => {
    if (!employee) return;
    setLoading(true);
    setError(null);

    try {
      const user = await base44.auth.me();
      await base44.entities.TimeEntry.create({
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        company_id: employee.company_id,
        user_email: user.email,
        timestamp: new Date().toISOString(),
        type: isClockedIn ? 'check_out' : 'check_in',
      });

      const entries = await base44.entities.TimeEntry.filter({
        user_email: user.email
      });
      
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(e => e.timestamp?.startsWith(today));
      setLastEntry(todayEntries[todayEntries.length - 1]);
      
      onStamped?.();
    } catch (err) {
      setError(err.message || 'Errore nella timbratura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-semibold opacity-90">Timbratura Veloce</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-300/50 rounded-lg p-2 mb-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      <div className="mb-4">
        {lastEntry ? (
          <div>
            <p className="text-xs opacity-80">Stato attuale:</p>
            <p className={cn(
              'text-lg font-bold',
              isClockedIn ? 'text-blue-200' : 'text-yellow-200'
            )}>
              {isClockedIn ? '● In servizio' : '● Fuori servizio'}
            </p>
          </div>
        ) : (
          <p className="text-sm opacity-80">Non hai ancora timbrato oggi</p>
        )}
      </div>

      <button
        onClick={handleStamp}
        disabled={loading}
        className={cn(
          'w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3',
          isClockedIn
            ? 'bg-white/20 hover:bg-white/30 border-2 border-white/50'
            : 'bg-white text-blue-700 hover:bg-blue-50'
        )}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Attendere...
          </>
        ) : (
          <>
            {isClockedIn ? (
              <>
                <LogOut className="w-6 h-6" />
                Timbra Uscita
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                Timbra Entrata
              </>
            )}
          </>
        )}
      </button>

      <p className="text-xs opacity-70 text-center mt-3">
        {isClockedIn ? 'Clicca per registrare l\'uscita' : 'Clicca per registrare l\'entrata'}
      </p>
    </div>
  );
}
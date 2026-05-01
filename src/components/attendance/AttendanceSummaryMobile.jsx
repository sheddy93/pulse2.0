/**
 * Attendance Summary Mobile Card
 * Mostra ultimi orari e statistiche
 */
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = {
  check_in: { label: 'Entrata', icon: '🟢' },
  check_out: { label: 'Uscita', icon: '🔴' },
  break_start: { label: 'Pausa', icon: '🟡' },
  break_end: { label: 'Torna', icon: '🔵' },
};

export default function AttendanceSummaryMobile({ todayEntries, lastEntry, pendingCount }) {
  const totalHours = calculateTotalHours(todayEntries);
  const isClockedIn = lastEntry?.type === 'check_in' || lastEntry?.type === 'break_end';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
      {/* Status */}
      <div className={cn(
        'rounded-xl p-3 text-center font-bold transition-colors',
        isClockedIn 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-slate-100 text-slate-700'
      )}>
        {isClockedIn ? '✅ Timbrato' : '⏸ Non timbrato'}
      </div>

      {/* Ore lavorate oggi */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-600">Ore oggi</p>
          <p className="text-lg font-bold text-blue-700">{totalHours}h</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-600">In sospeso</p>
            <p className="text-lg font-bold text-orange-700">{pendingCount}</p>
          </div>
        )}
      </div>

      {/* Ultimi orari */}
      {todayEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase">Ultimi orari</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {todayEntries.slice(0, 3).map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm px-2 py-1 bg-slate-50 rounded">
                <span className="text-slate-600">{TYPES[entry.type]?.icon} {TYPES[entry.type]?.label}</span>
                <span className="font-mono font-bold text-slate-800">
                  {format(new Date(entry.timestamp), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline indicator */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
          <AlertCircle className="w-4 h-4" />
          <span>{pendingCount} timbrature in sospeso (offline)</span>
        </div>
      )}
    </div>
  );
}

function calculateTotalHours(entries) {
  if (entries.length < 2) return 0;

  let totalMs = 0;
  for (let i = 0; i < entries.length - 1; i += 2) {
    const start = new Date(entries[i].timestamp);
    const end = new Date(entries[i + 1].timestamp);
    totalMs += (end - start);
  }

  // Se ancora timbrato, aggiungi fino ad ora
  if (entries.length % 2 === 1 && (entries[0].type === 'check_in' || entries[0].type === 'break_end')) {
    const start = new Date(entries[0].timestamp);
    const now = new Date();
    totalMs += (now - start);
  }

  return (totalMs / (1000 * 60 * 60)).toFixed(1);
}
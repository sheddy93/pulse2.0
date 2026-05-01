/**
 * Request Card - Visualizza richieste in chat
 */
import { CalendarDays, Clock, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  leave: CalendarDays,
  overtime: Clock,
  expense: Receipt
};

const LABELS = {
  leave: 'Richiesta Ferie',
  overtime: 'Richiesta Straordinario',
  expense: 'Rimborso Spesa'
};

export default function RequestCard({ request, type }) {
  const Icon = ICONS[type] || Receipt;
  const label = LABELS[type] || 'Richiesta';

  return (
    <div className="bg-white/20 rounded-lg p-3 border border-white/30 text-sm">
      <div className="flex items-center gap-2 font-semibold mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="space-y-1 text-xs opacity-90">
        {type === 'leave' && (
          <>
            <p>📅 Dal {request?.start_date}</p>
            <p>📅 Al {request?.end_date}</p>
            <p>Giorni: {request?.days_count}</p>
          </>
        )}
        {type === 'overtime' && (
          <>
            <p>📅 {request?.date}</p>
            <p>⏱️ Ore: {request?.hours}</p>
          </>
        )}
        {type === 'expense' && (
          <>
            <p>💶 €{request?.amount}</p>
            <p>Categoria: {request?.category}</p>
          </>
        )}
        {request?.notes && <p className="italic mt-1">"{request.notes}"</p>}
      </div>
      <div className={cn(
        'mt-2 px-2 py-1 rounded text-xs font-semibold w-fit',
        request?.status === 'approved' && 'bg-emerald-900/30 text-emerald-100',
        request?.status === 'rejected' && 'bg-red-900/30 text-red-100',
        request?.status === 'pending' && 'bg-amber-900/30 text-amber-100'
      )}>
        {request?.status === 'approved' ? '✅ Approvata' : request?.status === 'rejected' ? '❌ Rifiutata' : '⏳ In sospeso'}
      </div>
    </div>
  );
}
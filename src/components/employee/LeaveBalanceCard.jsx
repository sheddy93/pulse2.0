import { Calendar, Plus } from 'lucide-react';

export default function LeaveBalanceCard({ leaveBalance, onRequestLeave }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Saldo Ferie</h3>
        <button
          onClick={onRequestLeave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Richiedi ferie
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-slate-700">Ferie</p>
            <p className="text-sm font-semibold text-slate-900">{leaveBalance?.available_leave || 0} / 20 giorni</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((leaveBalance?.available_leave || 0) / 20) * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-slate-700">Permessi</p>
            <p className="text-sm font-semibold text-slate-900">{leaveBalance?.available_permissions || 0} / 8 giorni</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((leaveBalance?.available_permissions || 0) / 8) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <p className="font-medium mb-1">💡 Info utile</p>
          <p>Il saldo viene aggiornato mensilmente. Per ulteriori dettagli, contatta l'ufficio HR.</p>
        </div>
      </div>
    </div>
  );
}
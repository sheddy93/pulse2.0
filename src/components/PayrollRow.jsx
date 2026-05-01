import React, { memo } from 'react';
import { Eye } from 'lucide-react';

/**
 * PayrollRow - Memoized for performance
 * Renders single payroll row without re-rendering siblings
 */
const PayrollRow = memo(({ payroll, onView }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'draft': return '📝 Bozza';
      case 'approved': return '✅ Approvato';
      case 'paid': return '💰 Pagato';
      case 'rejected': return '❌ Rifiutato';
      default: return status;
    }
  };

  const periodDisplay = `${new Date(payroll.period_start).toLocaleDateString('it-IT')} - ${new Date(payroll.period_end).toLocaleDateString('it-IT')}`;

  return (
    <tr className="hover:bg-slate-50 border-b border-slate-100">
      <td className="px-5 py-3 font-medium text-slate-900">{periodDisplay}</td>
      <td className="px-5 py-3 text-sm text-slate-600">{payroll.employees_count} dipendenti</td>
      <td className="px-5 py-3 text-sm font-mono text-slate-900">€{parseFloat(payroll.total_gross).toFixed(2)}</td>
      <td className="px-5 py-3 text-sm font-mono text-slate-900">€{parseFloat(payroll.total_net).toFixed(2)}</td>
      <td className="px-5 py-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(payroll.status)}`}>
          {getStatusLabel(payroll.status)}
        </span>
      </td>
      <td className="px-5 py-3 text-xs text-slate-500">
        {new Date(payroll.created_date).toLocaleDateString('it-IT')}
      </td>
      <td className="px-5 py-3">
        <button
          onClick={() => onView(payroll)}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          Dettagli
        </button>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.payroll.id === nextProps.payroll.id;
});

PayrollRow.displayName = 'PayrollRow';

export default PayrollRow;
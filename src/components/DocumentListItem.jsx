import React, { memo } from 'react';
import { FileText, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

/**
 * DocumentListItem - Memoized for performance
 * Renders individual document in list without re-rendering siblings
 */
const DocumentListItem = memo(({ doc, employees, onDelete, showExpiryWarning }) => {
  const emp = employees?.find(e => e.id === doc.employee_id);
  const days = doc.expiry_date ? differenceInDays(new Date(doc.expiry_date), new Date()) : null;
  const isExpiring = days !== null && days >= 0 && days <= 30;

  return (
    <tr className="hover:bg-slate-50 border-b border-slate-100">
      <td className="px-5 py-3 font-medium text-slate-800 max-w-[200px] truncate">{doc.title}</td>
      <td className="px-5 py-3 text-sm text-slate-500">{doc.doc_type}</td>
      <td className="px-5 py-3 text-sm text-slate-500">{emp ? `${emp.first_name} ${emp.last_name}` : '—'}</td>
      <td className="px-5 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          doc.status === 'approvato' ? 'bg-emerald-100 text-emerald-700' :
          doc.status === 'rifiutato' ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {doc.status}
        </span>
      </td>
      <td className="px-5 py-3 text-sm">
        {isExpiring && <AlertTriangle className="w-4 h-4 text-orange-500" />}
        {doc.expiry_date ? (
          <span className={days <= 30 && days >= 0 ? 'text-orange-600 font-medium' : 'text-slate-500'}>
            {days < 0 ? '❌ Scaduto' : `Scade in ${days}gg`}
          </span>
        ) : '—'}
      </td>
      <td className="px-5 py-3">
        <div className="flex gap-2">
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-blue-600">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={() => onDelete(doc)} className="p-1 text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Only re-render if doc, employees, or callbacks change
  return prevProps.doc.id === nextProps.doc.id &&
         prevProps.employees?.length === nextProps.employees?.length &&
         prevProps.onDelete === nextProps.onDelete;
});

DocumentListItem.displayName = 'DocumentListItem';

export default DocumentListItem;
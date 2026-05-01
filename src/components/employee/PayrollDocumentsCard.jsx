import { Download, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function PayrollDocumentsCard({ payrollDocs }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Buste Paga</h3>

      {payrollDocs?.length > 0 ? (
        <div className="space-y-2">
          {payrollDocs.slice(0, 6).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Busta paga {format(new Date(doc.month), 'MMMM yyyy', { locale: it })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doc.amount && `€ ${doc.amount.toFixed(2)}`}
                  </p>
                </div>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          ))}
          {payrollDocs.length > 6 && (
            <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Vedi tutte ({payrollDocs.length})
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nessuna busta paga disponibile</p>
        </div>
      )}
    </div>
  );
}
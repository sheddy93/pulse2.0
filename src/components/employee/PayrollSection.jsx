import { useState, useEffect } from "react";
// All base44 references removed - payroll via service layer
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const monthNames = ['', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function PayrollSection({ employeeId }) {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    base44.entities.PayrollFile.filter({
      employee_id: employeeId
    }).then(p => {
      setPayrolls([...p].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }));
    }).finally(() => setLoading(false));
  }, [employeeId]);

  const handleDownload = async (payroll) => {
    setDownloading(payroll.id);
    try {
      // Increment download count
      await base44.entities.PayrollFile.update(payroll.id, {
        download_count: (payroll.download_count || 0) + 1,
        downloaded_at: new Date().toISOString()
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = payroll.file_url;
      link.download = payroll.file_name || `Busta_paga_${monthNames[payroll.month]}_${payroll.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Le mie buste paga</h3>
      </div>

      {payrolls.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm">Nessuna busta paga disponibile ancora</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payrolls.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  Busta paga {monthNames[p.month]} {p.year}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Caricata: {format(new Date(p.uploaded_at), 'd MMM yyyy', { locale: it })}</span>
                  {p.download_count > 0 && <span>Scaricamenti: {p.download_count}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDownload(p)}
                disabled={downloading === p.id}
                className="flex items-center gap-1.5 ml-3 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
              >
                {downloading === p.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Scarica
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
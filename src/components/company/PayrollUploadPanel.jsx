import { useState, useEffect } from "react";
// All base44 references removed - payroll via service layer
import { Upload, CheckCircle2, AlertCircle, FileArchive, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function PayrollUploadPanel() {
  const [file, setFile] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  useEffect(() => {
    base44.auth.me().then(me => {
      setCompanyId(me.company_id);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !companyId) return;

    setUploading(true);
    try {
      // Upload ZIP file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Process ZIP
      const response = await base44.functions.invoke('processPayrollZip', {
        zipFileUrl: file_url,
        companyId,
        year: parseInt(year),
        month: parseInt(month)
      });

      setResult(response.data);
      setFile(null);
      setMonth(month === 12 ? 1 : month + 1);
      if (month === 12) setYear(year + 1);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <FileArchive className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-800">Carica buste paga (ZIP)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Anno</label>
            <input 
              type="number" 
              value={year} 
              onChange={e => setYear(parseInt(e.target.value))}
              min="2020"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mese</label>
            <select 
              value={month} 
              onChange={e => setMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">File ZIP *</label>
            <div className="relative">
              <input 
                type="file" 
                accept=".zip"
                required
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
              />
              <p className="text-xs text-slate-500 mt-1">Contiene file nominati con: codice fiscale, email, o cognome/nome del dipendente</p>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={uploading || !file}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Elaborazione in corso...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Carica buste paga
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={`rounded-xl border p-4 ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                {result.success ? `Elaborazione completata` : 'Errore'}
              </h3>
              {result.success && (
                <p className={`text-sm ${result.success ? 'text-emerald-800' : 'text-red-800'} mt-1`}>
                  {result.processedCount} su {result.totalFiles} buste caricate con successo
                </p>
              )}
              {result.error && (
                <p className="text-sm text-red-800 mt-1">{result.error}</p>
              )}
              {result.results && result.results.length > 0 && (
                <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                  {result.results.map((r, i) => (
                    <div key={i} className="text-xs flex items-center gap-2">
                      {r.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      )}
                      <span className="text-slate-700">
                        <strong>{r.filename}</strong> {r.employee ? `→ ${r.employee}` : '(non associato)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
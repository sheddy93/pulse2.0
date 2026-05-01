import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { Upload, Check, AlertCircle, Loader2, X, Download } from "lucide-react";
import { useEffect } from "react";

const SAMPLE_CSV = `first_name,last_name,email,phone,job_title,department,location,hire_date
Mario,Rossi,mario.rossi@company.it,+39 320 123 4567,Sviluppatore,Engineering,Milano,2023-01-15
Laura,Bianchi,laura.bianchi@company.it,+39 320 234 5678,Designer,Design,Roma,2023-02-20
Andrea,Verdi,andrea.verdi@company.it,+39 320 345 6789,Product Manager,Product,Milano,2023-03-10`;

export default function EmployeeImport() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const companies = await // TODO: Replace with service.Company.filter({ id: me.company_id });
      setCompany(companies[0]);
    }).finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleImport = async () => {
    if (!file || !company) return;
    
    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('importEmployeesFromCSV', {
        file_url,
        company_id: company.id
      });
      setResult(res.data);
      setFile(null);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    }
    setImporting(false);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-dipendenti.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Importa dipendenti da CSV</h1>
          <p className="text-sm text-slate-500">Carica un file CSV per creare automaticamente i profili dei dipendenti</p>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-2">Come funziona</h3>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>Scarica il file di esempio per vedere il formato corretto</li>
            <li>Compila il CSV con i dati dei dipendenti</li>
            <li>Carica il file per validazione e importazione automatica</li>
            <li>Verifica il report con successi e errori</li>
          </ul>
        </div>

        {/* Upload area */}
        {!result && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Trascina il file CSV qui o clicca per selezionare</p>
                <p className="text-xs text-slate-500 mt-1">Formato: CSV (comma-separated values)</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {file && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">{file.name}</span>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={downloadSample}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Scarica template
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? 'Importazione in corso...' : 'Importa dipendenti'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">
                    {result.success ? 'Importazione completata' : 'Errore durante l\'importazione'}
                  </h3>
                  {result.error && <p className="text-sm text-red-600 mt-1">{result.error}</p>}
                </div>
              </div>

              {result.summary && (
                <div className="grid grid-cols-4 gap-3 py-4 border-y border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Totale</p>
                    <p className="text-2xl font-bold text-slate-800">{result.summary.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Validi</p>
                    <p className="text-2xl font-bold text-emerald-600">{result.summary.valid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Errori</p>
                    <p className="text-2xl font-bold text-red-600">{result.summary.errors}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Creati</p>
                    <p className="text-2xl font-bold text-blue-600">{result.summary.created}</p>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Errori di validazione</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                        <p className="font-medium text-red-700">Riga {err.line}</p>
                        {err.data && (
                          <p className="text-xs text-slate-600 mt-1">
                            {err.data.first_name} {err.data.last_name} ({err.data.email})
                          </p>
                        )}
                        <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                          {err.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200"
              >
                Importa altri dipendenti
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import ReactMarkdown from "react-markdown";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Sparkles, Send, Download, Loader2, TrendingUp, ChevronRight, RotateCcw, FileText, AlertCircle, CheckCircle2, Zap } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const SUGGESTED_QUERIES = [
  "Mostrami il trend delle assenze degli ultimi 3 mesi",
  "Analizza la distribuzione delle competenze in azienda",
  "Qual è l'andamento degli straordinari recentemente?",
  "Dammi una panoramica generale sullo stato del personale",
  "Quali reparti hanno più dipendenti?",
  "Analizza le presenze degli ultimi 6 mesi",
];

const CHART_LABELS = {
  leave_trend: "Trend Ferie/Permessi",
  overtime_trend: "Trend Straordinari",
  attendance_trend: "Trend Presenze",
  skills_distribution: "Distribuzione Competenze",
  department_distribution: "Dipendenti per Reparto",
  leave_type_breakdown: "Tipi di Assenza",
};

function ChartRenderer({ chartKey, rawData }) {
  if (!rawData) return null;

  const tooltipStyle = { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" };

  if (chartKey === "leave_trend") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rawData.leave_trend_6months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" style={{ fontSize: 11 }} />
          <YAxis style={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Richieste" />
          <Line type="monotone" dataKey="days" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Giorni totali" />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartKey === "overtime_trend") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rawData.overtime_trend_6months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" style={{ fontSize: 11 }} />
          <YAxis style={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Ore straordinari" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartKey === "attendance_trend") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rawData.attendance_trend_6months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" style={{ fontSize: 11 }} />
          <YAxis style={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="presenze" fill="#10b981" radius={[6, 6, 0, 0]} name="Timbrature" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartKey === "skills_distribution") {
    const data = rawData.skills_distribution?.slice(0, 8) || [];
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" style={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={100} style={{ fontSize: 10 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Dipendenti">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartKey === "department_distribution") {
    const data = rawData.department_distribution || [];
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data.map(d => ({ name: d.dept, value: d.count }))} dataKey="value" nameKey="name"
            cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartKey === "leave_type_breakdown") {
    const types = rawData.leave_type_breakdown || {};
    const data = Object.entries(types).map(([key, value]) => ({
      name: key === "ferie" ? "Ferie" : key === "permesso" ? "Permesso" : key === "malattia" ? "Malattia" : "Extra",
      value
    }));
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
            label={({ name, value }) => `${name}: ${value}`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

export default function AdvancedAnalytics() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const comps = await base44.entities.Company.filter({ id: me.company_id });
        setCompany(comps[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (q) => {
    const finalQuery = q || query;
    if (!finalQuery.trim() || !user?.company_id) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke("aiAnalytics", {
        query: finalQuery,
        company_id: user.company_id,
      });
      setResult(res.data);
    } catch (e) {
      setError(e.message || "Errore durante l'analisi");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportPdf = async () => {
    if (!user?.company_id) return;
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke("generateReport", {
        report_type: "company_hr",
        company_id: user.company_id,
      });
      // The generateReport function returns a PDF directly — open it
      if (response?.data?.error) {
        alert(response.data.error);
      }
    } catch (e) {
      // generateReport returns binary; trigger via raw fetch
      const token = await base44.auth.getToken?.();
      const res = await fetch(`/api/functions/generateReport`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ report_type: "company_hr", company_id: user.company_id }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `PulseHR_Analytics_${new Date().toISOString().split("T")[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportingPdf(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuery("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Analytics Avanzati con IA</h1>
              <p className="text-sm text-slate-500">{company?.name} · Fai una domanda e l'IA analizzerà i tuoi dati HR</p>
            </div>
          </div>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Esporta Report PDF
          </button>
        </div>

        {/* Input area */}
        {!result && !analyzing && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Cosa vuoi analizzare?
              </label>
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                  placeholder="Es. Mostrami il trend delle assenze degli ultimi 3 mesi..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={() => handleAnalyze()}
                  disabled={!query.trim() || analyzing}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Analizza
                </button>
              </div>
            </div>

            {/* Suggested queries */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Domande suggerite</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(q); handleAnalyze(q); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {analyzing && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-violet-600 animate-pulse" />
            </div>
            <p className="font-semibold text-slate-800 text-lg">L'IA sta analizzando i tuoi dati...</p>
            <p className="text-sm text-slate-500 mt-1">Sto interrogando le entità HR e generando insights</p>
            <div className="flex justify-center gap-1 mt-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
            <button onClick={handleReset} className="ml-3 underline font-semibold">Riprova</button>
          </div>
        )}

        {/* Results */}
        {result && !analyzing && (
          <div className="space-y-5">
            {/* Result header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h2 className="font-bold text-slate-800 text-lg">{result.title || "Analisi IA"}</h2>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Nuova analisi
              </button>
            </div>

            {/* Proactive Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Azioni Suggerite dall'IA</h3>
                </div>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-amber-100">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-900">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query echoed */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">La tua domanda</p>
              <p className="text-sm text-slate-700 italic">"{query}"</p>
            </div>

            {/* Insights cards */}
            {result.insights?.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-4">
                {result.insights.map((ins, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ins.icon}</span>
                      <p className="font-semibold text-slate-800 text-sm">{ins.title}</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ins.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Charts */}
            {result.charts?.length > 0 && (
              <div className={`grid gap-5 ${result.charts.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {result.charts.map(chartKey => (
                  <div key={chartKey} className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      {CHART_LABELS[chartKey] || chartKey}
                    </h3>
                    <ChartRenderer chartKey={chartKey} rawData={result.raw_data} />
                  </div>
                ))}
              </div>
            )}

            {/* AI Analysis text */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-violet-600" />
                <h3 className="font-semibold text-slate-800">Analisi Dettagliata</h3>
                <span className="ml-auto text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">Generato da IA</span>
              </div>
              <div className="prose prose-sm prose-slate max-w-none text-slate-700">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
            </div>

            {/* Quick raw stats */}
            {result.raw_data?.summary && (
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dati utilizzati nell'analisi</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Dipendenti totali", value: result.raw_data.summary.total_employees },
                    { label: "Dipendenti attivi", value: result.raw_data.summary.active },
                    { label: "Richieste ferie", value: result.raw_data.summary.total_leave_requests },
                    { label: "Ore straordinari", value: result.raw_data.summary.total_overtime_hours },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-lg p-3 text-center border border-slate-100">
                      <p className="text-xl font-bold text-slate-800">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
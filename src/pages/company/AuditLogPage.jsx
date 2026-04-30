import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ACTION_COLORS = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700"
};

const ACTION_LABELS = {
  create: "Creato",
  update: "Modificato",
  delete: "Eliminato"
};

export default function AuditLogPage() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, auditLogs] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.AuditLog.filter({ company_id: me.company_id }, '-created_date', 100)
      ]);
      setCompany(companies[0]);
      setLogs(auditLogs);
    }).finally(() => setLoading(false));
  }, []);

  const toggleExpanded = (id) => {
    setExpanded(e => {
      const newSet = new Set(e);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const filtered = logs.filter(log => {
    if (filterAction !== "all" && log.action !== filterAction) return false;
    if (filterEntity !== "all" && log.entity_type !== filterEntity) return false;
    return true;
  });

  const entities = [...new Set(logs.map(l => l.entity_type))].sort();

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Audit Log</h1>
          <p className="text-sm text-slate-500">Tracciamento completo delle operazioni critiche</p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Azione</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Tutte</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Entità</label>
            <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Tutte</option>
              {entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-slate-500">{filtered.length} operazioni</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">Nessun log trovato</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(log => (
                <div key={log.id} className="hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() => toggleExpanded(log.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex-shrink-0">
                      {expanded.has(log.id) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action]}`}>
                          {ACTION_LABELS[log.action]}
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate">{log.entity_name}</span>
                        <span className="text-xs text-slate-400">{log.entity_type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{log.user_email}</span>
                        <span>•</span>
                        <span>{format(new Date(log.created_date), "d MMM yyyy HH:mm:ss", { locale: it })}</span>
                      </div>
                    </div>
                  </button>

                  {expanded.has(log.id) && (
                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                      {log.changed_fields && log.changed_fields.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">Campi modificati:</p>
                          <div className="flex flex-wrap gap-2">
                            {log.changed_fields.map(f => (
                              <span key={f} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {log.old_data && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">Dati precedenti:</p>
                          <pre className="bg-white border border-slate-200 rounded p-3 text-xs overflow-auto max-h-48 text-slate-700">
                            {JSON.stringify(log.old_data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.new_data && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">Dati attuali:</p>
                          <pre className="bg-white border border-slate-200 rounded p-3 text-xs overflow-auto max-h-48 text-slate-700">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
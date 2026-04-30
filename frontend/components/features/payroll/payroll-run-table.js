"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, FileWarning, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AssistantInsightPanel } from "@/components/ui/assistant-insight-panel";
import { usePayrollAssistant, usePayrollRuns } from "@/hooks/use-payroll";
import { apiRequest } from "@/lib/api";

const STATUS_META = {
  draft: { label: "Bozza", className: "bg-slate-100 text-slate-700" },
  waiting_documents: { label: "In attesa documenti", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In elaborazione", className: "bg-blue-100 text-blue-700" },
  ready_for_review: { label: "Pronto per review", className: "bg-violet-100 text-violet-700" },
  approved_by_company: { label: "Approvato azienda", className: "bg-emerald-100 text-emerald-700" },
  delivered_to_employee: { label: "Pubblicato", className: "bg-emerald-100 text-emerald-700" },
  correction_requested: { label: "Correzione richiesta", className: "bg-rose-100 text-rose-700" },
  archived: { label: "Archiviato", className: "bg-slate-100 text-slate-500" },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span>;
}
function formatCompany(run) { return run?.company?.name || run?.company_name || "Azienda"; }
function formatEmployee(run) { return run?.employee?.full_name || run?.employee_name || run?.employee?.employee_code || "Dipendente"; }
function formatPeriod(run) { return `${String(run.month).padStart(2, "0")}/${run.year}`; }

function nextActions(role, run) {
  const status = run.status;
  const actions = [{ kind: "view", label: "Apri dettaglio" }];
  if (role === "consultant") {
    if (["draft", "waiting_documents", "in_progress", "correction_requested"].includes(status)) actions.push({ kind: "send_review", label: "Invia in review" });
    if (status === "approved_by_company") actions.push({ kind: "publish", label: "Pubblica" });
  }
  if (role === "company" && status === "ready_for_review") {
    actions.push({ kind: "approve", label: "Approva" });
    actions.push({ kind: "request_fix", label: "Correzione" });
  }
  return actions;
}

export function PayrollRunTable({ role = "company" }) {
  const [filters, setFilters] = useState({ month: "", year: "", company_id: "", search: "" });
  const [savingId, setSavingId] = useState(null);
  const { payrollRuns, summary, isLoading, mutate } = usePayrollRuns(role, filters);
  const { assistant } = usePayrollAssistant(role, filters);

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return payrollRuns;
    return payrollRuns.filter((run) => [formatCompany(run), formatEmployee(run), formatPeriod(run), run.status].join(" ").toLowerCase().includes(q));
  }, [payrollRuns, filters.search]);

  async function triggerWorkflow(run, action) {
    if (action.kind === "view") {
      const prefix = role === "consultant" ? "/consultant/payroll" : role === "company" ? "/company/payroll" : "/employee/payslips";
      window.location.href = `${prefix}/${run.id}`;
      return;
    }
    const targetByAction = { send_review: "ready_for_review", approve: "approved_by_company", request_fix: "correction_requested", publish: "delivered_to_employee" };
    const target = targetByAction[action.kind];
    if (!target) return;

    try {
      setSavingId(run.id);
      await apiRequest(`/payroll/${run.id}/change-status/`, { method: "POST", body: JSON.stringify({ status: target }) });
      toast.success("Workflow aggiornato.");
      mutate();
    } catch (error) {
      toast.error(error.message || "Impossibile aggiornare il workflow.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {assistant?.headline ? <AssistantInsightPanel tone={role === "consultant" ? "blue" : role === "company" ? "emerald" : "amber"} headline={assistant.headline} summary={assistant.summary} priorities={assistant.priorities || []} /> : null}

      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Centro workflow payroll</CardTitle>
          <CardDescription>Vista guidata per consulente e azienda. Le azioni disponibili cambiano in base al ruolo e allo stato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Cerca..." value={filters.search} onChange={(e)=>setFilters((c)=>({...c,search:e.target.value}))} />
            <Input placeholder="Mese" value={filters.month} onChange={(e)=>setFilters((c)=>({...c,month:e.target.value}))} />
            <Input placeholder="Anno" value={filters.year} onChange={(e)=>setFilters((c)=>({...c,year:e.target.value}))} />
            <Input placeholder="Company ID opzionale" value={filters.company_id} onChange={(e)=>setFilters((c)=>({...c,company_id:e.target.value}))} />
          </div>

          {summary ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm"><div className="text-slate-500">Totale lavorazioni</div><div className="mt-1 text-2xl font-semibold text-slate-900">{summary.total_runs || rows.length}</div></div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm"><div className="text-slate-500">Netto totale</div><div className="mt-1 text-2xl font-semibold text-slate-900">€{Number(summary.total_net_amount || 0).toLocaleString("it-IT")}</div></div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm"><div className="text-slate-500">Lordo totale</div><div className="mt-1 text-2xl font-semibold text-slate-900">€{Number(summary.total_gross_amount || 0).toLocaleString("it-IT")}</div></div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-6 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Azienda</div><div>Dipendente</div><div>Periodo</div><div>Stato</div><div>Importo</div><div className="text-right">Azioni</div>
            </div>
            {isLoading ? <div className="px-4 py-8 text-sm text-slate-500">Caricamento workflow payroll...</div> :
             rows.length === 0 ? <div className="px-4 py-8 text-sm text-slate-500">Nessuna lavorazione trovata.</div> :
             rows.map((run) => (
              <div key={run.id} className="grid grid-cols-6 items-center border-t border-slate-100 px-4 py-3 text-sm">
                <div className="font-medium text-slate-900">{formatCompany(run)}</div>
                <div className="text-slate-700">{formatEmployee(run)}</div>
                <div className="text-slate-700">{formatPeriod(run)}</div>
                <div><StatusPill status={run.status} /></div>
                <div className="text-slate-700">€{Number(run.net_amount || run.gross_amount || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</div>
                <div className="flex justify-end gap-2">
                  {nextActions(role, run).map((action) => (
                    <Button key={action.kind} size="sm" variant={action.kind === "view" ? "outline" : "default"} className="rounded-xl" disabled={savingId === run.id} onClick={() => triggerWorkflow(run, action)}>
                      {action.kind === "view" ? <Eye className="mr-1 h-4 w-4" /> : null}
                      {action.kind === "send_review" ? <Send className="mr-1 h-4 w-4" /> : null}
                      {action.kind === "approve" ? <CheckCircle2 className="mr-1 h-4 w-4" /> : null}
                      {action.kind === "request_fix" ? <FileWarning className="mr-1 h-4 w-4" /> : null}
                      {action.kind === "publish" ? <Upload className="mr-1 h-4 w-4" /> : null}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
             ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PayrollRunTable;

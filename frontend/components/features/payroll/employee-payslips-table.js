"use client";

import { useMemo, useState } from "react";
import { Calendar, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePayrollRuns } from "@/hooks/use-payroll";

export function EmployeePayslipsTable() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const { payrollRuns, isLoading } = usePayrollRuns("employee", { year });
  const rows = useMemo(() => payrollRuns.filter((run) => String(run.year) === String(year)), [payrollRuns, year]);

  function handleOpen(run) {
    window.location.href = `/employee/payslips/${run.id}`;
  }

  function handleDownload(run) {
    // Build absolute URL using NEXT_PUBLIC_API_BASE_URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
    const base = API_BASE_URL.replace(/\/$/, "");
    const url = `${base}/payroll/${run.id}/documents/`;
    window.open(url, "_blank");
    toast.success("Apertura documenti payroll.");
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Anno" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Periodo</div><div>Stato</div><div>Importo</div><div className="text-right">Azioni</div>
        </div>
        {isLoading ? <div className="px-4 py-8 text-sm text-slate-500">Caricamento buste paga...</div> :
         rows.length === 0 ? <div className="px-4 py-8 text-sm text-slate-500">Nessuna busta paga disponibile per l'anno selezionato.</div> :
         rows.map((run) => (
          <div key={run.id} className="grid grid-cols-4 items-center border-t border-slate-100 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-slate-700"><Calendar className="h-4 w-4 text-slate-400" />{String(run.month).padStart(2, "0")}/{run.year}</div>
            <div className="text-slate-700">{run.status}</div>
            <div className="text-slate-700">€{Number(run.net_amount || run.gross_amount || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => handleOpen(run)} className="rounded-xl"><Eye className="mr-1 h-4 w-4" />Apri</Button>
              <Button size="sm" onClick={() => handleDownload(run)} className="rounded-xl"><Download className="mr-1 h-4 w-4" />Documenti</Button>
            </div>
          </div>
         ))}
      </div>
    </>
  );
}

export default EmployeePayslipsTable;

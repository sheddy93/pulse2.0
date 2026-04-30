import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, differenceInMinutes } from "date-fns";
import { it } from "date-fns/locale";

function buildRows(employees, timeEntries, leaveRequests, from, to) {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  return employees.map(emp => {
    // Filter time entries for this employee in date range
    const entries = timeEntries.filter(e => {
      if (e.employee_id !== emp.id) return false;
      const d = new Date(e.timestamp);
      return d >= fromDate && d <= toDate;
    });

    // Calculate worked hours by pairing check_in / check_out
    let totalMinutes = 0;
    let breakMinutes = 0;
    const dayMap = {};
    entries.forEach(e => {
      const day = e.timestamp.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = [];
      dayMap[day].push(e);
    });

    Object.values(dayMap).forEach(dayEntries => {
      dayEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      let checkIn = null;
      let breakStart = null;
      dayEntries.forEach(e => {
        if (e.type === "check_in") checkIn = new Date(e.timestamp);
        if (e.type === "check_out" && checkIn) {
          totalMinutes += differenceInMinutes(new Date(e.timestamp), checkIn);
          checkIn = null;
        }
        if (e.type === "break_start") breakStart = new Date(e.timestamp);
        if (e.type === "break_end" && breakStart) {
          breakMinutes += differenceInMinutes(new Date(e.timestamp), breakStart);
          breakStart = null;
        }
      });
    });

    const workedHours = ((totalMinutes - breakMinutes) / 60).toFixed(2);
    const workedDays = Object.keys(dayMap).length;

    // Filter leave requests for this employee in range
    const empLeaves = leaveRequests.filter(l => {
      if (l.employee_id !== emp.id) return false;
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return start <= toDate && end >= fromDate;
    });

    const ferie = empLeaves.filter(l => l.leave_type === "ferie" && l.status === "approved").reduce((s, l) => s + (l.days_count || 0), 0);
    const permessi = empLeaves.filter(l => l.leave_type === "permesso" && l.status === "approved").reduce((s, l) => s + (l.days_count || 0), 0);
    const malattia = empLeaves.filter(l => l.leave_type === "malattia" && l.status === "approved").reduce((s, l) => s + (l.days_count || 0), 0);

    // Overtime: workedHours > (workedDays * 8)
    const standardHours = workedDays * 8;
    const overtime = Math.max(0, parseFloat(workedHours) - standardHours).toFixed(2);

    return {
      "Cognome": emp.last_name,
      "Nome": emp.first_name,
      "Matricola": emp.employee_code || "",
      "Mansione": emp.job_title || "",
      "Reparto": emp.department || "",
      "Giorni Presenti": workedDays,
      "Ore Lavorate": workedHours,
      "Ore Straordinario": overtime,
      "Ferie (gg)": ferie,
      "Permessi (gg)": permessi,
      "Malattia (gg)": malattia,
    };
  });
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(";")];
  rows.forEach(row => lines.push(headers.map(h => `"${row[h]}"`).join(";")));
  return lines.join("\n");
}

function toExcel(rows) {
  // Simple SYLK-free approach: generate an HTML table that Excel can open
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><style>td,th{border:1px solid #ccc;padding:4px 8px;}</style></head><body><table>`;
  html += "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
  rows.forEach(row => {
    html += "<tr>" + headers.map(h => `<td>${row[h]}</td>`).join("") + "</tr>";
  });
  html += "</table></body></html>";
  return html;
}

export default function PayrollExport({ companyId, employees }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [from, setFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [fmt, setFmt] = useState("csv");

  const handleExport = async () => {
    setLoading(true);
    const [timeEntries, leaveRequests] = await Promise.all([
      base44.entities.TimeEntry.filter({ company_id: companyId }),
      base44.entities.LeaveRequest.filter({ company_id: companyId }),
    ]);

    const rows = buildRows(employees, timeEntries, leaveRequests, from, to);
    const label = `payroll_${from}_${to}`;

    if (fmt === "csv") {
      const csv = toCSV(rows);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${label}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const html = toExcel(rows);
      const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${label}.xls`; a.click();
      URL.revokeObjectURL(url);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
        <FileSpreadsheet className="w-4 h-4" /> Esporta Payroll
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">Esporta riepilogo Payroll</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dal</label>
                  <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Al</label>
                  <input type="date" value={to} onChange={e => setTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Formato</label>
                <div className="flex gap-3">
                  {[["csv", "CSV"], ["excel", "Excel (.xls)"]].map(([val, label]) => (
                    <button key={val} onClick={() => setFmt(val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${fmt === val ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Il file includerà per ogni dipendente:</p>
                <p>• Ore lavorate totali e straordinari</p>
                <p>• Giorni di presenza</p>
                <p>• Ferie, permessi e malattia (approvati)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Annulla
              </button>
              <button onClick={handleExport} disabled={loading || !from || !to || employees.length === 0}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loading ? "Elaborazione..." : "Scarica"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
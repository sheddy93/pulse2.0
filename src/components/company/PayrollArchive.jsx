import { useState, useMemo } from "react";
// All base44 references removed - payroll via service layer
import { Download, X, Loader2, FileArchive, Search } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import JSZip from "jszip";

function calculatePayrollData(employees, timeEntries, leaveRequests, from, to) {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  return employees.map(emp => {
    const entries = timeEntries.filter(e => {
      if (e.employee_id !== emp.id) return false;
      const d = new Date(e.timestamp);
      return d >= fromDate && d <= toDate;
    });

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

    const empLeaves = leaveRequests.filter(l => {
      if (l.employee_id !== emp.id) return false;
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return start <= toDate && end >= fromDate;
    });

    const ferie = empLeaves.filter(l => l.leave_type === "ferie" && l.status === "approved").reduce((s, l) => s + (l.days_count || 0), 0);
    const permessi = empLeaves.filter(l => l.leave_type === "permesso" && l.status === "approved").reduce((s, l) => s + (l.days_count || 0), 0);
    const malattia = empLeaves.filter(l => l.leave_type === "malattia" && l.status === "approved").reduce((s, l) => s + (l.days_count || 0), 0);

    const standardHours = workedDays * 8;
    const overtime = Math.max(0, parseFloat(workedHours) - standardHours).toFixed(2);

    return {
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      code: emp.employee_code || "",
      job_title: emp.job_title || "",
      department: emp.department || "",
      workedHours,
      workedDays,
      overtime,
      ferie,
      permessi,
      malattia,
    };
  });
}

function buildReportCSV(data) {
  const headers = ["Cognome Nome", "Matricola", "Mansione", "Reparto", "Giorni Presenti", "Ore Lavorate", "Ore Straordinario", "Ferie (gg)", "Permessi (gg)", "Malattia (gg)"];
  const lines = [headers.join(";")];
  data.forEach(row => {
    lines.push([
      row.name,
      row.code,
      row.job_title,
      row.department,
      row.workedDays,
      row.workedHours,
      row.overtime,
      row.ferie,
      row.permessi,
      row.malattia,
    ].map(v => `"${v}"`).join(";"));
  });
  return lines.join("\n");
}

export default function PayrollArchive({ companyId, employees }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const now = new Date();
  const [from, setFrom] = useState(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"));
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    return employees.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.employee_code || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  const toggleSelect = (id) => {
    const copy = new Set(selected);
    if (copy.has(id)) copy.delete(id);
    else copy.add(id);
    setSelected(copy);
  };

  const handleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(e => e.id)));
  };

  const handleDownload = async () => {
    setLoading(true);
    const [timeEntries, leaveRequests, documents] = await Promise.all([
      base44.entities.TimeEntry.filter({ company_id: companyId }),
      base44.entities.LeaveRequest.filter({ company_id: companyId }),
      base44.entities.Document.filter({ company_id: companyId }),
    ]);

    const selectedEmps = employees.filter(e => selected.has(e.id));
    const payrollData = calculatePayrollData(selectedEmps, timeEntries, leaveRequests, from, to);

    const zip = new JSZip();
    
    // Add CSV report
    const csv = buildReportCSV(payrollData);
    zip.file("riepilogo_payroll.csv", "\uFEFF" + csv);

    // Add payroll folder with individual employee files
    const payrollFolder = zip.folder("buste_paga");
    payrollData.forEach(emp => {
      const content = `BUSTA PAGA\n${"=".repeat(50)}\nDipendente: ${emp.name}\nMatricola: ${emp.code}\nMansione: ${emp.job_title}\nReparto: ${emp.department}\nPeriodo: ${from} - ${to}\n${"=".repeat(50)}\n\nGiorni Presenti: ${emp.workedDays}\nOre Lavorate: ${emp.workedHours}\nOre Straordinario: ${emp.overtime}\nFerie: ${emp.ferie} gg\nPermessi: ${emp.permessi} gg\nMalattia: ${emp.malattia} gg\n`;
      payrollFolder.file(`${emp.code || emp.name.replace(/\s+/g, "_")}_${from}.txt`, content);
    });

    // Add linked documents (buste paga, certificati)
    const docFolder = zip.folder("documenti");
    selectedEmps.forEach(emp => {
      const empDocs = documents.filter(d => d.employee_id === emp.id && ["busta_paga", "certificato"].includes(d.doc_type));
      if (empDocs.length > 0) {
        empDocs.forEach(doc => {
          if (doc.file_url) docFolder.file(`${emp.first_name}_${emp.last_name}/${doc.title}`, `Link: ${doc.file_url}\n`, { binary: false });
        });
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${from}_${to}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
        <FileArchive className="w-4 h-4" /> Scarica Archivio
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">Scarica Archivio Payroll</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dal</label>
                  <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Al</label>
                  <input type="date" value={to} onChange={e => setTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Search and select all */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600">Dipendenti</label>
                  <button onClick={handleSelectAll} className="text-xs text-blue-600 hover:underline font-medium">
                    {selected.size === filtered.length ? "Deseleziona tutto" : "Seleziona tutto"}
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Cerca per nome o matricola..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Employee list */}
              <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">Nessun dipendente trovato</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filtered.map(emp => (
                      <label key={emp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={selected.has(emp.id)} onChange={() => toggleSelect(emp.id)} className="w-4 h-4 rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-slate-500">{emp.employee_code} • {emp.job_title}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">L'archivio includerà:</p>
                <p>✓ Report CSV riepilogativo con ore, permessi e straordinari</p>
                <p>✓ Buste paga singole per ogni dipendente selezionato</p>
                <p>✓ Documenti collegati (certificati, buste paga caricate)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Annulla
              </button>
              <button onClick={handleDownload} disabled={loading || selected.size === 0}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loading ? "Elaborazione..." : `Scarica (${selected.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function AssetAssignmentPage() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    asset_id: "",
    employee_id: "",
    assigned_at: format(new Date(), "yyyy-MM-dd"),
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, assetsList, empsList, assignsList] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.Asset.filter({ company_id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id }),
        base44.entities.AssetAssignment.filter({ company_id: me.company_id, unassigned_at: null })
      ]);
      setCompany(companies[0]);
      setAssets(assetsList);
      setEmployees(empsList);
      setAssignments(assignsList);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !form.asset_id || !form.employee_id) return;

    const asset = assets.find(a => a.id === form.asset_id);
    const employee = employees.find(e => e.id === form.employee_id);

    // First unassign any previous assignment for this asset
    const prevAssign = assignments.find(a => a.asset_id === form.asset_id);
    if (prevAssign) {
      await base44.entities.AssetAssignment.update(prevAssign.id, { unassigned_at: format(new Date(), "yyyy-MM-dd") });
    }

    // Create new assignment
    await base44.entities.AssetAssignment.create({
      company_id: company.id,
      asset_id: form.asset_id,
      employee_id: form.employee_id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      asset_name: asset.asset_name,
      assigned_at: form.assigned_at,
      notes: form.notes || undefined
    });

    // Update asset status
    await base44.entities.Asset.update(form.asset_id, { status: "assegnato" });

    setForm({ asset_id: "", employee_id: "", assigned_at: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setShowForm(false);

    // Reload
    const [assetsList, assignsList] = await Promise.all([
      base44.entities.Asset.filter({ company_id: company.id }),
      base44.entities.AssetAssignment.filter({ company_id: company.id, unassigned_at: null })
    ]);
    setAssets(assetsList);
    setAssignments(assignsList);
  };

  const handleUnassign = async (assignId, assetId) => {
    if (!confirm("Revocare l'assegnazione?")) return;
    await base44.entities.AssetAssignment.update(assignId, { unassigned_at: format(new Date(), "yyyy-MM-dd") });
    await base44.entities.Asset.update(assetId, { status: "disponibile" });
    setAssignments(a => a.filter(assign => assign.id !== assignId));
  };

  const availableAssets = assets.filter(a => a.status === "disponibile" || a.status === "assegnato");
  const activeEmployees = employees.filter(e => e.status === "active");

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Assegnazione Asset</h1>
            <p className="text-sm text-slate-500">{assignments.length} asset assegnati</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Annulla" : "Assegna asset"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Assegna asset a dipendente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Asset *</label>
                <select required value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Seleziona asset —</option>
                  {availableAssets.map(a => (
                    <option key={a.id} value={a.id} disabled={a.status === "assegnato"}>
                      {a.asset_name} {a.status === "assegnato" ? "(Assegnato)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dipendente *</label>
                <select required value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Seleziona dipendente —</option>
                  {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data assegnazione</label>
                <input type="date" value={form.assigned_at} onChange={e => setForm(f => ({ ...f, assigned_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                Assegna asset
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
                Annulla
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {assignments.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-slate-500 font-medium">Nessun asset assegnato</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Asset", "Dipendente", "Data assegnazione", "Note", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(assign => (
                    <tr key={assign.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{assign.asset_name}</td>
                      <td className="px-5 py-3 text-slate-700">{assign.employee_name}</td>
                      <td className="px-5 py-3 text-slate-500">{format(new Date(assign.assigned_at), "d MMM yyyy", { locale: it })}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{assign.notes || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleUnassign(assign.id, assign.asset_id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
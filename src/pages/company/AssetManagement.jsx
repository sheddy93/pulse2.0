import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ASSET_TYPES = { computer: "Computer", telefono: "Telefono", badge: "Badge", altro: "Altro" };
const STATUS_BADGE = {
  disponibile: { label: "Disponibile", cls: "bg-emerald-100 text-emerald-700" },
  assegnato: { label: "Assegnato", cls: "bg-blue-100 text-blue-700" },
  in_manutenzione: { label: "In manutenzione", cls: "bg-amber-100 text-amber-700" },
  dismesso: { label: "Dismesso", cls: "bg-slate-100 text-slate-700" }
};

export default function AssetManagement() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    asset_type: "computer",
    asset_name: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    cost: "",
    status: "disponibile",
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, assetsList] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.Asset.filter({ company_id: me.company_id }, '-created_date')
      ]);
      setCompany(companies[0]);
      setAssets(assetsList);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !form.asset_type || !form.asset_name) return;

    const data = {
      company_id: company.id,
      asset_type: form.asset_type,
      asset_name: form.asset_name,
      model: form.model || undefined,
      serial_number: form.serial_number || undefined,
      purchase_date: form.purchase_date || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      status: form.status,
      notes: form.notes || undefined
    };

    if (editId) {
      await base44.entities.Asset.update(editId, data);
      setEditId(null);
    } else {
      await base44.entities.Asset.create(data);
    }

    setForm({ asset_type: "computer", asset_name: "", model: "", serial_number: "", purchase_date: "", cost: "", status: "disponibile", notes: "" });
    setShowForm(false);
    const assetsList = await base44.entities.Asset.filter({ company_id: company.id }, '-created_date');
    setAssets(assetsList);
  };

  const handleEdit = (asset) => {
    setForm({
      asset_type: asset.asset_type,
      asset_name: asset.asset_name,
      model: asset.model || "",
      serial_number: asset.serial_number || "",
      purchase_date: asset.purchase_date || "",
      cost: asset.cost ? asset.cost.toString() : "",
      status: asset.status,
      notes: asset.notes || ""
    });
    setEditId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Eliminare l'asset?")) return;
    await base44.entities.Asset.delete(id);
    setAssets(a => a.filter(asset => asset.id !== id));
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Gestione Asset</h1>
            <p className="text-sm text-slate-500">{assets.length} asset in database</p>
          </div>
          <button onClick={() => { setEditId(null); setForm({ asset_type: "computer", asset_name: "", model: "", serial_number: "", purchase_date: "", cost: "", status: "disponibile", notes: "" }); setShowForm(!showForm); }} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Annulla" : "Nuovo asset"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">{editId ? "Modifica asset" : "Aggiungi nuovo asset"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo asset *</label>
                <select required value={form.asset_type} onChange={e => setForm(f => ({ ...f, asset_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(ASSET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome asset *</label>
                <input required value={form.asset_name} onChange={e => setForm(f => ({ ...f, asset_name: e.target.value }))}
                  placeholder="Es. MacBook Pro 14"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Modello</label>
                <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  placeholder="Es. Apple M3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Numero seriale</label>
                <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                  placeholder="Es. SN12345"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data acquisto</label>
                <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Costo (€)</label>
                <input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Stato</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                {editId ? "Salva modifiche" : "Aggiungi asset"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
                Annulla
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {assets.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-slate-500 font-medium">Nessun asset nel sistema</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Tipo", "Nome", "Modello", "Numero seriale", "Data acquisto", "Costo", "Stato", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-700">{ASSET_TYPES[asset.asset_type]}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{asset.asset_name}</td>
                      <td className="px-5 py-3 text-slate-500">{asset.model || "—"}</td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">{asset.serial_number || "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{asset.purchase_date ? format(new Date(asset.purchase_date), "d MMM yyyy", { locale: it }) : "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{asset.cost ? `€${asset.cost.toFixed(2)}` : "—"}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[asset.status].cls}`}>{STATUS_BADGE[asset.status].label}</span></td>
                      <td className="px-5 py-3 flex gap-2 justify-end">
                        <button onClick={() => handleEdit(asset)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
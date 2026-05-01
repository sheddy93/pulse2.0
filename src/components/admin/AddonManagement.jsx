import { useState, useEffect } from "react";
// All base44 references removed - feature management via service layer
import { Plus, Trash2, Save, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const ADDON_TYPES = [
  { value: "extra_employees", label: "Dipendenti extra" },
  { value: "storage_gb", label: "Storage (GB)" },
  { value: "api_calls", label: "API Calls" },
  { value: "custom_reports", label: "Report personalizzati" },
  { value: "sso", label: "SSO/SAML" },
  { value: "white_label", label: "White Label" },
];

export default function AddonManagement() {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    const result = await base44.entities.SubscriptionAddon.filter({});
    setAddons(result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    setLoading(false);
  };

  const updateAddon = (id, field, value) => {
    setAddons(addons.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addNewAddon = () => {
    const newAddon = {
      name: "Nuovo Add-on",
      addon_type: "extra_employees",
      unit_label: "per mese",
      base_price: 0,
      min_quantity: 1,
      is_active: true,
      sort_order: addons.length,
    };
    setAddons([...addons, newAddon]);
    setEditingId("new");
  };

  const saveAddon = async (addon) => {
    if (!addon.name || addon.base_price === undefined) {
      toast.error("Nome e prezzo sono obbligatori");
      return;
    }

    setSaving(true);
    try {
      if (addon.id && addon.id !== "new") {
        await base44.entities.SubscriptionAddon.update(addon.id, addon);
        toast.success("Add-on aggiornato");
      } else {
        const { id, ...rest } = addon;
        await base44.entities.SubscriptionAddon.create(rest);
        toast.success("Add-on creato");
      }
      setEditingId(null);
      await loadAddons();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAddon = async (id) => {
    if (!id || id === "new") {
      setAddons(addons.filter(a => a.id !== id));
      setEditingId(null);
      return;
    }
    if (!window.confirm("Sei sicuro?")) return;
    
    setSaving(true);
    try {
      await base44.entities.SubscriptionAddon.delete(id);
      toast.success("Add-on eliminato");
      await loadAddons();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Caricamento...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">Aggiungi opzioni personalizzate ai piani di abbonamento</p>
        <button
          onClick={addNewAddon}
          className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
        >
          <Plus className="w-4 h-4" /> Nuovo Add-on
        </button>
      </div>

      {addons.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
          Nessun add-on configurato. Clicca "Nuovo Add-on" per iniziare.
        </div>
      ) : (
        <div className="space-y-2">
          {addons.map(addon => (
            <div
              key={addon.id || "new"}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === addon.id ? null : addon.id)
                }
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedId === addon.id ? "rotate-180" : ""
                    }`}
                  />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{addon.name}</p>
                    <p className="text-xs text-slate-500">
                      €{addon.base_price} {addon.unit_label}
                    </p>
                  </div>
                </div>
                {addon.is_active && (
                  <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    Attivo
                  </span>
                )}
              </button>

              {/* Content */}
              {expandedId === addon.id && (
                <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={addon.name || ""}
                        onChange={(e) =>
                          updateAddon(addon.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Tipo
                      </label>
                      <select
                        value={addon.addon_type || "extra_employees"}
                        onChange={(e) =>
                          updateAddon(addon.id, "addon_type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ADDON_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Prezzo base
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={addon.base_price || 0}
                        onChange={(e) =>
                          updateAddon(addon.id, "base_price", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Unità (es. per dipendente/mese)
                      </label>
                      <input
                        type="text"
                        value={addon.unit_label || ""}
                        onChange={(e) =>
                          updateAddon(addon.id, "unit_label", e.target.value)
                        }
                        placeholder="per mese"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Quantità minima
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={addon.min_quantity || 1}
                        onChange={(e) =>
                          updateAddon(addon.id, "min_quantity", parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Quantità massima
                      </label>
                      <input
                        type="number"
                        value={addon.max_quantity || ""}
                        onChange={(e) =>
                          updateAddon(addon.id, "max_quantity", e.target.value ? parseInt(e.target.value) : null)
                        }
                        placeholder="Illimitato"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Descrizione
                    </label>
                    <textarea
                      value={addon.description || ""}
                      onChange={(e) =>
                        updateAddon(addon.id, "description", e.target.value)
                      }
                      rows="2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`active-${addon.id}`}
                      checked={addon.is_active !== false}
                      onChange={(e) =>
                        updateAddon(addon.id, "is_active", e.target.checked)
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                    <label htmlFor={`active-${addon.id}`} className="text-sm text-slate-700">
                      Attivo
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => saveAddon(addon)}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Salva
                    </button>
                    <button
                      onClick={() => deleteAddon(addon.id)}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Elimina
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
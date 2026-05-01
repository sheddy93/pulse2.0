/**
 * Dashboard Customizer - Permette customizzazione widgets
 */
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AVAILABLE_WIDGETS = [
  { id: 'kpi_hours', label: 'Ore lavorate', category: 'attendance' },
  { id: 'kpi_leaves', label: 'Ferie rimanenti', category: 'leave' },
  { id: 'chart_attendance', label: 'Grafico Presenze', category: 'attendance' },
  { id: 'upcoming_events', label: 'Prossimi eventi', category: 'calendar' },
  { id: 'recent_documents', label: 'Documenti recenti', category: 'documents' },
  { id: 'announcements', label: 'Annunci', category: 'messages' },
  { id: 'my_tasks', label: 'I miei compiti', category: 'tasks' },
  { id: 'performance', label: 'Performance', category: 'performance' },
];

export default function DashboardCustomizer({ onClose, userId, companyId }) {
  const [widgets, setWidgets] = useState([]);
  const [saving, setSaving] = useState(false);

  const addWidget = (widgetId) => {
    if (!widgets.find(w => w.id === widgetId)) {
      setWidgets([...widgets, { id: widgetId, visible: true }]);
    }
  };

  const removeWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const toggleWidget = (widgetId) => {
    setWidgets(widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: `Save dashboard configuration for user ${userId}: ${JSON.stringify(widgets)}`
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-slate-900 w-full sm:w-96 rounded-t-lg sm:rounded-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="font-semibold text-slate-800 dark:text-white">Personalizza Dashboard</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Widget attivi */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Widget attivi</h3>
            <div className="space-y-2">
              {widgets.map(w => {
                const config = AVAILABLE_WIDGETS.find(v => v.id === w.id);
                return (
                  <div key={w.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <GripHorizontal className="w-4 h-4 text-slate-400" />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{config?.label}</span>
                    <input
                      type="checkbox"
                      checked={w.visible}
                      onChange={() => toggleWidget(w.id)}
                      className="w-4 h-4"
                    />
                    <button
                      onClick={() => removeWidget(w.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Widget disponibili */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Aggiungi widget</h3>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_WIDGETS.filter(v => !widgets.find(w => w.id === v.id)).map(w => (
                <button
                  key={w.id}
                  onClick={() => addWidget(w.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>
    </div>
  );
}
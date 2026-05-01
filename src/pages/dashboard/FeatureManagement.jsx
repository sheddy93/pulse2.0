import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Settings, DollarSign, Power } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureManagement() {
  const [user, setUser] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (me?.role !== 'super_admin') {
        window.location.href = '/dashboard/admin';
        return;
      }
      setUser(me);
      
      const data = await base44.entities.FeaturePlan.list();
      setFeatures(data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    }).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (featureId, currentStatus) => {
    setSaving(featureId);
    try {
      await base44.entities.FeaturePlan.update(featureId, {
        is_active: !currentStatus
      });
      setFeatures(features.map(f => 
        f.id === featureId ? { ...f, is_active: !currentStatus } : f
      ));
      toast.success('Feature aggiornata');
    } catch (err) {
      toast.error('Errore: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const categories = ['all', ...new Set(features.map(f => f.category))];
  const filtered = filterCategory === 'all' 
    ? features 
    : features.filter(f => f.category === filterCategory);

  if (loading) return <PageLoader color="blue" />;

  const categoryLabels = {
    attendance: '📍 Presenze',
    documents: '📄 Documenti',
    payroll: '💰 Payroll',
    training: '🎓 Formazione',
    performance: '⭐ Performance',
    shifts: '📅 Turni',
    analytics: '📊 Analytics',
    integrations: '⚙️ Integrazioni',
    custom: '🔧 Custom'
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestione Feature</h1>
            <p className="text-sm text-slate-500">Abilita/disabilita feature globali</p>
          </div>
        </div>

        {/* Filtri Categoria */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Grid Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(feature => (
            <div
              key={feature.id}
              className={`rounded-xl border-2 p-5 transition-all ${
                feature.is_active
                  ? 'bg-white border-emerald-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{feature.feature_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(feature.id, feature.is_active)}
                  disabled={saving === feature.id}
                  className={`ml-2 p-2 rounded-lg transition-colors ${
                    feature.is_active
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  title={feature.is_active ? 'Disabilita' : 'Abilita'}
                >
                  {saving === feature.id ? (
                    <Power className="w-5 h-5 animate-spin" />
                  ) : (
                    <Power className={`w-5 h-5 ${feature.is_active ? 'opacity-100' : 'opacity-40'}`} />
                  )}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {/* Tier */}
                {feature.tier_requirements && feature.tier_requirements.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Piano:</span>
                    <div className="flex gap-1">
                      {feature.tier_requirements.map(tier => (
                        <span
                          key={tier}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold"
                        >
                          {tier}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ruoli */}
                {feature.available_for_roles && feature.available_for_roles.length > 0 && (
                  <div>
                    <span className="text-slate-600">Ruoli: </span>
                    <span className="text-slate-700">
                      {feature.available_for_roles.join(', ')}
                    </span>
                  </div>
                )}

                {/* Costo */}
                {feature.monthly_cost > 0 && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-200">
                    <DollarSign className="w-3 h-3 text-orange-500" />
                    <span className="text-slate-700">
                      +${feature.monthly_cost}/mese
                    </span>
                  </div>
                )}
              </div>

              {!feature.is_active && (
                <div className="mt-3 p-2 bg-slate-100 rounded text-xs text-slate-600 text-center">
                  ❌ Disabilitata
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
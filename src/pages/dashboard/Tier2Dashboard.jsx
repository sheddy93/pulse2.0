/**
 * TIER 2 Implementation Dashboard
 * SuperAdmin vede status di tutte le integrazioni
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { CheckCircle2, AlertCircle, Clock, Settings, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TIER2_FEATURES = [
  {
    category: 'API & Integration',
    items: [
      { name: 'REST API v1', status: 'done', progress: 100, effort: '25h' },
      { name: 'API Documentation (Swagger)', status: 'done', progress: 100, effort: '10h' },
      { name: 'Webhook Events', status: 'done', progress: 100, effort: '15h' }
    ]
  },
  {
    category: 'Slack Integration',
    items: [
      { name: 'Slack config entity', status: 'done', progress: 100, effort: '5h' },
      { name: 'Slack notification function', status: 'done', progress: 100, effort: '10h' },
      { name: 'Slack admin UI', status: 'todo', progress: 0, effort: '15h' }
    ]
  },
  {
    category: 'Google Calendar Sync',
    items: [
      { name: 'Google Calendar config entity', status: 'done', progress: 100, effort: '3h' },
      { name: 'Calendar sync function', status: 'done', progress: 100, effort: '15h' },
      { name: 'OAuth setup + admin UI', status: 'todo', progress: 0, effort: '20h' }
    ]
  },
  {
    category: 'Push Notifications',
    items: [
      { name: 'Firebase setup', status: 'partial', progress: 50, effort: '10h' },
      { name: 'Push notification function', status: 'done', progress: 100, effort: '20h' },
      { name: 'Notification preferences UI', status: 'done', progress: 100, effort: '15h' }
    ]
  }
];

export default function Tier2Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFeatures: 0,
    completedFeatures: 0,
    totalEffort: '0h',
    completedEffort: 0
  });

  useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
      
      // Calculate stats
      let total = 0, completed = 0, effort = 0;
      TIER2_FEATURES.forEach(cat => {
        cat.items.forEach(item => {
          total++;
          if (item.status === 'done') completed++;
          effort += parseInt(item.effort);
        });
      });

      setStats({
        totalFeatures: total,
        completedFeatures: completed,
        totalEffort: `${effort}h`,
        completedEffort: completed
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const statusIcon = {
    done: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    todo: <Clock className="w-5 h-5 text-slate-400" />,
    partial: <AlertCircle className="w-5 h-5 text-amber-600" />
  };

  const statusColor = {
    done: 'bg-emerald-50 border-emerald-200',
    todo: 'bg-slate-50 border-slate-200',
    partial: 'bg-amber-50 border-amber-200'
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">TIER 2 Implementation Status</h1>
          <p className="text-slate-600 mt-2">API, Integrations & Notifications</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Features</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalFeatures}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
            <p className="text-xs text-emerald-700 uppercase font-semibold">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedFeatures}</p>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-xs text-blue-700 uppercase font-semibold">Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{Math.round((stats.completedFeatures / stats.totalFeatures) * 100)}%</p>
          </div>
          <div className="bg-slate-100 rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-700 uppercase font-semibold">Total Effort</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalEffort}</p>
          </div>
        </div>

        {/* Features by category */}
        <div className="space-y-6">
          {TIER2_FEATURES.map(category => (
            <div key={category.category} className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                {category.category}
              </h2>

              <div className="grid gap-3">
                {category.items.map(item => (
                  <div key={item.name} className={`border rounded-lg p-4 ${statusColor[item.status]}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {statusIcon[item.status]}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{item.name}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-xs">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600 font-medium">{item.progress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-600 font-semibold">{item.effort}</span>
                        <div className="mt-2">
                          {item.status === 'done' && (
                            <span className="inline-block px-2 py-1 bg-emerald-600 text-white text-xs rounded-full font-semibold">
                              Done
                            </span>
                          )}
                          {item.status === 'todo' && (
                            <span className="inline-block px-2 py-1 bg-slate-400 text-white text-xs rounded-full font-semibold">
                              Todo
                            </span>
                          )}
                          {item.status === 'partial' && (
                            <span className="inline-block px-2 py-1 bg-amber-600 text-white text-xs rounded-full font-semibold">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">Remaining TODO for TIER 2</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ REST API v1 (DONE - 25h)</li>
            <li>✅ API Documentation (DONE - 10h)</li>
            <li>✅ Webhook Events (DONE - 15h)</li>
            <li>⏳ Slack admin UI configuration panel (15h)</li>
            <li>⏳ Google Calendar OAuth + admin UI (20h)</li>
            <li>⏳ Firebase Cloud Messaging setup (10h)</li>
            <li>✅ Notification preferences (DONE - 15h)</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button className="bg-blue-600" onClick={() => window.location.href = '/dashboard/admin/settings'}>
            <Settings className="w-4 h-4 mr-2" /> Configure Integrations
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
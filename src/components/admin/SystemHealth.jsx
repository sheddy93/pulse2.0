import { CheckCircle2, AlertTriangle, Activity, Zap } from 'lucide-react';

export default function SystemHealth() {
  const services = [
    { name: 'Database', status: 'healthy', latency: '12ms' },
    { name: 'Authentication', status: 'healthy', latency: '34ms' },
    { name: 'File Storage', status: 'healthy', latency: '89ms' },
    { name: 'Email Service', status: 'healthy', latency: '234ms' },
    { name: 'Stripe Webhook', status: 'healthy', latency: '156ms' },
    { name: 'Slack Integration', status: 'healthy', latency: '198ms' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Services Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Stato Servizi</h3>
        <div className="space-y-3">
          {services.map((service, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-slate-900">{service.name}</span>
              </div>
              <span className="text-xs text-slate-500">{service.latency}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Avvisi di Sistema</h3>
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">Storage a 75%</p>
              <p className="text-amber-700 text-xs mt-1">Aumentare la quota entro 7 giorni</p>
            </div>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">Backup completati</p>
              <p className="text-green-700 text-xs mt-1">Ultimo backup: 2 ore fa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-slate-600">API Response Time</span>
              <span className="font-semibold text-slate-900">125ms</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-slate-600">Uptime Mensile</span>
              <span className="font-semibold text-slate-900">99.9%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '99%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Stats */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Database</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Entità totali</span>
            <span className="font-semibold text-slate-900">2.4M</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Query/min</span>
            <span className="font-semibold text-slate-900">1,234</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600">Indici attivi</span>
            <span className="font-semibold text-slate-900">47</span>
          </div>
        </div>
      </div>
    </div>
  );
}
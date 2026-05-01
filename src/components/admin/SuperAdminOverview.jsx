import { Building2, Users, TrendingUp, AlertCircle, Activity, Zap } from 'lucide-react';

export default function SuperAdminOverview({ stats }) {
  const cards = [
    { icon: Building2, label: 'Aziende', value: stats.companies, color: 'blue' },
    { icon: Users, label: 'Utenti', value: stats.users, color: 'violet' },
    { icon: TrendingUp, label: 'Abbonamenti', value: stats.activeSubscriptions, color: 'emerald' },
    { icon: Activity, label: 'Dipendenti', value: stats.totalEmployees || 0, color: 'orange' },
    { icon: Zap, label: 'Storage (GB)', value: stats.totalStorage || 0, color: 'cyan' },
    { icon: AlertCircle, label: 'Avvisi', value: stats.alerts || 0, color: 'red' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
/**
 * Quick Stats - KPI Widget
 */
import { TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function QuickStats({ stats = {} }) {
  const items = [
    { label: 'Ore Lavorate', value: stats.hours_worked || 0, icon: Clock, color: 'text-blue-600' },
    { label: 'Ferie Rimanenti', value: stats.leave_balance || 20, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'In Scadenza', value: stats.expiring || 0, icon: AlertCircle, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{item.value}</p>
              </div>
              <div className={`p-2 bg-slate-100 dark:bg-slate-700 rounded-lg ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
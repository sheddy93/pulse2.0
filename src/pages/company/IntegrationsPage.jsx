/**
 * Integrations Page
 * Overview integrazioni: Slack, Zapier, API, Webhooks
 */
import { useAuth } from '@/lib/AuthContextDecoupled';
import AppShell from '@/components/layout/AppShell';
import { Slack, Code, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const INTEGRATIONS = [
  {
    name: 'REST API',
    icon: Code,
    description: 'Build custom integrations with our public API',
    status: 'available',
    color: 'blue',
    link: '/dashboard/company/api'
  },
  {
    name: 'Webhooks',
    icon: Zap,
    description: 'Receive real-time events for your apps',
    status: 'available',
    color: 'purple',
    link: '#'
  },
  {
    name: 'Slack',
    icon: Slack,
    description: 'Get notifications and approvals in Slack',
    status: 'coming',
    color: 'indigo',
    link: '#'
  }
];

export default function IntegrationsPage() {
  const { user } = useAuth();

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
          <p className="text-slate-600 mt-2">Connect PulseHR with your favorite tools</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {INTEGRATIONS.map(int => {
            const Icon = int.icon;
            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 text-blue-600',
              purple: 'bg-purple-50 border-purple-200 text-purple-600',
              indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600'
            };

            return (
              <div key={int.name} className={`p-6 rounded-lg border ${colorClasses[int.color]} space-y-4`}>
                <Icon className="w-8 h-8" />
                <div>
                  <h3 className="font-bold text-slate-900">{int.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{int.description}</p>
                </div>
                {int.status === 'available' ? (
                  <Link to={int.link}>
                    <Button className="w-full bg-blue-600" size="sm">Connect</Button>
                  </Link>
                ) : (
                  <Button disabled size="sm" className="w-full">Coming Soon</Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
import { useState, useEffect } from 'react';
import { // TODO: Service integration } from '@/api/// TODO: Service integrationClient';
import { Search, Shield, Lock, Mail } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // TODO: Service integration.entities.User.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Caricamento...</div>;

  const roleColors = {
    super_admin: 'bg-red-100 text-red-700',
    company_owner: 'bg-blue-100 text-blue-700',
    company_admin: 'bg-indigo-100 text-indigo-700',
    hr_manager: 'bg-purple-100 text-purple-700',
    manager: 'bg-amber-100 text-amber-700',
    employee: 'bg-slate-100 text-slate-700',
    consultant: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cerca utente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Nome</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Email</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Ruolo</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Stato</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Join</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{user.full_name}</td>
                <td className="px-5 py-3 text-slate-600">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full" /> Attivo
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {new Date(user.created_date).toLocaleDateString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-center text-slate-500 py-8">Nessun utente trovato</p>}
    </div>
  );
}
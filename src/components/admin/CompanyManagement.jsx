import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Edit2, Trash2, Eye, Shield } from 'lucide-react';

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    base44.entities.Company.list().then(setCompanies).finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Caricamento...</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cerca azienda..."
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
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Dipendenti</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Status</th>
              <th className="text-right px-5 py-3 font-semibold text-slate-700">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((company) => (
              <tr key={company.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{company.name}</td>
                <td className="px-5 py-3 text-slate-600">{company.email}</td>
                <td className="px-5 py-3 text-slate-600">{company.employee_count || 0}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    company.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {company.status || 'active'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right flex gap-2 justify-end">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-center text-slate-500 py-8">Nessuna azienda trovata</p>}
    </div>
  );
}
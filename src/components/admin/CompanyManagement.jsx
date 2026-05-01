import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye } from 'lucide-react';

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // TODO: Replace with service call
    setCompanies([]);
    setLoading(false);
  }, []);

  const filtered = companies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
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
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Nome</th>
              <th className="text-left px-5 py-3 font-semibold">Email</th>
              <th className="text-left px-5 py-3 font-semibold">Dipendenti</th>
              <th className="text-right px-5 py-3 font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((company) => (
              <tr key={company.id} className="border-b hover:bg-slate-50">
                <td className="px-5 py-3">{company.name}</td>
                <td className="px-5 py-3">{company.email}</td>
                <td className="px-5 py-3">{company.employee_count || 0}</td>
                <td className="px-5 py-3 text-right flex gap-2 justify-end">
                  <button className="p-1.5 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-amber-50 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
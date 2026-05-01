/**
 * pages/company/EmployeeListNew.jsx
 * CRUD Dipendenti: lista con filtri, ricerca, ordinamento
 * TODO MIGRATION: Query params per filtri nella URL futura
 */

import { useState, useEffect } from 'react';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/hooks/useAuth';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import LazyImage from '@/components/LazyImage';
import { Users, Plus, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 20;

export default function EmployeeListNew() {
  const { user, isLoadingAuth } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    department: 'all',
    sort: 'name-asc',
  });

  useEffect(() => {
    if (!user?.company_id) {
      window.location.href = '/';
      return;
    }

    const loadData = async () => {
      try {
        const emps = await employeeService.listEmployees(user.company_id, {
          status: 'active',
          limit: ITEMS_PER_PAGE,
          skip: page * ITEMS_PER_PAGE,
        });
        setEmployees(emps || []);
      } catch (err) {
        console.error('Error loading employees:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoadingAuth) {
      loadData();
    }
  }, [user?.company_id, isLoadingAuth, page]);

  if (loading || isLoadingAuth) return <PageLoader color="blue" />;
  if (!user) return null;

  // Simple client-side filter (can be moved to backend for large datasets)
  const filtered = employees.filter(emp => {
    if (filters.search && !emp.full_name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status !== 'all' && emp.status !== filters.status) return false;
    return true;
  });

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dipendenti</h1>
            <p className="text-slate-600 mt-1">{filtered.length} risultati</p>
          </div>
          <Link to="/dashboard/company/employees/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Aggiungi dipendente
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca per nome, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>



            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="inactive">Inattivi</option>
              <option value="onboarding">Onboarding</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name-asc">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
              <option value="hire-date-desc">Più recenti</option>
              <option value="hire-date-asc">Più anziani</option>
            </select>
          </div>
        </div>

        {/* List */}
         {filtered.length === 0 ? (
           <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
             <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-medium">Nessun dipendente trovato</p>
             <p className="text-sm text-slate-400 mt-1">Aggiungi il primo dipendente per iniziare</p>
           </div>
         ) : (
           <>
             <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
               <div className="divide-y divide-slate-200">
                 {filtered.map((emp) => (
                   <Link
                     key={emp.id}
                     to={`/dashboard/company/employees/${emp.id}`}
                     className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                   >
                     <div className="flex-1">
                       <p className="font-medium text-slate-900">{emp.first_name} {emp.last_name}</p>
                       <p className="text-sm text-slate-500">{emp.job_title}</p>
                     </div>
                     <div className="text-right mr-4">
                       <p className="text-sm text-slate-600">{emp.email}</p>
                       <p className="text-xs text-slate-400">Assunto: {new Date(emp.hire_date).toLocaleDateString('it-IT')}</p>
                     </div>
                     <ChevronRight className="w-5 h-5 text-slate-400" />
                   </Link>
                 ))}
               </div>
             </div>
             {/* Pagination */}
             <div className="flex items-center justify-center gap-2 mt-6">
               <button
                 onClick={() => setPage(Math.max(0, page - 1))}
                 disabled={page === 0}
                 className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
               >
                 ← Prev
               </button>
               <span className="text-sm text-slate-600">Pagina {page + 1}</span>
               <button
                 onClick={() => setPage(page + 1)}
                 disabled={filtered.length < ITEMS_PER_PAGE}
                 className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
               >
                 Next →
               </button>
             </div>
           </>
         )}
      </div>
    </AppShell>
  );
}
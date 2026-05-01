import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import ShiftAssignmentForm from '@/components/shifts/ShiftAssignmentForm';
import ShiftCoverageAlertPanel from '@/components/shifts/ShiftCoverageAlertPanel';
import { Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ShiftManagementEnhanced() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }

      const [companies, emps, locs, shfts] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id }),
        base44.entities.CompanyLocation.filter({ company_id: me.company_id }),
        base44.entities.ShiftAssignment.filter({ company_id: me.company_id })
      ]);

      setCompany(companies[0]);
      setEmployees(emps);
      setLocations(locs);
      setShifts(shfts);
    }).finally(() => setLoading(false));
  }, []);

  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Eliminare questo turno?')) return;
    
    try {
      await base44.entities.ShiftAssignment.update(shiftId, { status: 'cancelled' });
      setShifts(shifts.filter(s => s.id !== shiftId));
      toast.success('Turno eliminato');
    } catch (err) {
      toast.error('Errore: ' + err.message);
    }
  };

  const handleShiftAssigned = async () => {
    const data = await base44.entities.ShiftAssignment.filter({
      company_id: company.id
    });
    setShifts(data);
    setShowForm(false);
  };

  if (loading) return <PageLoader color="blue" />;

  const upcomingShifts = shifts
    .filter(s => s.shift_date >= filterDate && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.shift_date) - new Date(b.shift_date));

  const todayShifts = shifts.filter(s => s.shift_date === filterDate && s.status !== 'cancelled');

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Gestione Turni
            </h1>
            <p className="text-sm text-slate-500">Assegna e monitora i turni dei dipendenti</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuovo Turno
          </button>
        </div>

        {/* Form Assegnazione */}
        {showForm && (
          <ShiftAssignmentForm
            companyId={company.id}
            employees={employees}
            locations={locations}
            onSubmit={handleShiftAssigned}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* Alert Panel */}
        <ShiftCoverageAlertPanel
          companyId={company.id}
          onAlertResolved={handleShiftAssigned}
        />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {[
            { id: 'upcoming', label: 'Turni Prossimi' },
            { id: 'today', label: `Oggi (${todayShifts.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenuto Tab */}
        {activeTab === 'upcoming' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">{upcomingShifts.length} turni</span>
            </div>

            {upcomingShifts.length === 0 ? (
              <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
                Nessun turno assegnato
              </div>
            ) : (
              upcomingShifts.map(shift => (
                <div key={shift.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">{shift.employee_name}</h3>
                    <div className="text-sm text-slate-600 space-y-0.5">
                      <div>📅 {format(new Date(shift.shift_date), 'dd MMM yyyy', { locale: it })}</div>
                      <div>⏰ {shift.start_time} - {shift.end_time} ({shift.shift_type})</div>
                      <div>📍 {shift.location_name}</div>
                      {shift.notes && <div className="text-xs text-slate-500 italic">📌 {shift.notes}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Elimina turno"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'today' && (
          <div className="space-y-3">
            {todayShifts.length === 0 ? (
              <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
                Nessun turno oggi
              </div>
            ) : (
              todayShifts.map(shift => (
                <div key={shift.id} className="bg-emerald-50 rounded-lg border border-emerald-200 p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-emerald-900">{shift.employee_name}</h3>
                    <div className="text-sm text-emerald-800 space-y-0.5">
                      <div>⏰ {shift.start_time} - {shift.end_time}</div>
                      <div>📍 {shift.location_name}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    shift.status === 'confirmed'
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {shift.status === 'confirmed' ? '✓ Confermato' : 'In attesa'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
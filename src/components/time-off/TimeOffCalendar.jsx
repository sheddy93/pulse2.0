/**
 * Time-Off Calendar Component
 * Calendario visuale delle ferie per manager e admin
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

export default function TimeOffCalendar({ companyId, departmentFilter = null }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [companyId, currentMonth, departmentFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carica ferie approvate per il mese
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

      const leaves = await base44.entities.LeaveRequest.filter({
        company_id: companyId,
        status: 'approved',
        start_date: { $gte: startDate },
        end_date: { $lte: endDate }
      });

      // Carica dipendenti
      const emps = await base44.entities.EmployeeProfile.filter({
        company_id: companyId,
        status: 'active'
      });

      setLeaveRequests(leaves);
      setEmployees(departmentFilter 
        ? emps.filter(e => e.department === departmentFilter) 
        : emps
      );
    } catch (error) {
      console.error('Failed to load time-off data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crea griglia calendario
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isEmployeeOnLeave = (employeeId, day) => {
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split('T')[0];

    return leaveRequests.some(leave => {
      if (leave.employee_id !== employeeId) return false;
      return dateToCheck >= leave.start_date && dateToCheck <= leave.end_date;
    });
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: getFirstDayOfMonth(currentMonth) });
  const monthName = currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  if (loading) {
    return <div className="p-6 text-center">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controlli mese */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold capitalize">{monthName}</h2>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Legenda */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded" />
          <span>In ferie</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white rounded border-2 border-slate-300" />
          <span>Lavorando</span>
        </div>
      </div>

      {/* Tabella Dipendenti x Giorni */}
      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2 text-left font-semibold w-40">Dipendente</th>
              {days.map(day => (
                <th key={day} className="px-2 py-2 text-center font-medium text-slate-600">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white z-10">
                  {emp.first_name} {emp.last_name}
                </td>
                {days.map(day => (
                  <td key={day} className="px-2 py-3 text-center">
                    {isEmployeeOnLeave(emp.id, day) ? (
                      <div className="w-6 h-6 bg-blue-200 rounded mx-auto" title="In ferie" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-slate-300 rounded mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistiche */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-slate-600">Dipendenti in ferie oggi</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {leaveRequests.filter(l => {
              const today = new Date().toISOString().split('T')[0];
              return today >= l.start_date && today <= l.end_date;
            }).length}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm text-slate-600">Ferie programmate questo mese</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{leaveRequests.length}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm text-slate-600">Dipendenti in team</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{employees.length}</p>
        </div>
      </div>
    </div>
  );
}
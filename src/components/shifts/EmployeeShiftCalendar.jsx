import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

export default function EmployeeShiftCalendar({ employeeId, companyId }) {
  const [shifts, setShifts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadShifts();
  }, [employeeId, currentMonth]);

  const loadShifts = async () => {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const data = await base44.entities.ShiftAssignment.filter({
      employee_id: employeeId,
      company_id: companyId,
      status: { $ne: 'cancelled' }
    });

    // Filtra per mese
    const filtered = data.filter(s => s.shift_date >= monthStart && s.shift_date <= monthEnd);
    setShifts(filtered);
    setLoading(false);
  };

  const getDaysArray = () => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  };

  const getShiftForDay = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return shifts.find(s => s.shift_date === dateStr);
  };

  const getWeekStartDay = (day) => {
    const d = new Date(day);
    return d.getDay();
  };

  if (loading) {
    return <div className="p-4 text-slate-400 text-center">Caricamento...</div>;
  }

  const days = getDaysArray();
  const firstDayOfWeek = getWeekStartDay(days[0]);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const emptyDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Calendario Turni
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            ←
          </button>
          <span className="px-4 py-1 text-sm font-semibold text-slate-700">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Griglia Calendario */}
      <div className="grid grid-cols-7 gap-2">
        {/* Intestazioni giorni */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-600 py-2">
            {day}
          </div>
        ))}

        {/* Giorni vuoti inizio mese */}
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Giorni del mese */}
        {days.map(day => {
          const shift = getShiftForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => shift && setSelectedDay(shift)}
              className={`aspect-square p-2 rounded-lg border text-sm font-semibold transition-colors ${
                !isCurrentMonth ? 'bg-slate-50 text-slate-300 cursor-default' :
                isToday ? 'border-blue-400 bg-blue-50' :
                shift ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer' :
                'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs">{format(day, 'd')}</div>
              {shift && (
                <div className="text-xs mt-1 truncate">
                  {shift.start_time}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dettagli Turno Selezionato */}
      {selectedDay && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-emerald-900">Dettagli Turno</h4>
            <button onClick={() => setSelectedDay(null)} className="text-emerald-600 hover:text-emerald-800">
              ✕
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{format(new Date(selectedDay.shift_date), 'dd MMMM yyyy', { locale: it })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{selectedDay.start_time} - {selectedDay.end_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{selectedDay.location_name}</span>
            </div>
            {selectedDay.notes && (
              <div className="text-emerald-700 mt-2 p-2 bg-white rounded border border-emerald-200 text-xs">
                📌 {selectedDay.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Riepilogo */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-700">Turni questo mese:</span>
          <strong className="text-slate-900">{shifts.length}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-700">Prossimo turno:</span>
          <strong className="text-slate-900">
            {shifts.length > 0
              ? format(new Date(shifts[0].shift_date), 'dd MMM', { locale: it })
              : 'Nessuno'}
          </strong>
        </div>
      </div>
    </div>
  );
}
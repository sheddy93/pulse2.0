import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AttendanceSummaryCard({ attendanceData }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;

  const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
  const absenceDays = attendanceData?.filter(a => a.status === 'absent').length || 0;
  const hoursWorked = attendanceData?.reduce((acc, a) => acc + (a.hours_worked || 0), 0) || 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Presenze {format(now, 'MMMM yyyy', { locale: it })}</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-emerald-50 rounded-lg">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{presentDays}</p>
          <p className="text-xs text-emerald-600">Giorni presenti</p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="flex justify-center mb-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-700">{absenceDays}</p>
          <p className="text-xs text-orange-600">Assenze</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-center mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">{hoursWorked}</p>
          <p className="text-xs text-blue-600">Ore lavorate</p>
        </div>
      </div>

      {/* Mini calendar */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">Calendario mese</p>
        <div className="grid grid-cols-7 gap-1">
          {['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">
              {d}
            </div>
          ))}
          {eachDayOfInterval({ start: monthStart, end: monthEnd }).map(day => {
            const dayAttendance = attendanceData?.find(a => 
              format(new Date(a.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            );
            const isPast = day < now && !isToday(day);
            
            return (
              <div
                key={day.toString()}
                className={`text-center text-xs py-2 rounded-lg font-medium ${
                  isToday(day) ? 'bg-blue-600 text-white' :
                  dayAttendance?.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                  dayAttendance?.status === 'absent' ? 'bg-red-100 text-red-700' :
                  isPast ? 'bg-slate-100 text-slate-400' :
                  'bg-slate-50 text-slate-400'
                }`}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
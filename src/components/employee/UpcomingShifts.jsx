import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Calendar } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { it } from "date-fns/locale";

const SHIFT_PRESETS = {
  mattina: { label: "Mattina", color: "bg-amber-50 border-amber-200 text-amber-700" },
  pomeriggio: { label: "Pomeriggio", color: "bg-blue-50 border-blue-200 text-blue-700" },
  notte: { label: "Notte", color: "bg-slate-50 border-slate-200 text-slate-700" },
  full_day: { label: "Giornata intera", color: "bg-green-50 border-green-200 text-green-700" }
};

export default function UpcomingShifts({ employeeId, companyId }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShifts = async () => {
      const s = await base44.entities.Shift.filter({
        employee_id: employeeId,
        company_id: companyId
      }, '-date', 7);
      setShifts(s);
      setLoading(false);
    };

    loadShifts();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Shift.subscribe((event) => {
      if (event.data?.employee_id === employeeId && event.data?.company_id === companyId) {
        loadShifts();
      }
    });

    return unsubscribe;
  }, [employeeId, companyId]);

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Oggi";
    if (isTomorrow(date)) return "Domani";
    return format(date, "EEEE d MMM", { locale: it });
  };

  if (loading) return <div className="text-sm text-slate-500">Caricamento turni...</div>;

  return (
    <div className="space-y-2">
      {shifts.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">Nessun turno assegnato</p>
      ) : (
        shifts.map(shift => {
          const preset = SHIFT_PRESETS[shift.shift_type];
          return (
            <div key={shift.id} className={`p-4 rounded-lg border ${preset.color} space-y-2`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{getDateLabel(shift.date)}</p>
                  <p className="text-xs opacity-75">{format(new Date(shift.date), "d MMM yyyy")}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-white/50 rounded">{preset.label}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                {shift.start_time?.substring(0, 5)} - {shift.end_time?.substring(0, 5)}
              </div>
              {shift.notes && <p className="text-xs">{shift.notes}</p>}
            </div>
          );
        })
      )}
    </div>
  );
}
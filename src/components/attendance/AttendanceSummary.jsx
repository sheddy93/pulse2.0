import { Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function AttendanceSummary({ entries = [], date = new Date() }) {
  const today = format(date, "yyyy-MM-dd");
  const todayEntries = entries
    .filter(e => e.timestamp?.startsWith(today))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Calcola ore lavorate
  const checkIn = todayEntries.find(e => e.type === "check_in");
  const checkOut = todayEntries.find(e => e.type === "check_out");
  
  let hoursWorked = 0;
  let minutesWorked = 0;
  
  if (checkIn && checkOut) {
    const start = new Date(checkIn.timestamp);
    const end = new Date(checkOut.timestamp);
    const diffMs = end - start;
    
    // Sottrai le pause
    const breakStarts = todayEntries.filter(e => e.type === "break_start");
    const breakEnds = todayEntries.filter(e => e.type === "break_end");
    
    let breakTime = 0;
    for (let i = 0; i < breakStarts.length; i++) {
      if (breakEnds[i]) {
        breakTime += new Date(breakEnds[i].timestamp) - new Date(breakStarts[i].timestamp);
      }
    }
    
    const workingMs = diffMs - breakTime;
    hoursWorked = Math.floor(workingMs / (1000 * 60 * 60));
    minutesWorked = Math.floor((workingMs % (1000 * 60 * 60)) / (1000 * 60));
  }

  const getTypeLabel = (type) => {
    const labels = {
      check_in: "Entrata",
      check_out: "Uscita",
      break_start: "Inizio pausa",
      break_end: "Fine pausa",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      check_in: "text-emerald-600 bg-emerald-50",
      check_out: "text-slate-600 bg-slate-100",
      break_start: "text-orange-500 bg-orange-50",
      break_end: "text-blue-500 bg-blue-50",
    };
    return colors[type] || "text-slate-500 bg-slate-100";
  };

  const isClockedIn = todayEntries.length > 0 && (
    todayEntries[todayEntries.length - 1].type === "check_in" ||
    todayEntries[todayEntries.length - 1].type === "break_end"
  );

  return (
    <div className="space-y-4">
      {/* Ore Lavorate */}
      {(checkIn || todayEntries.length > 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold">Ore Lavorate Oggi</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {hoursWorked}h {minutesWorked}m
              </p>
            </div>
            {isClockedIn && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">In servizio</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista Timbrature */}
      {todayEntries.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">
              Timbrature di oggi ({todayEntries.length})
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {todayEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(entry.type)}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{getTypeLabel(entry.type)}</p>
                  {entry.latitude && entry.longitude && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {entry.location || `${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}`}
                    </p>
                  )}
                </div>
                <p className="text-sm font-mono text-slate-600">
                  {format(new Date(entry.timestamp), "HH:mm")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Nessuna timbratura oggi</p>
        </div>
      )}
    </div>
  );
}
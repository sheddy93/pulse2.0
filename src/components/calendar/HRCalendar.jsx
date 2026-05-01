import { useState, useEffect } from "react";
// TODO: Service integration (replace with apiClient when REST API ready)
import { ChevronLeft, ChevronRight, Plus, X, Bell, FileText, Calendar, Loader2, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO, isPast, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";

const COLOR_MAP = {
  blue:   { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500",   border: "border-blue-300" },
  green:  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-300" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-300" },
  red:    { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",    border: "border-red-300" },
  violet: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", border: "border-violet-300" },
};

const EVENT_COLORS = {
  document_expiry: "red",
  contract_expiry: "orange",
  certification:   "violet",
  leave:           "green",
  note:            "blue",
};

export default function HRCalendar({ companyId, userRole, userEmail }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", content: "", color: "blue", visibility: "both", reminder_date: "" });
  const [saving, setSaving] = useState(false);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  useEffect(() => {
    loadAll();
  }, [companyId, currentMonth]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // TODO: Replace with service calls for REST API
      const [docs, contracts, certifications, leaves, calNotes] = [[], [], [], [], []];

      const allEvents = [];

      // Document expiries
      docs.filter(d => d.expiry_date).forEach(d => {
        allEvents.push({
          id: `doc-${d.id}`,
          date: d.expiry_date,
          title: `Scadenza: ${d.title}`,
          type: "document_expiry",
          color: "red",
          meta: `Doc tipo: ${d.doc_type}`,
        });
      });

      // Contract expiries
      contracts.filter(c => c.end_date && c.status === "active").forEach(c => {
        allEvents.push({
          id: `contract-${c.id}`,
          date: c.end_date,
          title: `Contratto in scadenza`,
          type: "contract_expiry",
          color: "orange",
          meta: `${c.contract_type}`,
        });
      });

      // Certification expiries
      certifications.filter(s => s.expiry_date).forEach(s => {
        allEvents.push({
          id: `cert-${s.id}`,
          date: s.expiry_date,
          title: `Certificazione: ${s.skill_name}`,
          type: "certification",
          color: "violet",
          meta: s.employee_name || "",
        });
      });

      // Approved leaves
      leaves.forEach(l => {
        allEvents.push({
          id: `leave-${l.id}`,
          date: l.start_date,
          title: `Ferie: ${l.employee_name || l.employee_email}`,
          type: "leave",
          color: "green",
          meta: `${l.days_count || 0} giorni`,
        });
      });

      setEvents(allEvents);
      setNotes(calNotes);

      // Upcoming deadlines (next 30 days)
      const today = new Date();
      const upcoming = allEvents
        .filter(e => {
          const d = differenceInDays(parseISO(e.date), today);
          return d >= 0 && d <= 30;
        })
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8);
      setUpcomingDeadlines(upcoming);

    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(startOfMonth(currentMonth)); // 0=Sun

  const getEventsForDay = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayEvents = events.filter(e => e.date === dateStr);
    const dayNotes = notes.filter(n => n.date === dateStr);
    return [
      ...dayEvents,
      ...dayNotes.map(n => ({ id: `note-${n.id}`, date: n.date, title: n.title, type: "note", color: n.color || "blue", meta: n.content, noteId: n.id }))
    ];
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const handleSaveNote = async () => {
    if (!noteForm.title.trim() || !selectedDay) return;
    setSaving(true);
    // TODO: Replace with service.CalendarNote.create()
    setNoteForm({ title: "", content: "", color: "blue", visibility: "both", reminder_date: "" });
    setShowNoteForm(false);
    setSaving(false);
    await loadAll();
  };

  const handleDeleteNote = async (noteId) => {
    // TODO: Replace with service.CalendarNote.delete()
    await loadAll();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Calendar */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: it })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Oggi
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding */}
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {daysInMonth.map(day => {
                const dayEvts = getEventsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const today = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setSelectedDay(day); setShowNoteForm(false); }}
                    className={`relative min-h-[72px] p-1.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? "border-blue-400 bg-blue-50"
                        : today
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`text-xs font-semibold block mb-1 ${
                      today ? "text-blue-600" : isSameMonth(day, currentMonth) ? "text-slate-700" : "text-slate-300"
                    }`}>
                      {format(day, "d")}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvts.slice(0, 3).map(ev => {
                        const c = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                        return (
                          <div key={ev.id} className={`text-[10px] font-medium px-1 py-0.5 rounded truncate ${c.bg} ${c.text}`}>
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvts.length > 3 && (
                        <div className="text-[10px] text-slate-400 pl-1">+{dayEvts.length - 3} altri</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Selected day panel */}
        {selectedDay ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-slate-800">{format(selectedDay, "d MMMM", { locale: it })}</p>
                <p className="text-xs text-slate-400 capitalize">{format(selectedDay, "EEEE", { locale: it })}</p>
              </div>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Nota
              </button>
            </div>

            {/* Note form */}
            {showNoteForm && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <input
                  placeholder="Titolo nota *"
                  value={noteForm.title}
                  onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Contenuto (opzionale)"
                  value={noteForm.content}
                  onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={2}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <select
                    value={noteForm.color}
                    onChange={e => setNoteForm({ ...noteForm, color: e.target.value })}
                    className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="blue">🔵 Blu</option>
                    <option value="green">🟢 Verde</option>
                    <option value="orange">🟠 Arancio</option>
                    <option value="red">🔴 Rosso</option>
                    <option value="violet">🟣 Viola</option>
                  </select>
                  <select
                    value={noteForm.visibility}
                    onChange={e => setNoteForm({ ...noteForm, visibility: e.target.value })}
                    className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="both">Tutti</option>
                    <option value="company">Solo azienda</option>
                    <option value="consultant">Solo consulente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Promemoria (opzionale)</label>
                  <input
                    type="date"
                    value={noteForm.reminder_date}
                    onChange={e => setNoteForm({ ...noteForm, reminder_date: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveNote} disabled={saving || !noteForm.title}
                    className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Salvo..." : "Salva"}
                  </button>
                  <button onClick={() => setShowNoteForm(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
                    Annulla
                  </button>
                </div>
              </div>
            )}

            {/* Events for day */}
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nessun evento</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map(ev => {
                  const c = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                  return (
                    <div key={ev.id} className={`p-2.5 rounded-lg border ${c.bg} ${c.border} flex items-start justify-between gap-2`}>
                      <div>
                        <p className={`text-xs font-semibold ${c.text}`}>{ev.title}</p>
                        {ev.meta && <p className="text-xs text-slate-500 mt-0.5">{ev.meta}</p>}
                      </div>
                      {ev.noteId && (
                        <button onClick={() => handleDeleteNote(ev.noteId)}
                          className="p-1 hover:bg-red-100 rounded text-red-400 flex-shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Clicca un giorno per vedere eventi e aggiungere note</p>
          </div>
        )}

        {/* Upcoming deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            Scadenze prossime (30gg)
          </h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-slate-400">Nessuna scadenza imminente</p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map(ev => {
                const daysLeft = differenceInDays(parseISO(ev.date), new Date());
                const c = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                return (
                  <div key={ev.id} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-400">{format(parseISO(ev.date), "d MMM", { locale: it })}
                        {" "}•{" "}
                        <span className={daysLeft <= 7 ? "text-red-500 font-semibold" : "text-slate-400"}>
                          {daysLeft === 0 ? "oggi" : `${daysLeft}gg`}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Legenda</h3>
          <div className="space-y-1.5">
            {[
              { color: "red",    label: "Scadenza documento" },
              { color: "orange", label: "Scadenza contratto" },
              { color: "violet", label: "Certificazione" },
              { color: "green",  label: "Ferie approvate" },
              { color: "blue",   label: "Note" },
            ].map(({ color, label }) => {
              const c = COLOR_MAP[color];
              return (
                <div key={color} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  <span className="text-xs text-slate-600">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
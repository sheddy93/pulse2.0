import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, MapPin, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const SHIFT_TYPES = {
  morning: { label: 'Mattina', startTime: '08:00', endTime: '14:00' },
  afternoon: { label: 'Pomeriggio', startTime: '14:00', endTime: '20:00' },
  night: { label: 'Notte', startTime: '20:00', endTime: '08:00' },
  full_day: { label: 'Giornata intera', startTime: '08:00', endTime: '17:00' },
  custom: { label: 'Personalizzato', startTime: '', endTime: '' }
};

export default function ShiftAssignmentForm({ companyId, employees, locations, onSubmit, onClose }) {
  const [form, setForm] = useState({
    employee_id: '',
    shift_date: '',
    shift_type: 'morning',
    start_time: '08:00',
    end_time: '14:00',
    location_id: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleShiftTypeChange = (type) => {
    const shiftType = SHIFT_TYPES[type];
    setForm({
      ...form,
      shift_type: type,
      start_time: shiftType.startTime,
      end_time: shiftType.endTime
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.employee_id || !form.shift_date || !form.location_id) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    setSaving(true);
    try {
      const emp = employees.find(e => e.id === form.employee_id);
      const loc = locations.find(l => l.id === form.location_id);
      const user = await base44.auth.me();

      const assignment = await base44.entities.ShiftAssignment.create({
        company_id: companyId,
        employee_id: form.employee_id,
        employee_email: emp.email,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        shift_date: form.shift_date,
        start_time: form.start_time,
        end_time: form.end_time,
        shift_type: form.shift_type,
        location_id: form.location_id,
        location_name: loc.name,
        assigned_by: user.email,
        assigned_at: new Date().toISOString(),
        notes: form.notes
      });

      // Trigger detection degli alert
      await base44.functions.invoke('detectShiftAlerts', {
        shift_assignment_id: assignment.id,
        company_id: companyId
      });

      toast.success('Turno assegnato');
      onSubmit();
      setForm({
        employee_id: '',
        shift_date: '',
        shift_type: 'morning',
        start_time: '08:00',
        end_time: '14:00',
        location_id: '',
        notes: ''
      });
    } catch (err) {
      toast.error('Errore: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Assegna Nuovo Turno</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Dipendente */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Dipendente *</label>
          <select
            value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleziona dipendente...</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Data Turno *</label>
          <input
            type="date"
            value={form.shift_date}
            onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tipo Turno */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo Turno</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(SHIFT_TYPES).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleShiftTypeChange(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                form.shift_type === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orari */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Inizio
          </label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Fine
          </label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sede */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Sede di Lavoro *
        </label>
        <select
          value={form.location_id}
          onChange={(e) => setForm({ ...form, location_id: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleziona sede...</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Note</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Note aggiuntive sul turno..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="2"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Salvataggio...' : 'Assegna Turno'}
      </button>
    </form>
  );
}
import { useState } from "react";
import { User, Mail, Phone, MapPin, Briefcase } from "lucide-react";

export default function StepProfile({ employee, onComplete }) {
  const [form, setForm] = useState({
    phone: employee?.phone || "",
    location: employee?.location || "",
    about: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      step_1_profile_completed: true
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 1: Il tuo Profilo</h2>
        <p className="text-slate-600">Completa le informazioni di base del tuo profilo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome (read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Nome Completo</label>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <User className="w-5 h-5 text-slate-400" />
            <span className="text-slate-700 font-medium">{employee?.first_name} {employee?.last_name}</span>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Email</label>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <Mail className="w-5 h-5 text-slate-400" />
            <span className="text-slate-700 font-medium">{employee?.email}</span>
          </div>
        </div>

        {/* Telefono */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Telefono (opzionale)</label>
          <div className="flex items-center gap-3 px-4 py-2 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            <Phone className="w-5 h-5 text-slate-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+39 123 456 7890"
              className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Città/Sede (opzionale)</label>
          <div className="flex items-center gap-3 px-4 py-2 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            <MapPin className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Es. Milano, Ufficio principale"
              className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* About */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Presentazione (opzionale)</label>
          <textarea
            value={form.about}
            onChange={e => setForm({ ...form, about: e.target.value })}
            placeholder="Parla di te, le tue competenze, i tuoi interessi..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continua al Prossimo Step →
        </button>
      </form>
    </div>
  );
}
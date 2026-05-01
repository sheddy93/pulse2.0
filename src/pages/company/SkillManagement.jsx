import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Search, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, X } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";

const SKILL_TYPES = { technical: "Tecnica", certification: "Certificazione", course: "Corso" };
const PROFICIENCY = { beginner: "Base", intermediate: "Intermedio", advanced: "Avanzato", expert: "Esperto" };
const SKILL_COLORS = {
  technical: "bg-blue-100 text-blue-700",
  certification: "bg-purple-100 text-purple-700",
  course: "bg-orange-100 text-orange-700"
};

function SkillStatus({ expiryDate }) {
  if (!expiryDate) return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Permanente</span>;
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Scaduto</span>;
  if (days <= 30) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Scade in {days}gg</span>;
  if (days <= 90) return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Scade in {days}gg</span>;
  return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Valido</span>;
}

export default function SkillManagement() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    skill_name: "",
    skill_type: "technical",
    skill_category: "",
    proficiency_level: "intermediate",
    acquired_date: "",
    expiry_date: "",
    issuer: "",
    certification_number: "",
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, emps, skillsData] = await Promise.all([
        // TODO: Replace with service.Company.filter({ id: me.company_id }),
        // TODO: Replace with service.EmployeeProfile.filter({ company_id: me.company_id }),
        // TODO: Replace with service.EmployeeSkill.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setEmployees(emps);
      setSkills(skillsData);
      if (emps.length > 0) setSelectedEmployee(emps[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !company) return;

    const emp = employees.find(e => e.id === selectedEmployee);
    // TODO: Replace with service.EmployeeSkill.create({
      company_id: company.id,
      employee_id: selectedEmployee,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      skill_name: form.skill_name,
      skill_type: form.skill_type,
      skill_category: form.skill_category,
      proficiency_level: form.proficiency_level,
      acquired_date: form.acquired_date,
      expiry_date: form.expiry_date || undefined,
      issuer: form.issuer || undefined,
      certification_number: form.certification_number || undefined,
      notes: form.notes || undefined,
      status: form.expiry_date && new Date(form.expiry_date) < new Date() ? "expired" : "active"
    });

    setForm({
      skill_name: "",
      skill_type: "technical",
      skill_category: "",
      proficiency_level: "intermediate",
      acquired_date: "",
      expiry_date: "",
      issuer: "",
      certification_number: "",
      notes: ""
    });
    setShowForm(false);

    const updatedSkills = // TODO: Replace with service.EmployeeSkill.filter({ company_id: company.id });
    setSkills(updatedSkills);
  };

  const handleDeleteSkill = async (skillId) => {
    if (!confirm("Eliminare questa competenza?")) return;
    // TODO: Replace with service.EmployeeSkill.delete(skillId);
    const updatedSkills = // TODO: Replace with service.EmployeeSkill.filter({ company_id: company.id });
    setSkills(updatedSkills);
  };

  const employeeSkills = selectedEmployee ? skills.filter(s => s.employee_id === selectedEmployee) : [];
  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  const expiringSoon = skills.filter(s => s.expiry_date && differenceInDays(new Date(s.expiry_date), new Date()) <= 30 && differenceInDays(new Date(s.expiry_date), new Date()) >= 0);
  const expired = skills.filter(s => s.expiry_date && differenceInDays(new Date(s.expiry_date), new Date()) < 0);

  const filteredEmployees = employees.filter(e => {
    const q = search.toLowerCase();
    return !q || `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(q);
  });

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gestione competenze</h1>
          <p className="text-sm text-slate-500">Traccia skill, certificazioni e scadenze corsi per ogni dipendente</p>
        </div>

        {/* Alert */}
        {(expiringSoon.length > 0 || expired.length > 0) && (
          <div className="space-y-2">
            {expired.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-800"><strong>{expired.length} certificazioni scadute</strong></span>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-amber-800"><strong>{expiringSoon.length} certificazioni in scadenza</strong> entro 30 giorni</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Dipendenti */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Dipendenti</h2>
              <div className="relative mt-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    selectedEmployee === emp.id
                      ? "bg-blue-50 border-l-2 border-blue-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-slate-800">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-slate-500">{emp.job_title || "—"}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="lg:col-span-3 space-y-4">
            {selectedEmp && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <h2 className="font-semibold text-slate-800">{selectedEmp.first_name} {selectedEmp.last_name}</h2>
                <p className="text-sm text-slate-600">{selectedEmp.job_title || "Nessuna mansione"}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedEmp.email}</p>
              </div>
            )}

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full px-4 py-2.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Aggiungi competenza
              </button>
            )}

            {showForm && (
              <form onSubmit={handleAddSkill} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">Nuova competenza</h3>
                  <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome competenza *</label>
                    <input
                      required
                      value={form.skill_name}
                      onChange={e => setForm(f => ({ ...f, skill_name: e.target.value }))}
                      placeholder="Es. React.js"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                    <select
                      value={form.skill_type}
                      onChange={e => setForm(f => ({ ...f, skill_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(SKILL_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Livello</label>
                    <select
                      value={form.proficiency_level}
                      onChange={e => setForm(f => ({ ...f, proficiency_level: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(PROFICIENCY).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
                    <input
                      value={form.skill_category}
                      onChange={e => setForm(f => ({ ...f, skill_category: e.target.value }))}
                      placeholder="Es. Backend, Frontend"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Data acquisizione *</label>
                    <input
                      required
                      type="date"
                      value={form.acquired_date}
                      onChange={e => setForm(f => ({ ...f, acquired_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Scadenza</label>
                    <input
                      type="date"
                      value={form.expiry_date}
                      onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ente emittente</label>
                    <input
                      value={form.issuer}
                      onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))}
                      placeholder="Es. Google, Oracle"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">N. certificato</label>
                    <input
                      value={form.certification_number}
                      onChange={e => setForm(f => ({ ...f, certification_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50">
                    Annulla
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                    Aggiungi
                  </button>
                </div>
              </form>
            )}

            {employeeSkills.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">Nessuna competenza registrata</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {employeeSkills.map(skill => (
                  <div key={skill.id} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">{skill.skill_name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SKILL_COLORS[skill.skill_type]}`}>
                            {SKILL_TYPES[skill.skill_type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          {skill.skill_category && <span className="px-2 py-0.5 bg-slate-100 rounded">{skill.skill_category}</span>}
                          <span className="px-2 py-0.5 bg-slate-100 rounded">{PROFICIENCY[skill.proficiency_level]}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded">Acquisito {format(new Date(skill.acquired_date), 'd MMM yyyy', { locale: it })}</span>
                        </div>
                        {skill.issuer && <p className="text-xs text-slate-600 mt-2">Ente: <strong>{skill.issuer}</strong></p>}
                        {skill.certification_number && <p className="text-xs text-slate-600">Certificato: <strong>{skill.certification_number}</strong></p>}
                        {skill.notes && <p className="text-xs text-slate-600 mt-2 italic">"{skill.notes}"</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <SkillStatus expiryDate={skill.expiry_date} />
                        <button onClick={() => handleDeleteSkill(skill.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
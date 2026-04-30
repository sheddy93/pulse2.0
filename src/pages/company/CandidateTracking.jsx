import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { ChevronRight, UserPlus, FileText, Trash2 } from "lucide-react";

const STAGES = {
  application_received: { label: "Candidatura ricevuta", color: "bg-slate-50 border-slate-200" },
  screening: { label: "Screening", color: "bg-blue-50 border-blue-200" },
  interview_scheduled: { label: "Intervista programmata", color: "bg-amber-50 border-amber-200" },
  interview_completed: { label: "Intervista completata", color: "bg-purple-50 border-purple-200" },
  offer_extended: { label: "Offerta inviata", color: "bg-indigo-50 border-indigo-200" },
  offer_accepted: { label: "Offerta accettata", color: "bg-emerald-50 border-emerald-200" },
  onboarding: { label: "Onboarding", color: "bg-cyan-50 border-cyan-200" },
  hired: { label: "Assunto", color: "bg-green-50 border-green-200" },
  rejected: { label: "Rifiutato", color: "bg-red-50 border-red-200" },
  withdrawn: { label: "Ritirato", color: "bg-slate-50 border-slate-200" }
};

const nextStages = {
  application_received: ['screening', 'rejected'],
  screening: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['interview_completed', 'rejected'],
  interview_completed: ['offer_extended', 'rejected'],
  offer_extended: ['offer_accepted', 'rejected'],
  offer_accepted: ['onboarding', 'rejected'],
  onboarding: ['hired', 'rejected'],
  hired: [],
  rejected: [],
  withdrawn: []
};

export default function CandidateTracking() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ contractType: 'indeterminato', jobTitle: '', weeklyHours: 40 });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, apps] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.JobApplication.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setApplications(apps.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    }).finally(() => setLoading(false));
  }, []);

  const handleMoveStage = async (appId, newStage) => {
    await base44.entities.JobApplication.update(appId, { current_stage: newStage });
    await base44.entities.ApplicationStage.create({
      application_id: appId,
      company_id: company.id,
      stage: newStage,
      moved_by: user.email,
      moved_at: new Date().toISOString()
    });
    const updated = await base44.entities.JobApplication.filter({ company_id: company.id });
    setApplications(updated.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  const handleStartOnboarding = async (e) => {
    e.preventDefault();
    const response = await base44.functions.invoke('onboardingAutomation', {
      applicationId: selectedCandidate.id,
      contractType: onboardingForm.contractType,
      jobTitle: onboardingForm.jobTitle,
      weeklyHours: onboardingForm.weeklyHours
    });

    if (response.data.success) {
      alert(`✅ Onboarding avviato! Employee ID: ${response.data.employee.code}`);
      setShowOnboarding(false);
      await handleMoveStage(selectedCandidate.id, 'hired');
      setSelectedCandidate(null);
    } else {
      alert('❌ Errore durante l\'onboarding');
    }
  };

  const handleDelete = async (appId) => {
    if (confirm('Elimina questa candidatura?')) {
      await base44.entities.JobApplication.delete(appId);
      setApplications(applications.filter(a => a.id !== appId));
    }
  };

  if (loading) return <PageLoader />;

  const allStages = Object.keys(STAGES);

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tracking Candidati</h1>
          <p className="text-sm text-slate-500">{company?.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista Candidati */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Candidati ({applications.length})</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {applications.map(app => (
                <button
                  key={app.id}
                  onClick={() => setSelectedCandidate(app)}
                  className={`w-full text-left px-5 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    selectedCandidate?.id === app.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <p className="font-medium text-slate-800 text-sm">{app.candidate_first_name} {app.candidate_last_name}</p>
                  <p className="text-xs text-slate-500">{app.job_title}</p>
                  <p className={`text-xs mt-1 px-2 py-0.5 rounded w-fit ${STAGES[app.current_stage]?.color?.replace('border-', 'text-').replace('bg-', 'bg-') || 'bg-slate-100 text-slate-700'}`}>
                    {STAGES[app.current_stage]?.label || app.current_stage}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Dettagli Candidato */}
          <div className="lg:col-span-2">
            {selectedCandidate ? (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedCandidate.candidate_first_name} {selectedCandidate.candidate_last_name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedCandidate.candidate_email}</p>
                  {selectedCandidate.candidate_phone && <p className="text-sm text-slate-600">{selectedCandidate.candidate_phone}</p>}
                </div>

                {selectedCandidate.resume_url && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Scarica CV</a>
                  </div>
                )}

                {selectedCandidate.cover_letter && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Lettera di Presentazione</p>
                    <p className="text-sm text-slate-700">{selectedCandidate.cover_letter.substring(0, 150)}...</p>
                  </div>
                )}

                {/* Flusso Stage */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-3">Stato Candidatura</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {allStages.map((stage, idx) => (
                      <div key={stage} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          stage === selectedCandidate.current_stage ? 'bg-blue-600 text-white' :
                          allStages.indexOf(selectedCandidate.current_stage) > idx ? 'bg-emerald-600 text-white' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {idx + 1}
                        </div>
                        {idx < allStages.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prossimi Stage */}
                {nextStages[selectedCandidate.current_stage]?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Prossime azioni</p>
                    <div className="flex flex-wrap gap-2">
                      {nextStages[selectedCandidate.current_stage].map(stage => (
                        <button
                          key={stage}
                          onClick={() => handleMoveStage(selectedCandidate.id, stage)}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            stage === 'rejected' 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {STAGES[stage]?.label || stage}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Azione Onboarding */}
                {selectedCandidate.current_stage === 'offer_accepted' && (
                  <div className="border-t border-slate-100 pt-4">
                    {!showOnboarding ? (
                      <button
                        onClick={() => setShowOnboarding(true)}
                        className="flex items-center gap-2 w-full px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                      >
                        <UserPlus className="w-4 h-4" /> Avvia Onboarding
                      </button>
                    ) : (
                      <form onSubmit={handleStartOnboarding} className="space-y-3">
                        <h4 className="font-semibold text-slate-800">Configura Onboarding</h4>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Contratto</label>
                          <select value={onboardingForm.contractType} onChange={e => setOnboardingForm(f => ({ ...f, contractType: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                            <option value="indeterminato">Indeterminato</option>
                            <option value="determinato">Determinato</option>
                            <option value="apprendistato">Apprendistato</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Mansione</label>
                          <input type="text" required value={onboardingForm.jobTitle} onChange={e => setOnboardingForm(f => ({ ...f, jobTitle: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Es. Senior Developer" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Ore Settimanali</label>
                          <input type="number" value={onboardingForm.weeklyHours} onChange={e => setOnboardingForm(f => ({ ...f, weeklyHours: parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setShowOnboarding(false)} className="flex-1 px-3 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Annulla</button>
                          <button type="submit" className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">Conferma</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <button onClick={() => handleDelete(selectedCandidate.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> Elimina Candidatura
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-400">Seleziona un candidato per visualizzare i dettagli</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Check, Building2, Users, Briefcase, Clock, FileText, Settings, CreditCard, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 1, label: 'Azienda', icon: Building2, desc: 'Crea azienda' },
  { id: 2, label: 'Admin', icon: Users, desc: 'Invita admin' },
  { id: 3, label: 'Reparti', icon: Briefcase, desc: 'Crea reparti' },
  { id: 4, label: 'Dipendenti', icon: Users, desc: 'Importa dipendenti' },
  { id: 5, label: 'Presenze', icon: Clock, desc: 'Configura presenze' },
  { id: 6, label: 'Ferie', icon: Calendar, desc: 'Configura ferie' },
  { id: 7, label: 'Documenti', icon: FileText, desc: 'Carica documenti' },
  { id: 8, label: 'Piano', icon: CreditCard, desc: 'Scegli piano' },
];

export default function CompanyOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState([]);
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    admin_email: '',
    admin_name: '',
    departments: [],
    employees_file: null,
    geofence_enabled: false,
    geofence_address: '',
    leave_days: 20,
    leave_types: ['Ferie', 'Permessi', 'Malattia'],
    documents: [],
    selected_plan: 'starter',
  });

  const handleComplete = () => {
    setCompleted([...completed, currentStep]);
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const StepContent = {
    1: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Informazioni Azienda</h2>
        <p className="text-slate-600">Inseriamo i dati base della tua azienda</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Azienda</label>
            <input
              type="text"
              placeholder="Es. Acme S.p.A."
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Azienda</label>
            <input
              type="email"
              placeholder="info@company.it"
              value={formData.company_email}
              onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Ricorda: puoi cambiare questi dati nelle impostazioni in qualsiasi momento
          </div>
        </div>
      </div>
    ),
    2: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Invita Admin</h2>
        <p className="text-slate-600">Chi altro gestirà la piattaforma con te?</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Admin</label>
            <input
              type="email"
              placeholder="admin@company.it"
              value={formData.admin_email}
              onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Admin</label>
            <input
              type="text"
              placeholder="Mario Rossi"
              value={formData.admin_name}
              onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200">
            + Aggiungi altro admin
          </button>
        </div>
      </div>
    ),
    3: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Crea Reparti</h2>
        <p className="text-slate-600">Organizza i dipendenti per reparti</p>
        <div className="space-y-3">
          {['IT', 'HR', 'Sales', 'Operations'].map((dept) => (
            <label key={dept} className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="ml-3 font-medium text-slate-700">{dept}</span>
            </label>
          ))}
          <input
            type="text"
            placeholder="Aggiungi reparto personalizzato..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    ),
    4: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Importa Dipendenti</h2>
        <p className="text-slate-600">Carica un file CSV con i tuoi dipendenti</p>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            id="employees-file"
            onChange={(e) => setFormData({ ...formData, employees_file: e.target.files[0] })}
          />
          <label htmlFor="employees-file" className="cursor-pointer">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium text-slate-700">Seleziona file CSV o Excel</p>
            <p className="text-sm text-slate-500 mt-1">O trascina il file qui</p>
          </label>
          {formData.employees_file && (
            <p className="mt-3 text-sm text-green-600">✓ {formData.employees_file.name}</p>
          )}
        </div>
        <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-700">
          <p className="font-medium mb-2">Formato atteso:</p>
          <p>Nome | Email | Ruolo | Data Assunzione</p>
        </div>
      </div>
    ),
    5: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Configura Presenze</h2>
        <p className="text-slate-600">Come vuoi tracciare le presenze?</p>
        <div className="space-y-3">
          <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
            <input type="radio" name="attendance" defaultChecked />
            <span className="ml-3 font-medium text-slate-700">Manuale (check-in/out)</span>
          </label>
          <label className="flex items-center p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer">
            <input type="radio" name="attendance" />
            <span className="ml-3 font-medium text-slate-700">Con Geofence GPS</span>
          </label>
        </div>
        {true && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-slate-700">Indirizzo sede</label>
            <input
              type="text"
              placeholder="Via Roma 1, 00100 Roma"
              value={formData.geofence_address}
              onChange={(e) => setFormData({ ...formData, geofence_address: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-sm font-medium text-slate-700">Raggio (metri)</label>
            <input type="number" defaultValue={100} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
      </div>
    ),
    6: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Configura Ferie</h2>
        <p className="text-slate-600">Quanti giorni di ferie all'anno?</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giorni ferie annuali</label>
            <input
              type="number"
              value={formData.leave_days}
              onChange={(e) => setFormData({ ...formData, leave_days: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Tipi di assenza</p>
            {formData.leave_types.map((type) => (
              <label key={type} className="flex items-center p-2 mb-1">
                <input type="checkbox" defaultChecked />
                <span className="ml-2 text-slate-700">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    ),
    7: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Carica Documenti</h2>
        <p className="text-slate-600">Contratti, politiche, moduli...</p>
        <div className="space-y-3">
          {['Contratto Tipo', 'Politica Privacy', 'Handbook'].map((doc) => (
            <div key={doc} className="flex items-center p-3 border border-slate-200 rounded-lg">
              <span className="font-medium text-slate-700 flex-1">{doc}</span>
              <input type="file" className="hidden" id={`file-${doc}`} />
              <label htmlFor={`file-${doc}`} className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm cursor-pointer hover:bg-slate-200">
                Upload
              </label>
            </div>
          ))}
        </div>
      </div>
    ),
    8: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Scegli Piano</h2>
        <p className="text-slate-600">Quale piano fa al caso tuo?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'starter', name: 'Starter', price: '99', features: ['50 dipendenti', 'Presenze base', 'Ferie'] },
            { id: 'professional', name: 'Professional', price: '299', features: ['200 dipendenti', 'Presenze GPS', 'Ferie avanzate', 'Analytics'], highlighted: true },
            { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Illimitati', 'Tutte le features', 'SSO', 'Supporto prioritario'] },
          ].map((plan) => (
            <div
              key={plan.id}
              onClick={() => setFormData({ ...formData, selected_plan: plan.id })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.selected_plan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${plan.highlighted ? 'ring-2 ring-blue-200' : ''}`}
            >
              <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600 my-2">€{plan.price}</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = completed.includes(step.id);
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isDone ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-2 text-center">{step.label}</p>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 mt-3 ${isDone ? 'bg-green-500' : 'bg-slate-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          {StepContent[currentStep]}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Indietro
          </button>
          <div className="text-sm text-slate-600">
            Step {currentStep} di {STEPS.length}
          </div>
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            {currentStep === STEPS.length ? 'Completa Setup' : 'Avanti'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Completion */}
        {currentStep === STEPS.length && completed.length === STEPS.length && (
          <div className="mt-6 bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-green-800">Setup completato!</h3>
            <p className="text-green-700 mt-2">La tua azienda è pronta a partire. Vai al dashboard →</p>
          </div>
        )}
      </div>
    </div>
  );
}
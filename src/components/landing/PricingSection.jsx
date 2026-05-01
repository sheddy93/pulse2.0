/**
 * PricingSection.jsx
 * ------------------
 * Sezione prezzi della landing page con piani trasparenti e CTA trial.
 */
import { Check } from 'lucide-react';
import { useState } from 'react';
import DemoRequestModal from './DemoRequestModal';

export default function PricingSection() {
  const [showDemo, setShowDemo] = useState(false);

  const plans = [
    {
      name: "Startup",
      price: "€29",
      period: "/mese per azienda",
      users: "Fino a 25 dipendenti",
      popular: false,
      features: [
        "Gestione dipendenti illimitata",
        "Presenze e presenze GPS",
        "Ferie e permessi",
        "Documenti e firma digitale",
        "Supporto email",
        "Dashboard base"
      ]
    },
    {
      name: "Professional",
      price: "€79",
      period: "/mese per azienda",
      users: "Fino a 100 dipendenti",
      popular: true,
      features: [
        "Tutto da Startup +",
        "Straordinari e approvazioni",
        "Turni e schedulazione",
        "Valutazioni 360°",
        "Analytics avanzate",
        "Supporto prioritario (chat + phone)",
        "Integrazioni API",
        "Custom reports"
      ]
    },
    {
      name: "Enterprise",
      price: "€199+",
      period: "/mese per azienda",
      users: "Illimitati dipendenti",
      popular: false,
      features: [
        "Tutto da Professional +",
        "SSO e SAML",
        "Permessi granulari",
        "White-label",
        "Consulente dedicato",
        "SLA garantito 99.9%",
        "Support 24/7",
        "Integrazioni custom"
      ]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Prezzi trasparenti, niente sorprese</h2>
          <p className="text-xl text-slate-600">Scegli il piano giusto per la tua azienda. Primo mese gratis per il trial.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 transition-all ${
                plan.popular
                  ? "ring-2 ring-blue-600 bg-blue-50 scale-105 shadow-xl"
                  : "border border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              {plan.popular && (
                <div className="mb-4 inline-block px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                  Più popolare
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                <p className="text-sm text-slate-600 mt-2">{plan.period}</p>
                <p className="text-xs text-slate-500 mt-1">{plan.users}</p>
              </div>

              <button
                onClick={() => setShowDemo(true)}
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-colors ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                }`}
              >
                Inizia 14 giorni gratis
              </button>

              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 rounded-2xl p-8 text-center border border-blue-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Non sei sicuro quale piano scegliere?</h3>
          <p className="text-slate-600 mb-6">Parla con il nostro team. Ti consiglieremo il piano più adatto.</p>
          <button
            onClick={() => setShowDemo(true)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Richiedi una demo gratuita
          </button>
        </div>
      </div>

      {showDemo && <DemoRequestModal onClose={() => setShowDemo(false)} />}
    </section>
  );
}
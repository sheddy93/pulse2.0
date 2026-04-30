import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Clock, FileText, TrendingUp, Shield, Zap, CheckCircle2, ArrowRight, Menu, X } from "lucide-react";

const LOGO = "https://media.base44.com/images/public/69f3ad50c2e669c8723343df/a5026eec8_generated_image.png";

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="PulseHR" className="h-10 w-10" />
            <span className="text-xl font-bold text-slate-900">PulseHR</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Feature</a>
            <a href="#benefits" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Vantaggi</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 font-medium text-sm">Prezzo</a>
            <button
              onClick={handleLogin}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
            >
              Accedi
            </button>
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="flex flex-col gap-1 p-4">
              <a href="#features" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Feature</a>
              <a href="#benefits" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Vantaggi</a>
              <a href="#pricing" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Prezzo</a>
              <button
                onClick={handleLogin}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 mt-2"
              >
                Accedi
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
            Gestione Risorse Umane <span className="text-blue-600">Semplice e Efficace</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            PulseHR ti permette di gestire dipendenti, presenze, documenti e performance con un'unica piattaforma moderna e intuitiva.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <a
            href="/auth/register/company"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 text-lg"
          >
            Registra Azienda <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="/auth/register/consultant"
            className="px-8 py-3 border-2 border-violet-300 text-violet-600 rounded-lg font-semibold hover:bg-violet-50 text-lg"
          >
            Registra Consulente
          </a>
        </div>

        <div className="pt-10">
          <div className="inline-flex items-center gap-4 px-4 py-2 bg-slate-100 rounded-full text-sm">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white" />
              ))}
            </div>
            <span className="text-slate-700 font-medium">50+ aziende in Italia</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">Funzionalità Complete</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tutto ciò che serve per gestire la tua azienda in un'unica piattaforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Gestione Dipendenti",
                desc: "Profili completi, contratti, competenze e documenti di ogni dipendente"
              },
              {
                icon: Clock,
                title: "Presenze & Timbratura",
                desc: "Sistema di timbratura digitale con GPS, offline-first e sync automatico"
              },
              {
                icon: FileText,
                title: "Gestione Documenti",
                desc: "Carica, approva e archivia documenti con tracciamento scadenze"
              },
              {
                icon: TrendingUp,
                title: "Valutazioni 360°",
                desc: "Sistema di feedback strutturato da manager, colleghi e autovalutazione"
              },
              {
                icon: Shield,
                title: "Approvazioni Workflow",
                desc: "Ferie, straordinari, rimborsi: workflow di approvazione completi"
              },
              {
                icon: Zap,
                title: "Notifiche in Tempo Reale",
                desc: "Push notification, email e comunicazioni istantanee tra dipendenti"
              }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                  <Icon className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">Perché Scegliere PulseHR</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Aumenta l'efficienza e migliora la comunicazione interna
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                number: "01",
                title: "Interfaccia Intuitiva",
                desc: "Progettata per essere utilizzata facilmente da dipendenti, manager e HR, senza training complesso"
              },
              {
                number: "02",
                title: "Scalabile per Aziende di Qualsiasi Dimensione",
                desc: "Dalla startup alla grande azienda, PulseHR si adatta alle tue esigenze senza compromessi"
              },
              {
                number: "03",
                title: "Integrazione con i Tuoi Strumenti",
                desc: "Connettiti con i sistemi di payroll, contabilità e comunicazione che già utilizzi"
              },
              {
                number: "04",
                title: "Mobile-First & Offline",
                desc: "App PWA per usare PulseHR da qualsiasi device, anche senza connessione internet"
              }
            ].map((benefit, i) => (
              <div key={i} className="flex gap-8 items-start">
                <div className="text-4xl font-bold text-blue-600">{benefit.number}</div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 text-lg">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Prezzi Trasparenti</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Scegli il piano giusto per la tua azienda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Startup",
                price: "€99",
                period: "al mese",
                users: "fino a 10 dipendenti",
                features: ["Gestione dipendenti", "Presenze", "Documenti", "Chat interna"]
              },
              {
                name: "Professional",
                price: "€299",
                period: "al mese",
                users: "fino a 50 dipendenti",
                popular: true,
                features: ["Tutto da Startup", "Valutazioni 360°", "Workflow approvazioni", "Export report", "API"]
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "contattaci",
                users: "Illimitato",
                features: ["Tutto da Professional", "SSO/SAML", "Supporto dedicato", "Custom integrations", "SLA garantito"]
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-xl p-8 border ${
                  plan.popular
                    ? "bg-blue-600 border-blue-400 scale-105 shadow-2xl"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                {plan.popular && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-500 rounded-full text-sm font-semibold">
                    <Zap className="w-4 h-4" /> Più Popolare
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-300 mb-4">{plan.users}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <button
                  onClick={handleLogin}
                  className={`w-full py-3 rounded-lg font-semibold mb-6 transition-colors ${
                    plan.popular
                      ? "bg-white text-blue-600 hover:bg-slate-100"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Inizia Ora
                </button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-4xl font-bold">Pronti a Trasformare la Gestione HR?</h2>
          <p className="text-xl text-blue-100">
            Inizia gratuitamente oggi. Nessuna carta di credito richiesta.
          </p>
          <button
            onClick={handleLogin}
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-slate-100 text-lg"
          >
            Accedi Ora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO} alt="PulseHR" className="h-8 w-8" />
                <span className="font-bold text-white">PulseHR</span>
              </div>
              <p className="text-sm">Gestione HR moderna per aziende innovative</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Prodotto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Feature</a></li>
                <li><a href="#" className="hover:text-white">Prezzi</a></li>
                <li><a href="#" className="hover:text-white">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Supporto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentazione</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contatti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Termini</a></li>
                <li><a href="#" className="hover:text-white">Cookie</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 PulseHR. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * FAQ Data - Accordion items
 */
const FAQ_DATA = [
  {
    question: "Cos'e PulseHR?",
    answer:
      "PulseHR e una piattaforma SaaS per la gestione HR di aziende e studi consulenti. Centralizza presenze, ferie, documenti e compliance in un'unica soluzione.",
  },
  {
    question: "Quanto costa PulseHR?",
    answer:
      "PulseHR offre un piano Starter gratuito per aziende fino a 5 dipendenti. I piani Professional (9 EUR/dipendente/mese) ed Enterprise (19 EUR/dipendente/mese) includono funzionalita avanzate e supporto prioritario.",
  },
  {
    question: "Posso provarlo gratis?",
    answer:
      "Si! Il piano Starter e completamente gratuito per sempre, ideale per piccole aziende fino a 5 dipendenti. Per funzionalita avanzate, offriamo 14 giorni di trial sul piano Professional.",
  },
  {
    question: "I miei dati sono al sicuro?",
    answer:
      "Assolutamente. PulseHR è GDPR-ready, con soft delete, audit trail e gestione consenso. Backup automatici e attenzione costante alla sicurezza dei tuoi dati.",
  },
  {
    question: "Posso invitare il mio consulente del lavoro?",
    answer:
      "Certamente! Puoi invitare consulenti esterni con accesso limitato alla tua azienda. Possono visualizzare report, approvare richieste e gestire documenti secondo i permessi che gli assegni.",
  },
  {
    question: "Offrite supporto in italiano?",
    answer:
      "Si, il nostro team di supporto e completamente in italiano e disponibile via email e chat durante i giorni lavorativi. Il piano Enterprise include anche supporto telefonico prioritario.",
  },
];

/**
 * FAQ Accordion Component
 */
function FAQAccordion({ faq, isOpen, onClick }: { faq: any; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Chiudi' : 'Apri'} risposta per: ${faq.question}`}
        className="w-full flex items-center justify-between p-5 text-left bg-surface hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground pr-4">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted flex-shrink-0" aria-hidden="true" />
        )}
      </button>
      {isOpen && (
        <div className="p-5 pt-0 text-muted text-sm leading-relaxed bg-surface" role="region" aria-label={`Risposta per: ${faq.question}`}>
          {faq.answer}
        </div>
      )}
    </div>
  );
}

/**
 * FAQ Section Component
 */
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 bg-bg">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Domande Frequenti
          </h2>
          <p className="text-lg text-muted">
            Hai dubbi? Trova le risposte qui sotto
          </p>
        </div>

        {/* FAQ Accordion Items */}
        <div className="space-y-4">
          {FAQ_DATA.map((faq, index) => (
            <FAQAccordion
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
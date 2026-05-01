# 📚 PulseHR - Documentazione Tecnica

> **Ultimo aggiornamento:** 2026-05-01  
> **Stack:** React 18 + Vite + TailwindCSS + Base44 Platform  
> **Lingua UI:** Italiano

---

## 🗂️ Indice

1. [Panoramica del Progetto](#panoramica)
2. [Struttura delle Cartelle](#struttura)
3. [Ruoli Utente](#ruoli)
4. [Entità del Database](#entità)
5. [Pagine e Route](#pagine)
6. [Componenti Principali](#componenti)
7. [Backend Functions](#backend-functions)
8. [Autenticazione](#autenticazione)
9. [Integrazioni](#integrazioni)
10. [PWA / Offline](#pwa)
11. [Convenzioni di Codice](#convenzioni)

---

## 1. Panoramica del Progetto <a name="panoramica"></a>

PulseHR è una piattaforma SaaS multi-tenant per la gestione delle Risorse Umane.
Permette a **aziende**, **consulenti del lavoro** e **dipendenti** di interagire in un unico sistema centralizzato.

### Funzionalità principali:
- Gestione dipendenti (anagrafica, contratti, competenze)
- Presenze e timbrature (con supporto offline/PWA)
- Ferie, permessi e straordinari con workflow di approvazione
- Documenti digitali con firma elettronica
- Buste paga con upload e notifiche
- Turni settimanali
- Formazione e certificazioni
- Analytics HR e AI-powered insights
- Sistema di abbonamenti via Stripe
- Chat interna
- Landing page pubblica gestibile dal super admin

---

## 2. Struttura delle Cartelle <a name="struttura"></a>

```
/
├── App.jsx                   # Router principale con tutte le Route
├── index.css                 # Design tokens (CSS variables) + Tailwind
├── tailwind.config.js        # Configurazione Tailwind con design tokens
├── main.jsx                  # Entry point React
├── index.html                # HTML base (titolo, meta, favicon)
│
├── pages/                    # Pagine dell'app (una per route)
│   ├── Landing.jsx           # Landing page originale (statica)
│   ├── LandingNew.jsx        # Landing page dinamica (contenuti da DB)
│   ├── auth/                 # Flusso autenticazione e registrazione
│   ├── dashboard/            # Dashboard per ogni ruolo
│   ├── company/              # Pagine gestione aziendale
│   ├── consultant/           # Pagine per consulenti
│   └── employee/             # Pagine per dipendenti
│
├── components/               # Componenti riutilizzabili
│   ├── layout/               # Layout globali (AppShell, ErrorBoundary, ecc.)
│   ├── admin/                # Componenti per admin (permessi, Stripe)
│   ├── dashboard/            # Widget dashboard
│   ├── attendance/           # Componenti presenze
│   ├── company/              # Componenti gestione aziendale
│   ├── employee/             # Widget dipendente
│   ├── assistant/            # AI Assistant widget
│   ├── pwa/                  # Componenti PWA (install prompt, notifiche)
│   └── ui/                   # shadcn/ui components (non modificare)
│
├── entities/                 # Schemi JSON delle entità database
│   └── *.json                # Un file per entità
│
├── functions/                # Backend functions (Deno Deploy)
│   └── *.js                  # Un file per funzione
│
├── agents/                   # Configurazione agenti AI
│   └── hr_assistant.json
│
├── lib/                      # Utilities e helpers condivisi
│   ├── AuthContext.jsx       # Context autenticazione globale
│   ├── roles.js              # Definizioni ruoli, label, colori
│   ├── utils.js              # Utility generiche (cn, ecc.)
│   ├── gps-utils.js          # Utility validazione GPS
│   └── pwa-utils.js          # Utility PWA/IndexedDB offline
│
├── hooks/                    # Custom React hooks
│   ├── useI18n.js            # Hook internazionalizzazione
│   ├── useTheme.js           # Hook tema chiaro/scuro
│   └── useDashboardLayout.js # Hook layout dashboard personalizzabile
│
└── api/
    └── base44Client.js       # Client Base44 pre-inizializzato (SDK)
```

---

## 3. Ruoli Utente <a name="ruoli"></a>

I ruoli sono definiti in `lib/roles.js`.

| Ruolo | Descrizione | Dashboard |
|-------|-------------|-----------|
| `super_admin` | Proprietario piattaforma | `/dashboard/admin` |
| `consultant` | Consulente del lavoro generico | `/dashboard/consultant` |
| `labor_consultant` | Consulente del lavoro | `/dashboard/consultant` |
| `external_consultant` | Consulente esterno | `/dashboard/consultant` |
| `safety_consultant` | Consulente sicurezza | `/dashboard/consultant` |
| `company` | Azienda (ruolo base) | `/dashboard/company` |
| `company_owner` | Titolare azienda | `/dashboard/company` |
| `company_admin` | Admin aziendale | `/dashboard/company` |
| `hr_manager` | Responsabile HR | `/dashboard/company` |
| `manager` | Manager (accesso limitato) | `/dashboard/company` |
| `employee` | Dipendente | `/dashboard/employee` |

### Come funziona il redirect al login:
1. L'utente si autentica
2. `RoleRedirect` legge `user.role`
3. Redirige al dashboard corretto via `getDashboardPath(role)` da `lib/roles.js`
4. Se il ruolo non è riconosciuto → `/error/unknown-role`

### Primo accesso (nuovo utente):
- Se `user.role` è null/vuoto → `/auth/role-selection`
- L'utente sceglie se è Azienda o Consulente
- Viene reindirizzato alla registrazione specifica

### Forza cambio password:
- Se `user.must_change_password === true` → viene mostrato `ForcePasswordChange`
- Blocca l'accesso a tutto il resto finché non viene completato

---

## 4. Entità del Database <a name="entità"></a>

Ogni entità è definita come JSON schema in `entities/`. Base44 gestisce automaticamente:
- `id` (string, auto-generato)
- `created_date` (ISO string)
- `updated_date` (ISO string)
- `created_by` (email utente che ha creato il record)

### Entità principali:

#### 🏢 Company
File: `entities/Company.json`  
Rappresenta un'azienda cliente della piattaforma.
- `name`: nome azienda
- `public_id`: ID pubblico univoco (es. `COMP-XXXXXXXX`)
- `owner_email`: email del titolare
- `is_active`: se l'azienda è attiva

#### 👤 EmployeeProfile
File: `entities/EmployeeProfile.json`  
Anagrafica dipendente. **Separata dall'utente Base44** per gestire dipendenti senza account.
- `company_id`: riferimento all'azienda
- `user_email`: email account Base44 (se ha un account)
- `has_account`: boolean, se il dipendente ha un account app
- `is_deleted`: soft delete (non cancellare mai fisicamente)

#### 🔗 ConsultantCompanyLink
File: `entities/ConsultantCompanyLink.json`  
Collegamento tra consulente e azienda.
- `status`: `pending_consultant` | `pending_company` | `approved` | `rejected` | `removed`
- `requested_by`: chi ha iniziato la richiesta (`company` o `consultant`)

#### 🔐 UserPermissions
File: `entities/UserPermissions.json`  
Permessi granulari per consulenti e admin su una specifica azienda.
- `user_email` + `company_id`: chiave composta univoca
- `permissions`: oggetto con tutte le boolean (view_employees, edit_payroll, ecc.)

#### 📋 PermissionChangeRequest
File: `entities/PermissionChangeRequest.json`  
Richieste di modifica permessi consulente (richiedono approvazione aziendale).
- `status`: `pending` | `approved` | `rejected`
- `requested_permissions`: i nuovi permessi richiesti
- `current_permissions`: i permessi attuali al momento della richiesta

#### 📅 LeaveRequest
File: `entities/LeaveRequest.json`  
Richieste ferie/permessi dipendenti. Workflow a 2 livelli:
1. Manager approva/rifiuta → `manager_approved` / `manager_rejected`
2. Admin HR approva/rifiuta → `approved` / `rejected`

#### ⏱️ TimeEntry
File: `entities/TimeEntry.json`  
Singola timbratura dipendente.
- `type`: `check_in` | `check_out` | `break_start` | `break_end`
- Supporta sync offline tramite IndexedDB

#### 📄 Document
File: `entities/Document.json`  
Documenti aziendali/dipendente con workflow di revisione e firma.
- `status`: `in_revisione` | `approvato` | `rifiutato`
- `signature_required`: se richiede firma del dipendente
- `signature_status`: `pending` | `signed` | `rejected`

#### 💰 PayrollFile
File: `entities/PayrollFile.json`  
Buste paga caricate per ogni dipendente.
- Associato a `employee_id`, `year`, `month`
- Traccia download e notifiche

#### 💳 CompanySubscription
File: `entities/CompanySubscription.json`  
Abbonamento attivo di un'azienda (gestito via Stripe).
- `stripe_subscription_id`: ID sottoscrizione Stripe
- `status`: `active` | `trialing` | `past_due` | `canceled`

#### 🌐 LandingPageContent
File: `entities/LandingPageContent.json`  
Contenuti dinamici della landing page pubblica.
- `section`: `hero` | `pricing` | `features` | ecc.
- Record `hero`: contiene titolo, sottotitolo, CTA
- Record `pricing`: contiene array `pricing_plans`

---

## 5. Pagine e Route <a name="pagine"></a>

Tutte le route sono definite in `App.jsx`.

### Route pubbliche:
| Path | Componente | Descrizione |
|------|-----------|-------------|
| `/landing` | `LandingNew` | Landing page pubblica |
| `/` | `RoleRedirect` | Redirect automatico per ruolo |

### Route autenticazione:
| Path | Componente |
|------|-----------|
| `/auth/role-selection` | Selezione ruolo primo accesso |
| `/auth/register/company` | Registrazione azienda |
| `/auth/register/consultant` | Registrazione consulente |
| `/error/unknown-role` | Ruolo non riconosciuto |

### Route Super Admin (`/dashboard/admin/*`):
| Path | Pagina |
|------|--------|
| `/dashboard/admin` | AdminDashboard |
| `/dashboard/admin/analytics` | AdminAnalytics |
| `/dashboard/admin/settings` | SuperAdminSettings |
| `/dashboard/admin/companies` | AdminCompanies |
| `/dashboard/admin/users` | AdminUsers |
| `/dashboard/admin/system` | AdminSystem |

### Route Azienda (`/dashboard/company/*`):
Oltre 30 route per gestione completa HR. Vedi `App.jsx` per lista completa.

### Route Dipendente (`/dashboard/employee/*`):
Circa 20 route per self-service dipendente.

---

## 6. Componenti Principali <a name="componenti"></a>

### `components/layout/AppShell.jsx`
**Layout principale** usato da tutte le pagine autenticate.
- Sidebar con navigazione dinamica in base al ruolo (`NAV` map)
- Header con nome utente, badge ruolo, campanella notifiche
- Responsive: hamburger menu su mobile
- AI Assistant Widget integrato in basso a destra
- `user` prop: oggetto utente Base44

```jsx
// Utilizzo standard in ogni pagina:
<AppShell user={user}>
  {/* contenuto pagina */}
</AppShell>
```

### `components/layout/PageLoader.jsx`
Spinner di caricamento centrato. Prop `color`: `blue` | `violet` | `green` | `red`.

### `components/layout/ErrorBoundary.jsx`
Wrappa tutta l'app in `App.jsx`. Cattura errori React non gestiti.

### `components/admin/PermissionsEditor.jsx`
Modal per modificare i permessi di un utente su un'azienda.
- `isConsultant=true`: richiede approvazione (crea `PermissionChangeRequest`)
- `isConsultant=false`: salva direttamente (per admin interni)

### `components/admin/PermissionRequestsPanel.jsx`
Panel modale per approvare/rifiutare richieste permessi consulenti.
Usato nella pagina `CompanyConsultants`.

### `components/assistant/HRAssistantWidget.jsx`
Widget AI flotante in basso a destra. Usa l'agente `hr_assistant`.

### `components/layout/NotificationBell.jsx`
Campanella notifiche nell'header. Mostra badge con conteggio non letti.

---

## 7. Backend Functions <a name="backend-functions"></a>

Le funzioni sono in `functions/` e girano su **Deno Deploy**.  
Si chiamano dal frontend via: `await base44.functions.invoke('nomeFunzione', payload)`

| Funzione | Scopo |
|----------|-------|
| `stripeCheckout` | Crea sessione checkout Stripe per abbonamento |
| `stripeWebhook` | Gestisce webhook Stripe (aggiorna CompanySubscription) |
| `stripePlans` | Restituisce piani abbonamento disponibili |
| `processPayrollZip` | Processa ZIP buste paga, le smista per dipendente |
| `notifyPayrollAvailable` | Notifica dipendenti che la busta paga è disponibile |
| `notifyLeaveRequest` | Notifica manager di nuova richiesta ferie |
| `notifyLeaveRequestUpdate` | Notifica dipendente dell'esito richiesta ferie |
| `notifyOvertimeRequestUpdate` | Notifica dipendente dell'esito straordinario |
| `notifyHRApproval` | Notifica HR di richiesta da approvare |
| `notifyManagerApproval` | Notifica manager di richiesta da approvare |
| `notifyConsultantLink` | Notifica su collegamento consulente/azienda |
| `notifyExpiringDocs` | Notifica documenti in scadenza |
| `notifyExpiringDocuments` | Versione alternativa notifica documenti |
| `sendSignatureReminder` | Reminder firma documenti |
| `generateReport` | Genera report HR in PDF/Excel |
| `aiAnalytics` | Analytics avanzate con AI (OpenAI) |
| `importEmployeesFromCSV` | Importa dipendenti da file CSV |
| `createAuditLog` | Crea record AuditLog per azioni sensibili |

### Struttura base di una funzione:
```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me(); // autenticazione
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // logica...

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Errore:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

---

## 8. Autenticazione <a name="autenticazione"></a>

Gestita interamente da Base44 Platform.  
Il context globale è in `lib/AuthContext.jsx`.

### Hook `useAuth()`:
```jsx
const { user, isLoadingAuth, authError, navigateToLogin } = useAuth();
```

### Metodi SDK:
```javascript
import { base44 } from '@/api/base44Client';

await base44.auth.me()                    // utente corrente
await base44.auth.updateMe(data)          // aggiorna profilo
await base44.auth.isAuthenticated()       // boolean
base44.auth.logout("/")                   // logout + redirect
base44.auth.redirectToLogin(nextUrl)      // redirect al login
```

### Flusso nuovo utente:
1. Si registra via email (gestito da Base44)
2. Primo accesso → `RoleSelection` (sceglie Company o Consultant)
3. Registrazione dettagli → crea record `Company` o aggiorna profilo consulente
4. Redirect al dashboard appropriato

---

## 9. Integrazioni <a name="integrazioni"></a>

### Stripe
- Chiavi in secrets: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Checkout via `stripeCheckout` function
- Webhook via `stripeWebhook` function → aggiorna `CompanySubscription`
- Gestione piani in `SuperAdminSettings` → tab "Stripe & Piani"

### Base44 Core Integrations (disponibili senza configurazione):
```javascript
// LLM
await base44.integrations.Core.InvokeLLM({ prompt: "...", response_json_schema: {...} })

// Email
await base44.integrations.Core.SendEmail({ to: "...", subject: "...", body: "..." })

// Upload file
const { file_url } = await base44.integrations.Core.UploadFile({ file: fileObject })

// Genera immagine AI
const { url } = await base44.integrations.Core.GenerateImage({ prompt: "..." })
```

---

## 10. PWA / Offline <a name="pwa"></a>

L'app è installabile come PWA (Progressive Web App).

### File rilevanti:
- `public/manifest.json`: configurazione PWA (nome, icone, colori)
- `public/service-worker.js`: cache offline e background sync
- `lib/pwa-utils.js`: utility IndexedDB per timbrature offline
- `components/pwa/InstallPrompt.jsx`: banner installazione app
- `components/pwa/NotificationManager.jsx`: gestione push notifications
- `components/pwa/QuickAttendanceCard.jsx`: widget timbratura rapida

### Flusso timbratura offline:
1. Dipendente timbra senza connessione
2. TimeEntry viene salvato in IndexedDB
3. Quando torna online → sync automatica con server
4. Indicatore visivo online/offline in `AttendancePage`

---

## 11. Convenzioni di Codice <a name="convenzioni"></a>

### Struttura standard di una pagina:
```jsx
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";

export default function NomePagina() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      // carica altri dati...
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      {/* contenuto */}
    </AppShell>
  );
}
```

### Regole generali:
- **Soft delete**: non cancellare mai fisicamente i record. Usare `is_deleted: true` + `deleted_at` + `deleted_by`
- **company_id**: ogni entità aziendale ha `company_id`. Filtrare sempre per company_id nelle query
- **Ruoli**: usare sempre `getRoleLabel()` e `getRoleColor()` da `lib/roles.js` per la UI
- **Notifiche**: usare `sonner` (`import { toast } from "sonner"`) per feedback utente
- **Icone**: solo da `lucide-react`. Non importare icone non esistenti
- **Stili**: solo classi Tailwind. No `style={{}}` inline. No classi dinamiche con template literal
- **Componenti UI**: usare sempre quelli di `@/components/ui/` (shadcn)
- **Errori**: non usare try/catch a meno che non sia necessario (gli errori si propagano al Base44 error handler)
- **File grandi**: se un file supera ~150 righe, valutare di estrarre sottocomponenti

### Naming conventions:
- **Pagine**: PascalCase, export default con stesso nome del file
- **Componenti**: PascalCase
- **Hook**: camelCase con prefisso `use`
- **Funzioni backend**: camelCase (es. `notifyLeaveRequest`)
- **Entità**: PascalCase (es. `LeaveRequest`)
- **Route**: kebab-case (es. `/dashboard/company/leave-requests`)

---

## 🔄 Aggiornamenti

| Data | Modifica |
|------|---------|
| 2026-05-01 | Creazione documentazione iniziale |
| 2026-05-01 | Aggiunta entità LandingPageContent, GlobalAnnouncement, SocialLinks |
| 2026-05-01 | Implementato workflow PermissionChangeRequest per consulenti |

---

*Per domande sul codice, fare riferimento ai commenti inline nei file.*
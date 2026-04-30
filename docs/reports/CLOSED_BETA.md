# PulseHR - Closed Beta Guide

**Versione:** 1.0.0-beta  
**Data Rilascio:** Gennaio 2025  
**Status:** Closed Beta - Testing Interno

---

## Indice

- [Panoramica](#panoramica)
- [Cosa è Incluso](#cosa-è-incluso)
- [Cosa Non è Incluso](#cosa-non-è-incluso)
- [Utenti Demo](#utenti-demo)
- [Flow da Testare](#flow-da-testare)
- [Limitazioni Note](#limitazioni-note)
- [Come Segnalare Bug](#come-segnalare-bug)

---

## Panoramica

Benvenuto nella Closed Beta di PulseHR! Questa versione beta è stata sviluppata per testare le funzionalità core della piattaforma in un ambiente controllato prima del rilascio pubblico.

**Obiettivi della Beta:**
- Testare i flussi principali di gestione HR
- Validare l'architettura multi-tenant
- Verificare la sicurezza e l'isolamento dei dati
- Raccogliere feedback su UX/UI
- Identificare e risolvere bug critici

---

## Cosa è Incluso

### ✅ Funzionalità Disponibili

#### 1. Gestione Utenti e Aziende
- ✅ Registrazione e login utenti
- ✅ Creazione e gestione aziende (Company)
- ✅ Sistema di ruoli (Super Admin, Company Owner, Company Admin, HR Manager, Manager, Employee)
- ✅ Multi-tenant isolation (ogni azienda vede solo i propri dati)
- ✅ Onboarding guidato per nuovi utenti

#### 2. Gestione Dipendenti
- ✅ Creazione profili dipendenti (EmployeeProfile)
- ✅ Associazione dipendenti a dipartimenti e uffici
- ✅ Gestione gerarchia (manager-dipendente)
- ✅ Stati dipendente (Active, Suspended, Inactive)

#### 3. Timbrature e Presenza
- ✅ Check-in / Check-out via web
- ✅ Storico timbrature
- ✅ Geolocalizzazione (GPS tracking)
- ✅ Geofencing per uffici
- ✅ Daily review presenze con rilevamento anomalie
- ✅ Correzioni manuali timbrature (con audit trail)
- ✅ Report mensili presenze
- ✅ Chiusura periodo mensile

#### 4. Gestione Ferie e Permessi
- ✅ Richiesta ferie/permessi
- ✅ Workflow approvazione (Manager → HR)
- ✅ Tipi di permesso configurabili
- ✅ Saldo ferie per dipendente
- ✅ Calendario ferie

#### 5. Gestione Documenti
- ✅ Upload documenti aziendali
- ✅ Assegnazione documenti a dipendenti
- ✅ Conferma lettura documenti
- ✅ Categorizzazione documenti (Payroll, Employee, Company, Safety)
- ✅ Controllo visibilità (Company Only, Employee Only, Company + Consultant)
- ✅ Storage tracking (limite per piano)

#### 6. Payroll (Gestione Cedolini)
- ✅ Creazione PayrollRun mensili
- ✅ Workflow payroll (Draft → In Progress → Ready for Review → Approved → Delivered)
- ✅ Associazione documenti a payroll
- ✅ Visibilità cedolini per dipendenti
- ✅ Gestione consulente del lavoro

#### 7. Collegamento Consulenti
- ✅ Richiesta collegamento consulente-azienda
- ✅ Approvazione bidirezionale (Company → Consultant)
- ✅ Accesso multi-azienda per consulenti
- ✅ Scope di accesso (Read Only, Limited, Full)
- ✅ Public ID aziende per ricerca

#### 8. Sistema di Notifiche
- ✅ Notifiche in-app
- ✅ Badge contatore notifiche non lette
- ✅ Tipi notifica (Info, Success, Warning, Error, Attention)
- ✅ Priorità notifiche (Low, Medium, High, Urgent)
- ✅ Action URL per navigazione diretta

#### 9. Automazioni
- ✅ AutomationRule configurabili per azienda
- ✅ Trigger: Missing Clock-in, Leave Pending Too Long, Document Expiring, Document Not Acknowledged
- ✅ Actions: Create Notification, Create Task, Send Email
- ✅ Esecuzione automazioni schedulata

#### 10. Audit e Sicurezza
- ✅ AuditLog completo per tutte le azioni critiche
- ✅ Tracking IP e User Agent
- ✅ Soft delete con timestamp
- ✅ Token-based authentication
- ✅ Permission-based access control
- ✅ CORS configurato per produzione

#### 11. Pricing e Billing (Base)
- ✅ Piani tariffari configurabili (Starter, Professional, Enterprise)
- ✅ Limiti per piano (max dipendenti, storage)
- ✅ Check limiti in tempo reale
- ✅ Trial period (14 giorni)
- ✅ Stripe Customer integration (preparato)

#### 12. Sicurezza sul Lavoro
- ✅ Corsi di sicurezza configurabili
- ✅ Assegnazione corsi a dipendenti
- ✅ Tracking completion e scadenze
- ✅ Ispezioni di sicurezza
- ✅ Alert sicurezza automatici
- ✅ Categorie: Antincendio, Primo Soccorso, RLS, DPI, etc.

#### 13. Visite Mediche
- ✅ Schedulazione visite mediche
- ✅ Tipi visita: Periodica, Pre-assunzione, Rientro al lavoro, Follow-up
- ✅ Tracking completamento visite
- ✅ Certificati medici INPS
- ✅ Gestione malattia/infortunio

---

## Cosa Non è Incluso

### ❌ Funzionalità Non Disponibili in Beta

#### 1. Integrazioni Esterne
- ❌ Integrazione Stripe pagamenti (solo setup base)
- ❌ Invio email (SMTP non configurato)
- ❌ Push notifications mobile
- ❌ SSO (Single Sign-On) con provider esterni
- ❌ API webhooks outgoing

#### 2. Features Avanzate
- ❌ Export dati avanzato (Excel, CSV con filtri)
- ❌ Report personalizzabili con builder
- ❌ Dashboard analytics avanzata
- ❌ Grafici interattivi real-time
- ❌ Workflow automation complessi (solo base)

#### 3. Mobile App
- ❌ App iOS nativa
- ❌ App Android nativa
- ❌ PWA offline-first (in sviluppo)

#### 4. Performance
- ❌ Caching Redis (sistema base)
- ❌ Task queue Celery (operazioni sync)
- ❌ CDN per file statici
- ❌ Database read replicas

#### 5. Compliance Avanzata
- ❌ Firma digitale documenti
- ❌ Marcatura temporale certificata
- ❌ Backup automatici schedulati
- ❌ Disaster recovery plan

---

## Utenti Demo

Per testare la piattaforma sono disponibili utenti demo pre-configurati:

### Azienda Demo: "Acme Corporation"
**Slug:** `acme-corp`  
**Public ID:** `ACME2024DEMO01`

#### 1. Super Admin (Platform Admin)
```
Email: superadmin@pulsehr.demo
Password: Demo2024!
Ruolo: SUPER_ADMIN
Accesso: Tutte le aziende, gestione piattaforma
```

#### 2. Company Owner
```
Email: owner@acme.demo
Password: Demo2024!
Ruolo: COMPANY_OWNER
Accesso: Gestione completa Acme Corporation
```

#### 3. Company Admin
```
Email: admin@acme.demo
Password: Demo2024!
Ruolo: COMPANY_ADMIN
Accesso: Gestione dipendenti, presenze, documenti
```

#### 4. HR Manager
```
Email: hr@acme.demo
Password: Demo2024!
Ruolo: HR_MANAGER
Accesso: Gestione ferie, documenti, payroll
```

#### 5. Manager
```
Email: manager@acme.demo
Password: Demo2024!
Ruolo: MANAGER
Accesso: Approvazione ferie team, presenze team
```

#### 6. Employee
```
Email: employee@acme.demo
Password: Demo2024!
Ruolo: EMPLOYEE
Accesso: Timbrature, richiesta ferie, visualizza documenti personali
```

#### 7. Labor Consultant
```
Email: consultant@acme.demo
Password: Demo2024!
Ruolo: LABOR_CONSULTANT
Accesso: Payroll, documenti consulente, multi-azienda
```

#### 8. Safety Consultant
```
Email: safety@acme.demo
Password: Demo2024!
Ruolo: SAFETY_CONSULTANT
Accesso: Corsi sicurezza, ispezioni, certificati
```

### Azienda Demo 2: "TechStart SRL"
**Slug:** `techstart`

#### Company Admin
```
Email: admin@techstart.demo
Password: Demo2024!
Ruolo: COMPANY_ADMIN
Accesso: Gestione completa TechStart
```

---

## Flow da Testare

### 🔹 Flow 1: Onboarding Azienda (Company Admin)

**Obiettivo:** Completare l'onboarding guidato per una nuova azienda

**Steps:**
1. Registrati come Company Owner
2. Completa i 5 step dell'onboarding:
   - ✅ Welcome (panoramica)
   - ✅ Complete Profile (dati azienda)
   - ✅ Add Employee (primo dipendente)
   - ✅ Invite Consultant (collega consulente)
   - ✅ Generate Report (primo report)
3. Verifica redirect a dashboard

**Cosa testare:**
- Salvataggio automatico progress
- Ripresa onboarding dopo logout
- Validazione campi
- Navigazione avanti/indietro

---

### 🔹 Flow 2: Gestione Timbrature (Employee → Manager)

**Obiettivo:** Check-in, check-out e approvazione giornaliera

**Steps:**
1. Login come Employee (`employee@acme.demo`)
2. Vai a `/attendance`
3. Click "Check-in"
   - Concedi permessi geolocalizzazione (se richiesto)
   - Verifica timestamp e location salvati
4. Lavora 8 ore (o simula timestamp)
5. Click "Check-out"
6. Logout e login come Manager (`manager@acme.demo`)
7. Vai a `/company/attendance/review`
8. Approva la giornata del dipendente
9. Verifica audit log creato

**Cosa testare:**
- Geolocalizzazione funziona
- Non puoi fare check-out senza check-in
- Non puoi fare doppio check-in
- Manager vede solo il suo team
- Anomalie rilevate (es. manca check-out)

---

### 🔹 Flow 3: Richiesta e Approvazione Ferie

**Obiettivo:** Employee richiede ferie, Manager approva

**Steps:**
1. Login come Employee (`employee@acme.demo`)
2. Vai a `/leave/requests`
3. Click "Nuova Richiesta"
4. Seleziona:
   - Tipo: Vacation (Ferie)
   - Data inizio: +7 giorni
   - Data fine: +11 giorni (5 giorni lavorativi)
5. Inserisci motivazione
6. Invia richiesta
7. Logout e login come Manager (`manager@acme.demo`)
8. Vai a `/leave/approvals`
9. Visualizza richiesta in "Pending"
10. Approva richiesta
11. Verifica che Employee riceva notifica

**Cosa testare:**
- Calcolo giorni automatico
- Saldo ferie aggiornato
- Notifiche inviate correttamente
- Stato cambia da Pending → Approved
- AuditLog registra approvazione

---

### 🔹 Flow 4: Upload e Assegnazione Documento

**Obiettivo:** HR carica documento e lo assegna a dipendente

**Steps:**
1. Login come HR Manager (`hr@acme.demo`)
2. Vai a `/documents`
3. Click "Upload Documento"
4. Compila form:
   - Titolo: "Contratto 2024"
   - Categoria: Employee Document
   - Visibilità: Employee and Company
   - Assegna a: employee@acme.demo
   - Richiede conferma: Sì
5. Upload file PDF
6. Salva
7. Logout e login come Employee (`employee@acme.demo`)
8. Vai a `/documents`
9. Visualizza documento assegnato
10. Click "Conferma Lettura"
11. Verifica badge "Confirmed"

**Cosa testare:**
- Upload file funziona
- Storage limit rispettato
- Visibilità corretta (altri employee non vedono)
- Conferma lettura salvata con timestamp
- AuditLog traccia upload e conferma

---

### 🔹 Flow 5: Payroll Workflow (Consultant → Company → Employee)

**Obiettivo:** Creazione payroll, approvazione, delivery cedolino

**Steps:**
1. Login come Labor Consultant (`consultant@acme.demo`)
2. Vai a `/payroll`
3. Click "Nuova Elaborazione"
4. Seleziona:
   - Azienda: Acme Corporation
   - Dipendente: employee@acme.demo
   - Mese: corrente
5. Carica documenti input (ore lavorate, note)
6. Cambia status: Draft → In Progress
7. Carica cedolino PDF
8. Cambia status: In Progress → Ready for Review
9. Logout e login come Company Admin (`admin@acme.demo`)
10. Vai a `/payroll/review`
11. Visualizza cedolino
12. Approva: Ready for Review → Approved by Company
13. Logout e login come Employee (`employee@acme.demo`)
14. Vai a `/payroll/my-payslips`
15. Verifica cedolino disponibile per download

**Cosa testare:**
- Workflow status corretto (no salti)
- Documenti allegati correttamente
- Solo payroll approvati visibili a Employee
- Consultant vede solo aziende collegate
- AuditLog completo

---

### 🔹 Flow 6: Collegamento Consulente (Consultant → Company Approval)

**Obiettivo:** Consulente richiede accesso, azienda approva

**Steps:**
1. Crea nuovo utente Consultant (o usa `consultant@acme.demo`)
2. Login come Consultant
3. Vai a `/consultant/companies`
4. Click "Request Company Access"
5. Inserisci Public ID azienda: `ACME2024DEMO01`
6. Invia richiesta
7. Logout e login come Company Owner (`owner@acme.demo`)
8. Vai a `/company/consultant-requests`
9. Visualizza richiesta "Pending"
10. Approva richiesta
11. Verifica UserCompanyAccess creato
12. Login come Consultant
13. Verifica accesso a dati Acme Corporation

**Cosa testare:**
- Public ID validation
- Status bidirezionale (Pending Company → Approved)
- Notifiche inviate
- Access scope corretto (Read Only default)
- Consultant vede solo aziende approvate

---

### 🔹 Flow 7: Automazioni e Tasks

**Obiettivo:** Configurare automazione e verificare trigger

**Steps:**
1. Login come Company Admin (`admin@acme.demo`)
2. Vai a `/company/automations`
3. Visualizza regole pre-configurate:
   - Missing Clock-in (trigger ore 10:00)
   - Leave Pending Too Long (2+ giorni)
   - Document Expiring (30 giorni)
   - Document Not Acknowledged (7 giorni)
4. Abilita regola "Missing Clock-in"
5. Simula scenario: Employee non timbra entro le 10:00
6. Verifica notifica inviata automaticamente
7. Vai a `/tasks`
8. Visualizza task generato (se action = Create Task)
9. Completa task
10. Verifica AuditLog

**Cosa testare:**
- Regole possono essere attivate/disattivate
- Trigger eseguiti correttamente
- Notifiche/Task creati
- Last run timestamp aggiornato
- Solo admin può gestire regole

---

### 🔹 Flow 8: Sicurezza sul Lavoro

**Obiettivo:** Assegnare corso di sicurezza e tracciare completion

**Steps:**
1. Login come Safety Consultant (`safety@acme.demo`)
2. Vai a `/safety/courses`
3. Crea nuovo corso:
   - Titolo: "Antincendio Livello 1"
   - Categoria: Fire
   - Durata: 4 ore
   - Validità: 36 mesi
4. Salva corso
5. Vai a `/safety/training`
6. Assegna corso a `employee@acme.demo`
7. Imposta due date: entro 30 giorni
8. Salva
9. Logout e login come Employee
10. Vai a `/safety/my-training`
11. Visualizza corso assegnato
12. Click "Mark as Completed"
13. Upload certificato PDF
14. Salva
15. Verifica expiry date calcolata automaticamente

**Cosa testare:**
- Alert generati per corsi in scadenza
- Status corso: Pending → Completed → Expired
- Certificato salvato correttamente
- Solo Safety Consultant può assegnare corsi
- Employee vede solo i propri corsi

---

### 🔹 Flow 9: Multi-Tenant Isolation

**Obiettivo:** Verificare che aziende non vedano dati di altre aziende

**Steps:**
1. Login come Admin Acme (`admin@acme.demo`)
2. Vai a `/company/employees`
3. Conta dipendenti Acme (es. 5)
4. Vai a `/documents`
5. Conta documenti Acme (es. 10)
6. Logout e login come Admin TechStart (`admin@techstart.demo`)
7. Vai a `/company/employees`
8. Verifica che vedi solo dipendenti TechStart
9. Vai a `/documents`
10. Verifica che vedi solo documenti TechStart
11. Prova a accedere a documento Acme via URL diretto
12. Verifica errore 403/404

**Cosa testare:**
- Filtro `company_id` applicato correttamente
- Nessun data leak tra aziende
- URL diretti bloccati per risorse di altre aziende
- Consultant vede solo aziende autorizzate

---

## Limitazioni Note

### 🚧 Limitazioni Tecniche

#### 1. Performance
- **Database:** SQLite in dev (non ottimizzato per produzione)
- **No caching:** Ogni query va al database
- **No CDN:** File serviti direttamente dal backend
- **Limite concurrent users:** ~50 utenti simultanei

#### 2. Scalabilità
- **Single instance backend:** No load balancing
- **No task queue:** Operazioni pesanti sono sincrone (es. report generation)
- **Storage limit:** 1GB per azienda in beta

#### 3. Sicurezza
- **Token expiration:** Token non scadono (usa JWT in produzione)
- **Rate limiting:** Non implementato (vulnerabile a spam)
- **File upload:** No virus scanning (integra ClamAV)
- **Password policy:** Policy base (8 caratteri, no complexity requirement)

#### 4. Notifiche
- **Email:** Non inviate (SMTP non configurato)
- **Push mobile:** Non disponibili
- **Real-time:** No WebSocket (solo polling ogni 30s)

#### 5. Geolocalizzazione
- **Accuracy:** Dipende dal browser/dispositivo
- **Geofencing:** Controllo basic (no algoritmo avanzato)
- **Offline:** Check-in offline non supportato (deve sync manualmente)

### ⚠️ Limitazioni Funzionali

#### 1. Ferie
- **Calcolo giorni:** Non considera festività nazionali
- **Saldo:** Non gestisce riporto anno precedente automatico
- **Tipologie:** Solo base (Vacation, Sick, Personal)

#### 2. Payroll
- **Calcoli:** Manuale (no calcolo automatico contributi/tasse)
- **Export:** Solo PDF (no XML per commercialisti)
- **Integrazione:** No integrazione con software paghe esistenti

#### 3. Documenti
- **Versioning:** Non supportato (solo ultima versione)
- **Collaborazione:** No commenti/annotazioni
- **OCR:** No estrazione testo automatica

#### 4. Reporting
- **Report:** Template fissi (no personalizzazione)
- **Export:** Solo PDF base (no Excel con formule)
- **Grafici:** Limitati (no drill-down interattivo)

#### 5. Mobile
- **Responsive:** Desktop-first (mobile responsive ma non ottimizzato)
- **Offline:** No supporto offline
- **Camera:** No upload foto da fotocamera mobile

---

## Come Segnalare Bug

### Procedura Segnalazione

1. **Verifica che il bug non sia già noto** (vedi [Limitazioni Note](#limitazioni-note))

2. **Raccogli informazioni:**
   - Descrizione dettagliata del problema
   - Steps per riprodurre
   - Comportamento atteso vs osservato
   - Screenshot/video (se applicabile)
   - Browser e versione
   - Sistema operativo
   - Utente demo usato per il test

3. **Categorizza il bug:**
   - 🔴 **Critical:** Sistema inutilizzabile, data loss, security vulnerability
   - 🟠 **High:** Funzionalità importante non funzionante
   - 🟡 **Medium:** Funzionalità minore non funzionante
   - 🟢 **Low:** UI/UX issue, typo, miglioramento

4. **Invia segnalazione via:**
   - **GitHub Issues:** https://github.com/[repo]/issues
   - **Email:** beta-feedback@pulsehr.demo
   - **Slack:** #beta-testing channel (se disponibile)

### Template Segnalazione

```markdown
### Descrizione Bug
[Descrizione breve del problema]

### Steps per Riprodurre
1. Login come [ruolo utente]
2. Vai a [pagina]
3. Click su [elemento]
4. [Risultato osservato]

### Comportamento Atteso
[Cosa dovrebbe succedere]

### Comportamento Osservato
[Cosa succede invece]

### Ambiente
- Browser: [Chrome 120, Safari 17, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Utente: [employee@acme.demo]
- Timestamp: [2025-01-15 10:30]

### Screenshot
[Allega screenshot se applicabile]

### Severità
[Critical / High / Medium / Low]
```

---

## Roadmap Post-Beta

### Q1 2025 (Dopo Beta)
- 🔜 Integrazione email (SendGrid)
- 🔜 Push notifications
- 🔜 Export Excel avanzato
- 🔜 Dashboard analytics migliorata
- 🔜 PWA offline-first
- 🔜 Rate limiting API
- 🔜 JWT authentication
- 🔜 Redis caching

### Q2 2025
- 🔜 Mobile app (iOS + Android)
- 🔜 Stripe billing completo
- 🔜 Celery task queue
- 🔜 Report builder personalizzabile
- 🔜 Firma digitale documenti
- 🔜 SSO integrations
- 🔜 API webhooks

### Q3 2025
- 🔜 AI assistant per HR
- 🔜 Predictive analytics
- 🔜 Multi-language support
- 🔜 White-label option
- 🔜 Enterprise features

---

## Supporto

Per qualsiasi domanda o problema:

- **Email:** support@pulsehr.demo
- **Documentazione:** https://docs.pulsehr.demo
- **Status Page:** https://status.pulsehr.demo

Grazie per partecipare alla Closed Beta di PulseHR! 🚀

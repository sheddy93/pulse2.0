# PulseHR - Piano Migrazione Completa

## Visione

**Fase 1 (Oggi)**: Prototipo funzionale su Base44 con architettura migrabile
**Fase 2 (2-3 settimane)**: Backend Python + PostgreSQL + Deploy Render/Railway
**Fase 3 (Ongoing)**: Produzione e scaling

---

## Architettura Attuale (Base44)

```
Frontend (React/Vite)
  ├─ components/ (UI)
  ├─ pages/ (routing)
  ├─ hooks/ (logica)
  ├─ api/ (layer intermedio — CRITICO PER MIGRAZIONE)
  ├─ lib/ (ruoli, permessi, costanti)
  └─ entities/ (Entity JSON schemas)
        ↓
   [Base44 SDK]
        ↓
   Base44 Backend (dati)
```

---

## Mapping Entità Base44 → PostgreSQL

| Entity Base44 | Tabella PostgreSQL | Stato | Note |
|---|---|---|---|
| Company | companies | ✅ Pronto | compound_index: (id, status) |
| User | users | ✅ Pronto | Aggiungere password_hash |
| Employee | employees | ✅ Pronto | FK: company_id, user_id, department_id, manager_id |
| Department | departments | ✅ Pronto | FK: company_id, manager_id |
| AttendanceEntry | attendance_entries | ✅ Pronto | Index: (employee_id, date) per query rapide |
| AttendanceDayReview | attendance_day_reviews | ✅ Pronto | FK: employee_id, company_id |
| LeaveRequest | leave_requests | ✅ Pronto | FK: employee_id, company_id, approved_by |
| LeaveBalance | leave_balances | ✅ Pronto | Unique: (employee_id, year) |
| Document | documents | ✅ Pronto | Support file_url esterno (S3/R2) |
| PayrollRun | payroll_runs | ✅ Pronto | FK: company_id, created_by |
| PayrollDocument | payroll_documents | ✅ Pronto | FK: payroll_run_id, employee_id |
| ConsultantCompanyLink | consultant_company_links | ✅ Pronto | Unique: (consultant_user_id, company_id) |
| Notification | notifications | ✅ Pronto | Index: (user_id, is_read) |
| AuditLog | audit_logs | ✅ Pronto | Non-indexed ma essenziale per compliance |
| Subscription | subscriptions | ✅ Pronto | FK: company_id, Stripe IDs |

---

## Mapping API Layer → Endpoint REST

**Oggi** (Base44):
```javascript
// src/api/client.js
await apiClient.getEmployees({ company_id: '123' })
  → base44.entities.Employee.filter({ company_id: '123' })
```

**Domani** (Django REST / FastAPI):
```javascript
// src/api/client.js (stesso codice!)
await apiClient.getEmployees({ company_id: '123' })
  → fetch('https://api.pulsehr.com/api/employees/?company_id=123')
```

### Endpoint Completi (TODO MIGRATION)

#### Auth
- `POST /api/auth/login/` — Body: {email, password}
- `POST /api/auth/logout/` — Revoke token
- `GET /api/auth/me/` — Get current user
- `POST /api/auth/refresh/` — Refresh token

#### Companies
- `GET /api/companies/` — List (filtrabili per super_admin)
- `POST /api/companies/` — Create
- `GET /api/companies/:id/` — Detail
- `PATCH /api/companies/:id/` — Update
- `DELETE /api/companies/:id/` — Soft delete

#### Employees
- `GET /api/employees/?company_id=...` — List
- `POST /api/employees/` — Create
- `GET /api/employees/:id/` — Detail
- `PATCH /api/employees/:id/` — Update
- `DELETE /api/employees/:id/` — Soft delete
- `GET /api/employees/:id/leave-balance/` — Saldo ferie

#### Attendance
- `POST /api/attendance/check-in/` — Body: {employee_id, location_lat, location_lng}
- `POST /api/attendance/check-out/` — Body: {employee_id}
- `POST /api/attendance/break-start/` — Body: {employee_id}
- `POST /api/attendance/break-end/` — Body: {employee_id}
- `GET /api/attendance/entries/?employee_id=...&date=...` — List
- `GET /api/attendance/day-reviews/:employee_id/:date/` — Dettaglio giorno
- `PATCH /api/attendance/day-reviews/:id/approve/` — Approva giorno
- `PATCH /api/attendance/entries/:id/` — Correggi singola timbratura

#### Leave
- `GET /api/leave/requests/?company_id=...` — List
- `POST /api/leave/requests/` — Create
- `PATCH /api/leave/requests/:id/approve/` — Approva
- `PATCH /api/leave/requests/:id/reject/` — Rifiuta
- `GET /api/leave/balances/?employee_id=...&year=...` — Saldo

#### Documents
- `GET /api/documents/?company_id=...` — List
- `POST /api/documents/` — Upload
- `GET /api/documents/:id/` — Detail
- `GET /api/documents/:id/download/` — Scarica (signed URL)
- `PATCH /api/documents/:id/archive/` — Archivia
- `PATCH /api/documents/:id/confirm/` — Segna come letto

#### Payroll
- `GET /api/payroll/runs/?company_id=...` — List
- `POST /api/payroll/runs/` — Create
- `PATCH /api/payroll/runs/:id/process/` — Processo payroll
- `GET /api/payroll/documents/?payroll_run_id=...` — Documenti cedolini

#### Billing
- `GET /api/billing/status/` — Stato abbonamento
- `POST /api/billing/create-checkout-session/` — Stripe checkout (TODO)
- `PATCH /api/billing/cancel/` — Cancel subscription

#### Admin
- `GET /api/admin/companies/` — List companies (super_admin only)
- `GET /api/admin/analytics/` — Metriche piattaforma
- `GET /api/admin/audit-logs/` — Audit log globale
- `PATCH /api/admin/companies/:id/suspend/` — Sospendi azienda

---

## Struttura Backend Django (Esempio)

```
backend/
  ├─ manage.py
  ├─ requirements.txt
  ├─ config/
  │   ├─ settings.py
  │   ├─ urls.py
  │   └─ wsgi.py
  ├─ apps/
  │   ├─ auth/ (login, JWT)
  │   ├─ companies/ (Company CRUD)
  │   ├─ employees/ (Employee CRUD)
  │   ├─ attendance/ (Check-in, review)
  │   ├─ leave/ (Richieste ferie)
  │   ├─ documents/ (Upload, storage)
  │   ├─ payroll/ (Elaborazione cedolini)
  │   ├─ billing/ (Subscription, Stripe webhook)
  │   ├─ consultants/ (Link consultanti)
  │   └─ admin/ (Super admin features)
  ├─ core/
  │   ├─ models/ (SQLAlchemy o Django ORM)
  │   ├─ serializers/
  │   ├─ permissions/ (DRF custom permissions)
  │   ├─ pagination/
  │   └─ filters/
  └─ tests/
```

---

## Migrazione Step-by-Step

### Step 1: Finire Prototipo Base44 (questa settimana)
- ✅ Entità JSON definite
- ✅ Layer API centralizzato
- ✅ Hooks + Ruoli + Permessi
- [ ] Dashboard per ruolo
- [ ] CRUD Dipendenti
- [ ] Presenze
- [ ] Ferie
- [ ] Dati demo 5 aziende

### Step 2: Backup e Documentazione
- Esportare dati demo da Base44
- Documentare tutti gli endpoint futuri
- Documentare schema DB PostgreSQL

### Step 3: Setup Backend Python (Render/Railway)
- PostgreSQL database
- Django/FastAPI base setup
- Auth (JWT o cookies)
- CORS configuration

### Step 4: Migrare Entità → Models ORM
- Companies → Django Model
- Employees → Django Model
- Etc.

### Step 5: Implementare Endpoint API
- Batch per modulo (auth, employees, attendance, etc.)
- Testi automatizzati per ogni endpoint
- Documentazione Swagger/OpenAPI

### Step 6: Aggiornare Frontend (`src/api/client.js`)
- Cambiare implementazione da Base44 a fetch HTTP
- Nessun cambio nei componenti (grazie al layer API!)

### Step 7: Deploy e Testing
- Integration testing
- Load testing
- Production rollout

---

## Parti Mock che Diventano Reali

| Parte | Oggi (Base44) | Domani (Python) |
|---|---|---|
| Auth | Base44 SDK | Django auth + JWT |
| Data Storage | Base44 entities | PostgreSQL + ORM |
| File Upload | Base44 file API | S3 / Cloudflare R2 + signed URLs |
| Email | Mock console.log | Resend / SendGrid |
| Stripe Webhook | Mock | Backend reale |
| Audit Log | Entity Base44 | Tabella PostgreSQL + indexing |
| Permissions | Matrice hardcoded | DB-driven + caching |

---

## Checklist Migrazione

### Prototipo Base44 (Settimana 1)
- [ ] Tutte 15 entità JSON create
- [ ] Layer API client.js 100% coperto
- [ ] Hooks centralizzati (useAuth, useCurrentCompany, usePermissions)
- [ ] 5 dashboard per ruolo
- [ ] CRUD dipendenti con filtri
- [ ] Check-in/check-out e storico presenze
- [ ] Richiesta ferie e approvazione
- [ ] Caricamento documenti
- [ ] Cedolini mock
- [ ] 5 aziende demo + 50 dipendenti fake
- [ ] MIGRATION_PLAN.md completato

### Migrazione Backend (Settimana 2-3)
- [ ] PostgreSQL schema creato
- [ ] Django models corrispondenti
- [ ] Endpoint REST authentication
- [ ] CRUD employees
- [ ] CRUD attendance + day review
- [ ] CRUD leave requests + balance
- [ ] CRUD documents (upload S3)
- [ ] Payroll endpoint
- [ ] Stripe integration
- [ ] Audit logging middleware
- [ ] Documentazione API completa

### Finali
- [ ] Frontend client.js aggiornato a HTTP
- [ ] Zero cambi nei componenti
- [ ] Testing end-to-end
- [ ] Deploy Render/Railway
- [ ] Monitoraggio e logging
- [ ] Documentazione README

---

## Linee Guida per Sviluppo

### ✅ DA FARE
- Usare sempre `src/api/*` per operazioni dati
- Centralizzare logica business in `src/api/` e `src/lib/`
- Marcare con `// TODO MIGRATION:` le parti che cambieranno
- Separare UI da logica
- Componenti riutilizzabili
- Multi-tenancy sempre attiva (company_id obbligatorio)

### ❌ NON FARE
- Chiamare `base44.entities` direttamente da componenti
- Hardcodare logica di business in JSX
- Fare assunzioni su come dati vengono memorizzati
- Ignorare company_id nei filtri
- Mix di mock e reale
- Logica permessi sparsa nei componenti

---

## Contatti e Note

- **Stripe**: Test mode attivo con card 4242 4242 4242 4242
- **Storage**: Pronto per S3 / Cloudflare R2
- **Email**: Pronto per Resend / SendGrid
- **Monitoraggio**: Sentry / LogRocket per errori frontend
- **Backend Hosting**: Render.com o Railway.app
- **Database Hosting**: Render PostgreSQL o Neon

---

**Data creazione**: 2026-05-01
**Versione**: 0.1.0 (Prototipo Base44)
**Prossimo milestone**: Dashboard complete + 3 moduli core (Dipendenti, Presenze, Ferie)
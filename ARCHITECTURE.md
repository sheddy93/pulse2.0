# PulseHR - Documentazione Architettura

## Indice

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architettura Sistema](#architettura-sistema)
- [Database Schema](#database-schema)
- [Flow Applicativi](#flow-applicativi)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Scalabilità](#scalabilità)

---

## Overview

PulseHR è una piattaforma SaaS multi-tenant per la gestione HR di aziende e consulenti del lavoro.

**Caratteristiche chiave:**
- Multi-tenant architecture (Company + Consultant)
- Role-based access control (RBAC)
- RESTful API con Django REST Framework
- Modern frontend con Next.js 16 (React 19)
- Real-time notifications
- Document management con storage cloud
- Subscription & billing integration (Stripe)

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16.2.4 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 3.4
- **State Management:** React Context + hooks
- **HTTP Client:** Fetch API
- **UI Components:** Custom + shadcn/ui
- **Icons:** Lucide React
- **Testing:** Playwright

### Backend
- **Framework:** Django 6.0
- **API:** Django REST Framework 3.15
- **Authentication:** Token-based (Django REST Framework AuthToken)
- **Database:** SQLite (dev), PostgreSQL (production)
- **Task Queue:** Celery (planned)
- **Cache:** Redis (planned)
- **Storage:** Local (dev), S3-compatible (production)

### DevOps
- **Hosting Frontend:** Vercel
- **Hosting Backend:** Railway
- **Database:** Railway PostgreSQL
- **CI/CD:** Vercel + Railway auto-deploy
- **Monitoring:** Sentry (planned)

---

## Architettura Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  (Browser: Desktop + Mobile)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                         │
│                                                              │
│  Next.js 16 App Router                                       │
│  ├─ app/                    (Pages & Routes)                 │
│  ├─ components/             (React Components)               │
│  ├─ lib/                    (Utils, Helpers, API client)     │
│  └─ public/                 (Static assets)                  │
│                                                              │
│  Features:                                                   │
│  • Server-Side Rendering (SSR)                               │
│  • Static Generation                                         │
│  • Client-Side Rendering (CSR)                               │
│  • Edge Middleware (auth, redirects)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (HTTPS)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Railway)                          │
│                                                              │
│  Django 6 + Django REST Framework                            │
│  ├─ users/                  (User, Company, Consultant)      │
│  ├─ attendance/             (TimeEntry, Leave)               │
│  ├─ documents/              (Document management)            │
│  ├─ payroll/                (PayrollRun, Payslip)            │
│  ├─ notifications/          (Notification system)            │
│  ├─ automation/             (AutomationRule)                 │
│  └─ billing/                (Pricing, Stripe)                │
│                                                              │
│  Middleware:                                                 │
│  • Authentication (Token)                                    │
│  • CORS                                                      │
│  • Request logging (AuditLog)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (Railway PostgreSQL)               │
│                                                              │
│  Tables:                                                     │
│  ├─ User                    (utenti piattaforma)             │
│  ├─ Company                 (aziende clienti)                │
│  ├─ Consultant              (consulenti del lavoro)          │
│  ├─ UserCompanyAccess       (relazione user-company-role)    │
│  ├─ Role / Permission       (RBAC system)                    │
│  ├─ TimeEntry               (timbrature)                     │
│  ├─ LeaveRequest            (richieste ferie/permessi)       │
│  ├─ Document                (documenti HR)                   │
│  ├─ PayrollRun              (elaborazioni payroll)           │
│  ├─ Notification            (notifiche utenti)               │
│  ├─ AuditLog                (audit trail)                    │
│  └─ ... (altre tabelle)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Entities

#### User Model
```
User
├─ id (PK)
├─ email (unique)
├─ first_name
├─ last_name
├─ user_type (COMPANY_USER, CONSULTANT_USER, ADMIN)
├─ role_id (FK → Role)
├─ is_active
├─ email_verified
├─ created_at
└─ updated_at
```

#### Company Model
```
Company
├─ id (PK)
├─ public_id (UUID, unique)
├─ name
├─ vat_number
├─ industry
├─ size (SMALL, MEDIUM, LARGE)
├─ address_line_1, address_line_2, city, state, postal_code, country
├─ contact_email, contact_phone
├─ is_deleted, deleted_at
├─ onboarding_progress (JSON)
├─ subscription_tier (FK → PricingPlan)
├─ storage_used_bytes, storage_limit_bytes
├─ created_at
└─ updated_at
```

#### Consultant Model
```
Consultant
├─ id (PK)
├─ user_id (FK → User)
├─ company_name
├─ license_number
├─ specialization (LABOR, SAFETY)
├─ created_at
└─ updated_at
```

#### UserCompanyAccess (Multi-tenant Pivot)
```
UserCompanyAccess
├─ id (PK)
├─ user_id (FK → User)
├─ company_id (FK → Company)
├─ role_id (FK → Role)
├─ access_scope (OWN_ONLY, DEPARTMENT, ALL)
├─ status (ACTIVE, PENDING, SUSPENDED)
├─ created_at
└─ updated_at

**Unique Constraint:** (user_id, company_id)
```

### Attendance & Leave

#### TimeEntry
```
TimeEntry
├─ id (PK)
├─ user_id (FK → User)
├─ company_id (FK → Company)
├─ entry_type (CHECK_IN, CHECK_OUT)
├─ timestamp
├─ location (geolocation JSON)
├─ notes
├─ is_manual (boolean)
├─ created_by (FK → User, nullable)
└─ created_at
```

#### LeaveRequest
```
LeaveRequest
├─ id (PK)
├─ user_id (FK → User)
├─ company_id (FK → Company)
├─ leave_type (VACATION, SICK, PERSONAL)
├─ start_date
├─ end_date
├─ days_count
├─ reason
├─ status (PENDING, APPROVED, REJECTED)
├─ approved_by (FK → User, nullable)
├─ approved_at
├─ created_at
└─ updated_at
```

### Documents

#### Document
```
Document
├─ id (PK)
├─ company_id (FK → Company)
├─ title
├─ description
├─ file_url
├─ file_size_bytes
├─ category (CONTRACT, POLICY, PAYSLIP, OTHER)
├─ uploaded_by (FK → User)
├─ assigned_to (FK → User, nullable)
├─ confirmation_required (boolean)
├─ confirmed_at
├─ confirmed_by (FK → User, nullable)
├─ expiration_date (nullable)
├─ created_at
└─ updated_at
```

### Payroll

#### PayrollRun
```
PayrollRun
├─ id (PK)
├─ company_id (FK → Company)
├─ period_start
├─ period_end
├─ status (DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED)
├─ total_amount
├─ employee_count
├─ created_by (FK → User)
├─ created_at
└─ updated_at
```

#### Payslip
```
Payslip
├─ id (PK)
├─ payroll_run_id (FK → PayrollRun)
├─ employee_id (FK → User)
├─ gross_salary
├─ net_salary
├─ deductions (JSON)
├─ bonuses (JSON)
├─ file_url
├─ created_at
└─ updated_at
```

### Notifications & Automation

#### Notification
```
Notification
├─ id (PK)
├─ user_id (FK → User)
├─ company_id (FK → Company, nullable)
├─ notification_type (LEAVE_APPROVAL, DOC_ASSIGNMENT, TASK_REMINDER, ...)
├─ title
├─ message
├─ read (boolean)
├─ read_at
├─ action_url (nullable)
├─ created_at
└─ updated_at
```

#### AutomationRule
```
AutomationRule
├─ id (PK)
├─ company_id (FK → Company)
├─ rule_type (DOCUMENT_EXPIRY_REMINDER, LEAVE_AUTO_APPROVE, ...)
├─ trigger_config (JSON)
├─ action_config (JSON)
├─ is_active
├─ created_by (FK → User)
├─ created_at
└─ updated_at
```

### Billing & Subscription

#### PricingPlan
```
PricingPlan
├─ id (PK)
├─ name (Starter, Professional, Enterprise)
├─ tier_level (1, 2, 3)
├─ price_per_employee_monthly
├─ max_employees (nullable = unlimited)
├─ features (JSON)
├─ is_active
└─ created_at
```

#### StripeCustomer
```
StripeCustomer
├─ id (PK)
├─ company_id (FK → Company)
├─ stripe_customer_id
├─ stripe_subscription_id (nullable)
├─ subscription_status
├─ created_at
└─ updated_at
```

### Audit & Security

#### AuditLog
```
AuditLog
├─ id (PK)
├─ user_id (FK → User, nullable)
├─ company_id (FK → Company, nullable)
├─ action (USER_LOGIN, DOCUMENT_UPLOAD, LEAVE_APPROVED, ...)
├─ model_name
├─ object_id
├─ changes (JSON)
├─ ip_address
├─ user_agent
├─ timestamp
└─ created_at
```

### RBAC (Role-Based Access Control)

#### Role
```
Role
├─ id (PK)
├─ name (OWNER, ADMIN, HR_MANAGER, MANAGER, EMPLOYEE, ...)
├─ description
├─ is_system_role (boolean)
└─ created_at
```

#### Permission
```
Permission
├─ id (PK)
├─ name (view_employees, manage_payroll, approve_leave, ...)
├─ resource_type (USER, COMPANY, DOCUMENT, ...)
├─ action (VIEW, CREATE, UPDATE, DELETE, APPROVE, ...)
└─ created_at
```

#### RolePermission (M2M)
```
RolePermission
├─ role_id (FK → Role)
└─ permission_id (FK → Permission)
```

---

## Flow Applicativi

### 1. User Authentication Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ 1. POST /api/auth/login
     │    { email, password }
     ▼
┌────────────┐
│   Backend  │
│            │
│ 2. Validate credentials
│    ├─ Check User exists
│    ├─ Verify password
│    └─ User is_active = True
│            │
│ 3. Generate Token
│    └─ Token.objects.create(user=user)
│            │
│ 4. Return response
│    { token, user: {...} }
└────┬────┘
     │
     │ 5. Store token (localStorage/cookie)
     ▼
┌─────────┐
│ Browser │ → Token stored, redirect to /dashboard
└─────────┘
```

### 2. Leave Request Workflow

```
┌─────────────┐
│  Employee   │
└──────┬──────┘
       │
       │ 1. Submit leave request
       │    POST /api/leave/requests/
       ▼
┌────────────────┐
│    Backend     │
│                │
│ 2. Create LeaveRequest
│    ├─ status = PENDING
│    ├─ Calculate days_count
│    └─ Save to DB
│                │
│ 3. Create Notification
│    ├─ Send to Manager(s)
│    └─ type = LEAVE_APPROVAL
└────────┬────────┘
         │
         │ 4. Notify Manager
         ▼
┌───────────────┐
│    Manager    │
└───────┬───────┘
        │
        │ 5. Review request
        │    PATCH /api/leave/requests/{id}/
        │    { status: "APPROVED" }
        ▼
┌────────────────┐
│    Backend     │
│                │
│ 6. Update LeaveRequest
│    ├─ status = APPROVED
│    ├─ approved_by = manager
│    └─ approved_at = now()
│                │
│ 7. Create Notification
│    ├─ Send to Employee
│    └─ type = LEAVE_DECISION
│                │
│ 8. AuditLog entry
│    └─ action = LEAVE_APPROVED
└────────┬────────┘
         │
         │ 9. Notify Employee
         ▼
┌─────────────┐
│  Employee   │ → Request approved ✅
└─────────────┘
```

### 3. Document Assignment Flow

```
┌──────────┐
│ HR Admin │
└────┬─────┘
     │
     │ 1. Upload document
     │    POST /api/documents/
     │    (multipart/form-data)
     ▼
┌────────────────┐
│    Backend     │
│                │
│ 2. Validate file
│    ├─ Check file type
│    ├─ Check storage limit
│    └─ Virus scan (if enabled)
│                │
│ 3. Store file
│    └─ Save to S3/local storage
│                │
│ 4. Create Document record
│    ├─ file_url = uploaded URL
│    ├─ assigned_to = employee_id
│    └─ confirmation_required = True
│                │
│ 5. Create Notification
│    ├─ Send to assigned employee
│    └─ type = DOC_ASSIGNMENT
│                │
│ 6. Update storage_used_bytes
│    └─ Company.storage_used_bytes += file_size
└────────┬────────┘
         │
         │ 7. Notify Employee
         ▼
┌──────────────┐
│   Employee   │
└──────┬───────┘
       │
       │ 8. View & confirm document
       │    PATCH /api/documents/{id}/confirm/
       ▼
┌────────────────┐
│    Backend     │
│                │
│ 9. Update Document
│    ├─ confirmed_by = employee
│    └─ confirmed_at = now()
│                │
│ 10. AuditLog entry
│     └─ action = DOCUMENT_CONFIRMED
└────────────────┘
```

### 4. Time Entry (Check-in/Check-out) Flow

```
┌──────────────┐
│   Employee   │ (Mobile/Desktop)
└──────┬───────┘
       │
       │ 1. Tap "Check-in" button
       │    POST /api/attendance/check-in/
       │    { location: { lat, lng } }
       ▼
┌────────────────┐
│    Backend     │
│                │
│ 2. Validate request
│    ├─ User has active company access
│    ├─ No duplicate check-in
│    └─ Geofence validation (if enabled)
│                │
│ 3. Create TimeEntry
│    ├─ entry_type = CHECK_IN
│    ├─ timestamp = now()
│    └─ location = { lat, lng }
│                │
│ 4. Check AutomationRules
│    └─ Trigger any configured rules
│                │
│ 5. Return response
│    { success: true, entry: {...} }
└────────────────┘

... (8 hours later) ...

┌──────────────┐
│   Employee   │
└──────┬───────┘
       │
       │ 6. Tap "Check-out" button
       │    POST /api/attendance/check-out/
       ▼
┌────────────────┐
│    Backend     │
│                │
│ 7. Create TimeEntry
│    ├─ entry_type = CHECK_OUT
│    └─ Calculate hours worked
│                │
│ 8. Daily summary
│    └─ Generate report (if end of shift)
└────────────────┘
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login utente |
| POST | `/api/auth/logout/` | Logout (invalida token) |
| POST | `/api/auth/register/` | Registrazione utente |
| POST | `/api/auth/password-reset/` | Richiesta reset password |
| POST | `/api/auth/verify-email/` | Verifica email |

### Users & Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/` | Profilo utente corrente |
| PATCH | `/api/users/me/` | Aggiorna profilo |
| GET | `/api/companies/` | Lista aziende (accesso utente) |
| POST | `/api/companies/` | Crea nuova azienda |
| GET | `/api/companies/{id}/` | Dettaglio azienda |
| PATCH | `/api/companies/{id}/` | Aggiorna azienda |
| GET | `/api/companies/{id}/employees/` | Lista dipendenti |
| POST | `/api/companies/{id}/employees/` | Aggiungi dipendente |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/check-in/` | Check-in |
| POST | `/api/attendance/check-out/` | Check-out |
| GET | `/api/attendance/entries/` | Lista timbrature |
| GET | `/api/attendance/summary/` | Report riepilogativo |

### Leave Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave/requests/` | Lista richieste ferie |
| POST | `/api/leave/requests/` | Crea richiesta |
| GET | `/api/leave/requests/{id}/` | Dettaglio richiesta |
| PATCH | `/api/leave/requests/{id}/` | Approva/Rifiuta |
| GET | `/api/leave/balance/` | Saldo ferie dipendente |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/` | Lista documenti |
| POST | `/api/documents/` | Upload documento |
| GET | `/api/documents/{id}/` | Dettaglio documento |
| PATCH | `/api/documents/{id}/confirm/` | Conferma lettura |
| DELETE | `/api/documents/{id}/` | Elimina documento |

### Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/runs/` | Lista elaborazioni |
| POST | `/api/payroll/runs/` | Crea elaborazione |
| GET | `/api/payroll/runs/{id}/` | Dettaglio elaborazione |
| GET | `/api/payroll/payslips/` | Lista cedolini dipendente |
| GET | `/api/payroll/payslips/{id}/` | Dettaglio cedolino |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/` | Lista notifiche |
| PATCH | `/api/notifications/{id}/read/` | Segna come letta |
| POST | `/api/notifications/mark-all-read/` | Segna tutte lette |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/companies/` | Tutte le aziende (solo admin) |
| GET | `/api/admin/analytics/` | Analytics piattaforma |
| GET | `/api/admin/pricing-plans/` | Piani tariffari |

---

## Security

### Authentication & Authorization

1. **Token-Based Auth:**
   - Django REST Framework AuthToken
   - Token in header: `Authorization: Token <token>`
   - Token expire: configurable (default: no expiration, considera JWT per expire automatico)

2. **RBAC (Role-Based Access Control):**
   - Ogni utente ha un `Role` con specifici `Permission`
   - Permission check su ogni endpoint
   - Access scope: `OWN_ONLY`, `DEPARTMENT`, `ALL`

3. **Multi-Tenant Isolation:**
   - Ogni query filtra per `company_id`
   - `UserCompanyAccess` garantisce che gli utenti vedano solo i dati delle proprie aziende
   - Consultant può accedere a più aziende (relazioni M2M)

### Data Protection

1. **HTTPS Everywhere:**
   - Frontend: Vercel con SSL automatico
   - Backend: Railway con SSL
   - API comunicazione sempre HTTPS

2. **GDPR Compliance:**
   - Soft delete: `is_deleted`, `deleted_at`
   - Audit trail: `AuditLog` traccia ogni modifica
   - Data export: endpoint `/api/users/me/export-data/`
   - Data deletion: endpoint `/api/users/me/delete-account/`

3. **File Upload Security:**
   - File type validation
   - File size limits per subscription tier
   - Virus scanning (integrazione ClamAV consigliata)
   - Signed URLs per download (S3 pre-signed URLs)

4. **Environment Variables:**
   - Secrets in `.env` (never committed)
   - `.env.example` for documentation
   - Production secrets in Railway/Vercel UI

---

## Scalabilità

### Current Architecture (MVP)

- **Frontend:** Vercel serverless (auto-scaling)
- **Backend:** Railway single instance
- **Database:** Railway PostgreSQL (shared)
- **Storage:** Local filesystem (dev) / S3 (prod)

### Future Scaling (Production)

#### Backend Horizontal Scaling

```
┌──────────────────────────────────────────┐
│         Load Balancer (Railway)          │
└───────────┬─────────┬────────────────────┘
            │         │
      ┌─────▼───┐ ┌──▼──────┐
      │ Django  │ │ Django  │  (Multiple instances)
      │ App 1   │ │ App 2   │
      └────┬────┘ └────┬────┘
           │           │
           └─────┬─────┘
                 ▼
        ┌────────────────┐
        │   PostgreSQL   │ (Managed DB)
        └────────────────┘
```

#### Caching Strategy

```
Browser → CDN (Vercel) → Frontend (Next.js)
                              ↓
                          API Gateway
                              ↓
                       ┌──────────┐
                       │  Redis   │ (Cache Layer)
                       └────┬─────┘
                            │ Cache miss
                            ▼
                       ┌──────────┐
                       │ Django   │
                       └────┬─────┘
                            ▼
                       ┌──────────┐
                       │PostgreSQL│
                       └──────────┘
```

#### Task Queue (Celery)

Per operazioni async:
- Invio email massivo
- Generazione report PDF
- Export dati
- Notifiche push

```
Django → Celery → Redis (broker) → Celery Workers
                                         │
                                         ▼
                                    (Background tasks)
```

#### Database Optimization

- **Read Replicas:** Per query di lettura (report, analytics)
- **Partitioning:** Tabelle grandi (TimeEntry, AuditLog) partizionate per data
- **Indexing:** Index su colonne frequently queried (user_id, company_id, timestamp)
- **Connection Pooling:** PgBouncer per gestire connessioni DB

#### File Storage Scaling

- **CDN:** CloudFlare o Vercel Edge per servire file statici
- **S3-compatible storage:** MinIO (self-hosted) o AWS S3
- **Lazy loading:** Carica file solo quando richiesti
- **Compression:** Comprimi PDF e immagini

---

## Monitoring & Observability (Future)

### Recommended Tools

- **Error Tracking:** Sentry
- **APM:** New Relic o DataDog
- **Logs:** LogDNA, Papertrail
- **Uptime:** UptimeRobot, Pingdom
- **Analytics:** PostHog, Mixpanel

### Metrics to Track

- API response time (p50, p95, p99)
- Error rate per endpoint
- Active users (DAU, MAU)
- Database query performance
- Storage usage per company
- Subscription churn rate

---

## Conclusione

Questa architettura supporta:
- ✅ Multi-tenancy sicuro
- ✅ Role-based access control
- ✅ Scalabilità orizzontale (con modifiche future)
- ✅ GDPR compliance
- ✅ Audit trail completo
- ✅ Modern stack (Next.js 16 + Django 6)

Per domande o contributi, vedi [CONTRIBUTING.md](./CONTRIBUTING.md).

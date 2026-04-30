# Changelog - PulseHR

Tutti i cambiamenti significativi di questo progetto sono documentati in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce semanticamente a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-04-26 - Closed Beta Stability Fix

### 🔒 Fixed - Critical Bugs

#### FASE 1: Setup Branch & Baseline
- Creato branch dedicato `fix/critical-stability-closed-beta`
- Verificato build frontend passa (20 static routes)
- Verificato backend check passa (0 issue)
- Aggiornato .gitignore con protezioni complete

#### FASE 2: API Path Standardization
- Rimosso prefisso duplicato `/api/` da tutti i path
- Strategia: URL base contiene `/api`, endpoint usano path relativi
- Eliminato rischio `/api/api/` completamente
- File modificati: `frontend/.env.example`, `frontend/lib/api.ts`

#### FASE 3: Auth/Register/Login
- Company registration: payload verificato, password hashata, no temp password
- Consultant registration: role mapping corretto
- Login: ora ritorna token, user, redirect_url
- Redirect per ruolo implementato (9 ruoli mappati)
- Error handling in italiano

#### FASE 4: CompanyViewSet Bug Fix
- Bug: `CompanyViewSet.create` faceva unpack di 3 valori, service ritorna 2
- Corretto: `company, company_admin = serializer.save()`
- Rimossa generazione temporary_password dal self-service

#### FASE 5: Automation Service Verified
- `notrule` non trovato (già corretto)
- Campo Task usa `assigned_to` (corretto)
- Tutti i 5 trigger verificati
- AutomationRule e Task model verificati

### 🎨 Fixed - UI/UX

#### FASE 6: Mock Data Removed
- 4 dashboard riscritte con API reali
- Loading/Error/Empty states implementati
- Nessun mock silenzioso
- File: admin, company, employee, consultant dashboard

#### FASE 7: Real Clock-in/out
- 5 endpoint backend verificati (check-in, check-out, breaks)
- Frontend chiama API reale (nessun setTimeout)
- Mobile one-tap (80px button, above fold)
- Error handling con retry

#### FASE 8: Task-Driven Dashboards
- **Company**: "Centro Operativo HR" con KPI cards + quick actions
- **Consultant**: "Client Operations Center" con company switcher
- **Admin**: "Platform Health Center" con system health
- Tutte con empty states guidati e CTA

#### FASE 9: AI Rebrand
- 8 file modificati
- "PulseHR AI" → "Assistente Operativo PulseHR"
- "AI Predittiva" → "Automazioni HR"
- Claim AI rimossi ovunque

#### FASE 10: Landing Page Credibility
- Numeri fake rimossi (99.9% SLA, 4.9/5 rating, etc.)
- "GDPR compliant" → "GDPR-ready"
- Link morti rimossi (social placeholders, href="#")
- Logo click behavior corretto

### ✅ Added - Tests

#### FASE 11: Real Backend & E2E Tests
- `test_documents.py` creato (8 test document workflow)
- `test_documents.py` creato (2 test security tenant isolation)
- E2E `critical-workflows.spec.ts` creato (11 test critical flows)
- Helper `test-helpers.ts` creato
- Test esistenti verificati (no placeholder, no assertTrue(True))

### 🚀 Added - Deploy Readiness

#### FASE 12: Vercel/Railway Configuration
- Deploy frontend Vercel: workflow aggiornato
- Deploy backend Railway: workflow verificato
- CORS configurato per URL specifico (no wildcard)
- Environment variables corretti in .env.example
- GitHub Secrets da configurare documentati

### 📝 Documentation

- README.md aggiornato con tutte le feature
- CHANGELOG.md completo
- Report finale M2.7

---

## [2.0.0] - 2026-04-26 - Major Release: Security & DevOps Overhaul

### 🎉 Added

#### Sicurezza - Token HttpOnly Cookies
- Nuovo file `backend/users/cookie_auth.py` - Middleware autenticazione cookie
- Configurazione cookie sicuri in `settings.py`:
  - `AUTH_COOKIE_NAME`
  - `AUTH_COOKIE_AGE`
  - HttpOnly, Secure, SameSite flags
- API client aggiornato per leggere token da cookie

#### Email System
- Nuovo file `backend/users/email_utils.py` - Helper per invio email
- Template email HTML in `backend/users/templates/users/emails/`:
  - `verify_email.html` - Verifica email
  - `password_reset.html` - Reset password
  - `welcome.html` - Email benvenuto
  - `leave_request_notification.html` - Notifica richieste ferie

#### Docker & Containerizzazione
- `docker-compose.yml` - Orchestra PostgreSQL, Redis, Backend, Frontend
- `Makefile` - 20+ comandi utili per container management
- `.env.docker` - Template environment per sviluppo locale
- `backend/Dockerfile` - Python 3.12 multi-stage production build
- `frontend/Dockerfile` - Node 20 multi-stage production build
- `.dockerignore` (root, backend, frontend)

#### CI/CD GitHub Actions
- `.github/workflows/ci.yml` - Pipeline test completa
- `.github/workflows/deploy-frontend.yml` - Deploy Vercel
- `.github/workflows/deploy-backend.yml` - Deploy Railway
- `.github/workflows/docker-build.yml` - Docker build & push
- `.github/ISSUE_TEMPLATE/bug_report.yml` - Template bug report
- `.github/ISSUE_TEMPLATE/feature_request.yml` - Template feature request
- `.github/PULL_REQUEST_TEMPLATE.md` - Template PR
- `.github/dependabot.yml` - Aggiornamento automatico dipendenze

#### Backend Modulare
- Nuovo package `backend/users/models/` con modelli organizzati:
  - `_base.py` - BaseModel, SoftDeleteModel, TimestampedModel
  - `_choices.py` - 47+ TextChoices enumerations
  - `company.py` - Company, Department, OfficeLocation
  - `users.py` - User, UserCompanyAccess
  - `roles.py` - Role, Permission, CompanyRole
  - `employee.py` - EmployeeProfile, Consultant, ConsultantCompanyLink
  - `attendance.py` - TimeEntry, AttendanceDayReview, GeoLocation
  - `leave.py` - LeaveRequest, LeaveBalance
  - `documents.py` - Document
  - `payroll.py` - PayrollRun, Payslip, PayrollDocumentLink
  - `notifications.py` - Notification, UserDeviceToken
  - `billing.py` - StripeCustomer, StripeEvent, PricingPlan
  - `automation.py` - AutomationRule, Task
  - `safety.py` - SafetyCourse, EmployeeTraining, SafetyIncident
  - `medical.py` - MedicalCertificate
  - `audit.py` - AuditLog
  - `onboarding.py` - OnboardingProgress
  - `signature.py` - SignatureRequest
  - `sso.py` - SSOProvider, SSOSession
  - `signals.py` - Django signal handlers

#### Frontend TypeScript Migration
- Nuovo package `frontend/types/`:
  - `index.ts` - Export aggregato
  - `api.ts` - API types (User, Company, Leave, etc.)
  - `components.ts` - Component props types
  - `auth.d.ts` - Auth & session types
- `frontend/lib/api.ts` - Riscritto completamente in TypeScript
- `frontend/components/auth-guard.tsx` - Componente tipizzato
- `frontend/tsconfig.json` - Aggiornato per TypeScript
- `frontend/tsconfig.strict.json` - Strict mode configuration

#### Landing Page Redesign
- Nuovi componenti in `frontend/components/landing/`:
  - `HeroSection.tsx` - Hero con animazioni
  - `DashboardPreview.tsx` - Preview tabbed dashboard
  - `FeaturesSection.tsx` - Feature cards animate
  - `StatsSection.tsx` - Stats reali (no fake)
  - `PricingSection.tsx` - Pricing con toggle mensile/annuale
  - `HowItWorksSection.tsx` - 3-step guide
  - `TestimonialsSection.tsx` - Placeholder elegante
  - `FAQSection.tsx` - Accordion FAQ
  - `FinalCTASection.tsx` - CTA finale
  - `Footer.tsx` - Footer professionale
  - `index.ts` - Export aggregato

### 🔄 Changed

#### Backend
- `backend/users/views.py` - Cookie authentication, SMTP integration
- `backend/backend/settings.py` - SMTP config, cookie settings, Docker support
- `backend/users/models.py` - Re-export da nuova struttura modulare
- `backend/.env.example` - Aggiornato con tutte le variabili

#### Frontend
- `frontend/app/page.tsx` - Nuova landing page
- `frontend/app/login/page.jsx` - Nuova pagina login
- `frontend/components/auth-guard.js` - Aggiornato per cookie auth
- `frontend/components/ui/card.jsx` - Migliorato supporto
- `frontend/components/ui/progress.tsx` - Nuovo componente
- `frontend/package.json` - Aggiunti @types packages
- `frontend/next.config.mjs` - Output standalone per Docker
- `frontend/tailwind.config.ts` - Dark mode fix
- `frontend/package-lock.json` - Aggiornato

### 🔒 Security Improvements

- ✅ Token spostato da localStorage a HttpOnly cookies
- ✅ CSRF protection migliorata
- ✅ Rate limiting su tutti gli endpoint sensibili
- ✅ Secure/SameSite flags sui cookie
- ✅ Password validators attivi

### 📚 Documentation

- README.md completamente riscritto con:
  - Feature complete documentate
  - Screenshots placeholder
  - Quick start con Docker
  - Environment variables complete
  - API endpoints reference
  - Deployment guide

---

## [1.0.0] - Prima Release

### 🎉 Initial Release

- Sistema SaaS HR base completo
- Gestione presenze (check-in/check-out)
- Workflow ferie e permessi
- Document management
- Multi-tenancy (Aziende + Consulenti)
- Sistema RBAC con10+ ruoli
- Stripe billing integration
- SAML/SSO predisposto
- GDPR compliance base

---

## Come Contribuire

1. Fork il repository
2. Crea un branch per la feature (`git checkout -b feature/amazing-feature`)
3. Commit le modifiche (`git commit -m 'feat: add amazing feature'`)
4. Push sul branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## Versioning

Usiamo [SemVer](http://semver.org/) per il versioning.

## Autori

- **PulseHR Team** - Initial work

## License

Questo progetto è sotto licenza MIT - vedi il file [LICENSE](LICENSE) per dettagli.

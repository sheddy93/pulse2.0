# Migration Plan: Base44 → React/Vite + NestJS/PostgreSQL

**Status**: Planning Phase (Architectural Setup Complete)  
**Target Launch**: Q4 2024  
**Estimated Duration**: 3-4 months

---

## 📋 Executive Summary

AldevionHR è attualmente un'applicazione monolitica su Base44 (backend-as-a-service). Questa migrazione separa completamente frontend e backend in due applicazioni indipendenti:

- **Frontend**: React 18 + Vite + TypeScript + Tailwind (deploy su Vercel)
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL (deploy su Render/Railway)
- **Storage**: Cloudflare R2 o AWS S3 per documenti HR
- **Payments**: Stripe (server-side only)
- **Email**: Resend o SendGrid (server-side only)
- **AI**: Gemini/OpenAI/Anthropic (server-side only)

---

## 🎯 Fasi Migrazione

### Fase 1: Setup Architettura Frontend (CURRENT - In Progress)

**Obiettivo**: Preparare codebase React per essere indipendente da Base44

**Attività**:
- ✅ Creare API layer centralizzato (`src/api/`)
  - ✅ Base44 Adapter (current)
  - ✅ REST Adapter (future)
- ✅ Creare Service layer (`src/services/`)
- ✅ Creare Mapper layer (`src/mappers/`)
- ✅ Centralizzare Roles & Permissions (`src/lib/`)
- ❌ Refactor tutte le pagine (in progress)
  - ❌ Nessuna pagina deve importare Base44 direttamente
  - ❌ Tutte le chiamate via API layer
- ❌ Creare custom hooks (`src/hooks/`)
- ❌ Aggiungere feature flags per migrazione
- ❌ Documentare API contract completo

**Timeline**: 2-3 settimane

---

### Fase 2: Setup Backend NestJS

**Obiettivo**: Creare backend Node.js/NestJS strutturato e pronto

**Attività**:
- Inizializzare repo NestJS
- Installare dipendenze principali:
  - Prisma ORM
  - TypeORM (alternativa)
  - class-validator
  - @nestjs/passport / JWT
  - @nestjs/stripe
  - bull (job queue)
  - winston (logging)
  - sentry (error tracking)
- Creare struttura moduli:
  - `src/auth/` - autenticazione
  - `src/companies/` - aziende
  - `src/employees/` - dipendenti
  - `src/departments/` - dipartimenti
  - `src/attendance/` - presenze
  - `src/leave/` - ferie
  - `src/documents/` - documenti
  - `src/payroll/` - buste paga
  - `src/billing/` - abbonamenti
  - `src/notifications/` - notifiche
  - `src/jobs/` - background jobs
  - `src/storage/` - integrazione S3/R2
  - `src/email/` - invio email
  - `src/ai/` - AI integration
  - `src/admin/` - admin panel
  - `src/common/` - shared utilities
- Creare schema Prisma
- Setup PostgreSQL (locale + production)
- Creare migrations
- Implementare autenticazione JWT
- Implementare RBAC guards

**Timeline**: 3-4 settimane

---

### Fase 3: Migrazione Moduli (Iterative)

Per ogni modulo:

1. **Implementa backend NestJS**
   - Controller + Service + DTO + Guard
   - Endpoint REST completo
   - Validazione input
   - Error handling

2. **Aggiorna frontend adapter**
   - Cambia restAdapter per quel modulo
   - Test con feature flag

3. **Test E2E**
   - Frontend con nuovo backend
   - Test su tutti i ruoli

4. **Deploy fase**
   - Deploy backend a staging
   - Deploy frontend con feature flag (0% traffic)
   - Monitoraggio
   - Rollout graduale (10% → 50% → 100%)

**Ordine Moduli** (priorità):
1. Companies & Employees (core)
2. Attendance (critical business logic)
3. Leave (workflow)
4. Documents (storage migration)
5. Payroll (complex)
6. Billing & Stripe (revenue)
7. Notifications (async jobs)
8. AI & Admin (optional first)

**Timeline**: 8-12 settimane (parallelizzato)

---

### Fase 4: Cleanup & Production

**Attività**:
- Rimozione completamente Base44 SDK
- Cleanup imports
- Ottimizzazione performance
- Security hardening
- Load testing
- Penetration testing
- Documentation
- Team training

**Timeline**: 2-3 settimane

---

## 🏗️ Struttura Target Finale

### Frontend (Vercel)

```
aldevionhr-frontend/
├── src/
│   ├── api/              # API layer (adapter pattern)
│   │   ├── client.ts     # Client universale
│   │   ├── adapters/     # base44Adapter, restAdapter
│   │   ├── companiesApi.ts
│   │   ├── employeesApi.ts
│   │   ├── attendanceApi.ts
│   │   └── ...
│   │
│   ├── services/         # Business logic
│   │   ├── employeeService.ts
│   │   ├── attendanceService.ts
│   │   ├── permissionService.ts
│   │   └── ...
│   │
│   ├── mappers/          # Data transformation
│   │   ├── employeeMapper.ts
│   │   ├── attendanceMapper.ts
│   │   └── ...
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useEmployees.ts
│   │   └── ...
│   │
│   ├── lib/              # Utilities
│   │   ├── permissions.ts
│   │   ├── roles.ts
│   │   ├── constants.ts
│   │   └── featureFlags.ts
│   │
│   ├── pages/            # React pages
│   ├── components/       # Reusable components
│   └── App.jsx           # Router
│
├── .env
├── vite.config.ts
└── vercel.json
```

**Environment Variables**:
```
VITE_API_MODE=rest                    # 'base44' | 'rest'
VITE_API_BASE_URL=https://api.aldevionhr.com/api
VITE_APP_ENV=production               # development | staging | production
VITE_SENTRY_DSN=...
VITE_STRIPE_PUBLISHABLE_KEY=...       # Public key solo per client-side validation
```

---

### Backend (Render/Railway)

```
aldevionhr-backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── ...
│   │
│   ├── companies/
│   │   ├── companies.controller.ts
│   │   ├── companies.service.ts
│   │   ├── dto/create-company.dto.ts
│   │   └── ...
│   │
│   ├── employees/
│   │   └── ... (stessa struttura)
│   │
│   ├── attendance/
│   │   └── ...
│   │
│   ├── common/
│   │   ├── guards/       # RBAC, JwtGuard, etc
│   │   ├── pipes/        # Validazione
│   │   ├── filters/      # Exception handling
│   │   ├── decorators/   # @IsAdmin, @RequiresPermission, etc
│   │   └── middleware/   # Logging, tenant isolation
│   │
│   ├── jobs/             # BullMQ workers
│   │   ├── email.job.ts
│   │   ├── report.job.ts
│   │   └── ...
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── main.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── .env
├── docker-compose.yml
├── Dockerfile
└── package.json
```

**Environment Variables**:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://host:6379
JWT_SECRET=...
JWT_EXPIRATION=24h
COOKIE_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=aldevionhr-documents
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
RESEND_API_KEY=...
SENTRY_DSN=...
FRONTEND_URL=https://aldevionhr.com
CORS_ALLOWED_ORIGINS=https://aldevionhr.com,https://app.aldevionhr.com
```

---

## 📊 Dimensioni Progetto Stimate

### Frontend
- **File**: ~200 (pages, components, api, services, hooks, lib)
- **LOC**: ~30,000
- **Dependencies**: ~50
- **Bundle size**: ~500KB (gzipped)

### Backend
- **Files**: ~150 (controllers, services, entities, dtos)
- **LOC**: ~40,000
- **Dependencies**: ~80
- **Database tables**: ~25

### Database Schema
- **Tables**: ~25
- **Indexes**: ~40
- **Foreign keys**: ~30

---

## 🚀 Rollout Strategy

### Feature Flags
```typescript
// Frontend: feature flag per modulo
const apiMode = import.meta.env.VITE_API_MODE || 'base44';

if (apiMode === 'rest') {
  // Usa nuovo backend NestJS
  use employeesApi.listEmployees();
} else {
  // Continua con Base44
  use base44.entities.EmployeeProfile.list();
}
```

### Gradual Traffic Shift
```
Day 1-7:   0% traffic (internal testing)
Day 8-14:  10% traffic (power users)
Day 15-21: 50% traffic (monitoring)
Day 22+:   100% traffic (full migration)
```

### Monitoring
- Sentry error tracking
- DataDog/New Relic APM
- CloudFlare Analytics
- Stripe webhook logs

---

## 🔒 Data Migration

### Strategy
1. Backend NestJS in production (standby)
2. Frontend continua a usare Base44
3. Cron job sincronizza dati Base44 → PostgreSQL ogni notte
4. Quando synced 100%, switch feature flag
5. Dopo 7 giorni di stabilità, decommission Base44

### Backup
```bash
# Pre-migration
pg_dump aldevionhr_new > backup_pre_switch.sql

# Post-switch (mantenere 30 giorni)
pg_dump aldevionhr_new > backup_post_switch.sql
```

---

## 💰 Cost Estimation

### Attuale (Base44)
- Base44 subscription: ~$500/mese
- Stripe fees: ~2-3% su revenue

### Nuovo (Post-Migration)
- **Vercel Frontend**: $20-50/mese
- **Render/Railway Backend**: $50-150/mese
- **PostgreSQL**: $15-50/mese
- **Redis**: $5-20/mese
- **Cloudflare R2 Storage**: $0.01/GB (vs Base44 storage)
- **Resend Email**: $0.0005 per email
- **Sentry**: $50/mese (error tracking)
- **Total**: ~$140-320/mese

**ROI**: Break-even in ~2-3 mesi, poi savings di ~60-70%

---

## ⚠️ Rischi e Mitigazione

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|------------|--------|------------|
| Database corruption | Bassa | Alto | Backup giornalieri, WAL archiving |
| API incompatibility | Media | Medio | Integration tests, gradual rollout |
| Performance degradation | Media | Medio | Load testing, monitoring alerts |
| User disruption | Bassa | Alto | Feature flags, instant rollback |
| Data loss | Molto bassa | Critico | 3-tier backups, transaction logs |

---

## 📅 Timeline Totale

```
Settimana 1-3:   Setup architettura frontend ✅
Settimana 4-7:   Setup backend NestJS
Settimana 8-15:  Migrazione core moduli (Companies, Employees, Attendance)
Settimana 16-20: Migrazione moduli secondari
Settimana 21-22: Testing, documentation, training
Settimana 23-24: Go-live, monitoring

TOTALE: ~24 settimane (6 mesi)
```

---

## 📞 Team & Responsibilities

- **Frontend Lead**: Architecture, API layer, component refactor
- **Backend Lead**: NestJS setup, database design, API development
- **DevOps**: Infrastructure, deployment, monitoring
- **QA**: Testing, integration tests, UAT
- **Product**: Feature flags, rollout strategy, communication

---

## ✅ Success Criteria

- ✅ Zero data loss durante migrazione
- ✅ <1% increase in latency post-migration
- ✅ 100% feature parity con Base44
- ✅ All tests passing (>90% coverage)
- ✅ No critical bugs nelle prime 2 settimane
- ✅ Cost reduction di ≥50%
- ✅ Team able to develop independently of Base44

---

**Version**: 1.0  
**Last Updated**: 2026-05-01  
**Status**: Planning → In Progress
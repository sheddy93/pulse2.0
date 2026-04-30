# PulseHR - Enterprise HR Management Platform

![PulseHR](https://img.shields.io/badge/PulseHR-HR%20SaaS-2563EB?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Django](https://img.shields.io/badge/Django-6-green?style=flat-square&logo=django)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

> Sistema SaaS HR completo per aziende e consulenti del lavoro italiani. Gestisci presenze, ferie, documenti, payroll e compliance GDPR in un'unica piattaforma moderna.

## 🎯 Feature Completate (v2.0)

### ✅ Sicurezza Avanzata
- **Token HttpOnly Cookies** - Autenticazione sicura senza vulnerabilità XSS
- **CSRF Protection** - Protezione integrata contro attacchi CSRF
- **Rate Limiting** - Protezione brute force su login/registrazione
- **GDPR-ready** - Soft delete, audit trail, data export, gestione consenso

### ✅ Email & Notifiche
- **SMTP SendGrid** - Configurazione completa per produzione
- **Template Email HTML** - Verifica email, reset password, benvenuto, notifiche ferie
- **Notifiche Push** - Firebase Cloud Messaging configurato

### ✅ Containerizzazione & DevOps
- **Docker Compose** - PostgreSQL, Redis, Backend, Frontend
- **Dockerfiles ottimizzati** - Multi-stage build per produzione
- **Makefile** - 20+ comandi utili per container management

### ✅ CI/CD Automation
- **GitHub Actions** - Pipeline CI completa (test, lint, build)
- **Deploy Automation** - Vercel (frontend) + Railway (backend)
- **Dependabot** - Aggiornamento automatico dipendenze settimanale
- **Pull Request Templates** - Standardizzati per contribution

### ✅ Backend Modulare
- **Split Models** - 40+ modelli organizzati per dominio
- **Services Layer** - Logica business separata dalle views
- **TypeScript Types** - API types completi per frontend

### ✅ Frontend TypeScript
- **API Client** - Riscritto in TypeScript con type safety
- **Auth Guard** - Componente React tipizzato
- **Component Types** - Props definitions complete

## 📸 Screenshots

> TODO: Aggiungere screenshot delle dashboard reali
>
> Per aggiungere screenshots:
> 1. Salva screenshot in `/public/screenshots/`
> 2. Nomi consigliati: `admin-dashboard.png`, `employee-view.png`, `manager-dashboard.png`

## 🏗️ Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| **Frontend Framework** | Next.js | 16.2.4 |
| **UI Library** | React | 19.2.5 |
| **Styling** | Tailwind CSS | 4.2.2 |
| **State Management** | React Context + SWR | 2.4.1 |
| **Backend Framework** | Django | 6.0.4 |
| **API Layer** | Django REST Framework | 3.17.1 |
| **Database** | PostgreSQL | 16 (prod) / SQLite (dev) |
| **Cache** | Redis | 7 |
| **Billing** | Stripe | 10.x |
| **Error Tracking** | Sentry | 2.0 |

## 📁 Struttura Progetto

```
pulse/
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/     # Bug report, Feature request
│   ├── dependabot.yml       # Dependency updates
│   └── PULL_REQUEST_TEMPLATE.md
├── backend/
│   ├── users/
│   │   ├── models/         # Modelli modulari
│   │   ├── views/          # API endpoints
│   │   ├── serializers/     # DRF serializers
│   │   ├── services/       # Business logic
│   │   ├── templates/       # Email templates
│   │   └── tests/          # Test suites
│   └── users/models/       # Nuovi modelli modulari
├── frontend/
│   ├── app/                # Next.js App Router
│   ├── components/          # React components
│   │   ├── landing/        # Landing page components
│   │   └── ui/            # UI primitives
│   ├── lib/                # Utilities & API client
│   ├── types/              # TypeScript definitions
│   └── hooks/              # Custom React hooks
├── docker-compose.yml       # Container orchestration
├── Makefile                # Development commands
└── .env.example           # Environment template
```

## 🚀 Quick Start

### Con Docker (Consigliato)

```bash
# 1. Clona il repository
git clone https://github.com/sheddy93/pulse.git
cd pulse

# 2. Copia e configura environment
cp .env.docker .env
# Modifica .env con i tuoi valori

# 3. Avvia tutti i servizi
docker-compose up -d

# 4. Crea superuser
docker-compose exec backend python manage.py createsuperuser

# 5. Apri nel browser
open http://localhost:3000
```

### Senza Docker

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (nuovo terminale)
cd frontend
npm install
npm run dev
```

## ⚙️ Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (.env)
```env
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pulsehr

# Redis
REDIS_URL=redis://localhost:6379/1

# Email (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxx
DEFAULT_FROM_EMAIL=PulseHR <noreply@example.com>

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## 📦 API Endpoints Principali

| Endpoint | Metodo | Descrizione |
|----------|--------|------------|
| `/api/auth/login/` | POST | Login utente |
| `/api/auth/register/` | POST | Registrazione |
| `/api/companies/` | GET/POST | Lista/Crea aziende |
| `/api/employees/` | GET/POST | Lista/Crea dipendenti |
| `/api/attendance/check-in/` | POST | Check-in |
| `/api/attendance/check-out/` | POST | Check-out |
| `/api/leave/requests/` | GET/POST | Richieste ferie |
| `/api/documents/` | GET/POST | Documenti |
| `/api/payroll/runs/` | GET/POST | Elaborazioni payroll |

## 🧪 Testing

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run lint
npm run build
```

## 🚢 Deployment

### GitHub Actions (Automatico)

Le pipeline CI/CD si attivano automaticamente su push a `main`:

1. **CI Pipeline** - Test e lint su ogni PR
2. **Deploy Frontend** - Auto-deploy su Vercel
3. **Deploy Backend** - Auto-deploy su Railway

### Configurazione Secrets GitHub

```bash
# Vercel
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID=xxx

# Railway
RAILWAY_TOKEN=xxx
```

## 🛠️ Comandi Utili (Make)

```bash
make up              # Avvia container
make down            # Ferma container
make logs            # View logs
make migrate         # Applica migrazioni
make shell           # Shell backend
make test            # Esegui test
make db-backup       # Backup database
make clean           # Rimuovi tutto
```

## 📊 Roadmap

- [ ] Screenshot dashboard reali
- [ ] Testimonials da clienti
- [ ] Integrazione calendario (Google/Outlook)
- [ ] App mobile nativa
- [ ] Analytics avanzati
- [ ] Multi-lingua completo

## 📄 License

MIT License - vedi [LICENSE](LICENSE)

## 🤝 Contributing

Vedi [CONTRIBUTING.md](CONTRIBUTING.md) per linee guida.

---

**PulseHR** - Gestione HR moderna per aziende italiane 🇮🇹

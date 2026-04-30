# PulseHR Frontend

## Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Crea `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Build

```bash
npm run build
```

## Struttura

```
frontend/
├── app/                    # Next.js App Router
│   ├── login/             # Pagina login
│   ├── register/          # Pagine registrazione
│   ├── dashboard/         # Dashboard per ruolo
│   └── company/           # Gestione azienda
├── components/           # Componenti React
│   ├── ui/               # Design system base
│   ├── auth/             # Componenti auth
│   └── dashboard/        # Widget dashboard
└── lib/                  # Utility
    └── api/              # Client API centralizzato
```

## Ruoli Utente

| Ruolo | Dashboard | Permessi |
|-------|-----------|----------|
| company_admin | /dashboard/company | Gestisce azienda |
| employee | /dashboard/employee | Timbrature, ferie |
| labor_consultant | /dashboard/consultant | Vede clienti |
| platform_admin | /dashboard/admin | Tutto |

## API Endpoints Principali

- POST /api/auth/login/ - Login
- POST /api/public/company-registration/ - Registrazione azienda
- POST /api/public/consultant-registration/ - Registrazione consulente
- GET /api/dashboard/{role}/summary/ - Summary dashboard
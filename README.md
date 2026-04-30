# PulseHR

> Sistema HR completo per gestione dipendenti, presenze, paghe, documenti e molto altro.

## Struttura del Progetto

```
pulse2.0/
├── backend/                  # Django REST API (Python)
│   ├── config/               # Settings, URLs, WSGI
│   ├── users/                # App principale
│   │   ├── models.py         # Modelli dati
│   │   ├── serializers.py    # DRF Serializers
│   │   ├── services.py       # Business logic
│   │   ├── views/            # View per dominio (auth, leave, payroll...)
│   │   └── utils/            # Utility (email, cookie_auth, pricing...)
│   ├── api/                  # Router API globale
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/                 # React Frontend (Vite)
│   ├── app/                  # Pagine (Next.js App Router)
│   ├── components/
│   │   ├── layout/           # App shell, Sidebar, Topbar
│   │   ├── ui/               # Card, Badge, componenti riutilizzabili
│   │   └── features/         # Onboarding, Auth, Language, Theme...
│   ├── src/                  # Entry point applicazione
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/                     # Documentazione completa
│   ├── audit/                # Report audit tecnico
│   ├── reports/              # Report per fase di sviluppo
│   ├── deploy/               # Guide deployment (Render, Railway, Vercel)
│   ├── qa/                   # Checklist QA e smoke test
│   ├── ARCHITECTURE.md
│   └── INDEX.md
│
├── .github/                  # CI/CD Workflows
├── docker-compose.yml        # Orchestrazione container
├── Makefile                  # Comandi comuni (make dev, make test...)
├── render.yaml               # Config deploy Render
└── README.md
```

## Quick Start

```bash
# Clona il repo
git clone https://github.com/sheddy93/pulse2.0.git
cd pulse2.0

# Backend
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # configura le variabili
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (in un altro terminale)
cd frontend
npm install
npm run dev
```

## Deploy

| Piattaforma | Guida |
|---|---|
| Render | [docs/deploy/DEPLOYMENT.md](docs/deploy/DEPLOYMENT.md) |
| Railway | [docs/deploy/RAILWAY.md](docs/deploy/RAILWAY.md) |
| Docker | `docker-compose up --build` |

## Documentazione

→ [docs/INDEX.md](docs/INDEX.md) — indice completo

## Licenza

Vedi [LICENSE](LICENSE).

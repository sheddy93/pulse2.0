# PulseHR

Sistema HR completo per la gestione di dipendenti, presenze, paghe, e molto altro.

## Struttura del Progetto

```
pulse2.0/
├── backend/                  # Django REST API
│   ├── config/               # Configurazione Django (settings, urls, wsgi)
│   ├── users/                # App principale
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── services.py
│   │   ├── views/            # View suddivise per dominio
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── leave.py
│   │   │   └── ...
│   │   └── utils/            # Utility functions
│   │       ├── email.py
│   │       ├── cookie_auth.py
│   │       └── ...
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/                 # Next.js / React Frontend
│   ├── app/                  # Pagine (Next.js App Router)
│   ├── components/
│   │   ├── layout/           # Shell, Sidebar, Topbar
│   │   ├── ui/               # Componenti UI riutilizzabili
│   │   └── features/         # Componenti feature-specific
│   ├── src/                  # Entry point e configurazione
│   ├── package.json
│   └── vite.config.js
│
├── docs/                     # Documentazione
│   ├── audit/                # Report di audit tecnico
│   ├── reports/              # Report per fase di sviluppo
│   ├── deploy/               # Guide di deployment
│   ├── qa/                   # Checklist QA e test
│   ├── ARCHITECTURE.md
│   └── INDEX.md
│
├── docker-compose.yml        # Orchestrazione container
├── Makefile                  # Comandi comuni
└── README.md
```

## Quick Start

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

## Deploy

Vedi [docs/deploy/](docs/deploy/) per le istruzioni complete.

## Documentazione

Vedi [docs/INDEX.md](docs/INDEX.md) per l'indice completo della documentazione.

# PulseHR Backend

## Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Environment Variables

Crea `.env` (vedi `.env.example`):

```env
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgres://...
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Deploy Railway

```bash
# Variables necessarie in Railway:
DATABASE_URL
DJANGO_SECRET_KEY
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=.railway.app
CORS_ALLOWED_ORIGINS=https://*.vercel.app
```

## Struttura

```
backend/
├── users/               # Main app
│   ├── models.py       # 40+ modelli Django
│   ├── views.py       # API views
│   ├── serializers.py # DRF serializers
│   └── urls.py        # URL routing
└── backend/           # Django project settings
```

## Modelli Principali

- Company: Azienda tenant
- User: Utente con ruolo
- EmployeeProfile: Dati dipendente
- TimeEntry: Timbrature
- LeaveRequest: Richieste ferie
- Document: Documenti HR

## Multi-Tenancy

Ogni query è filtrata per `company` dell'utente corrente.
Consultanti vedono solo aziende collegate tramite ConsultantCompanyLink.
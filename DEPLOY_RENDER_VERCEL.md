# ============================================================
# PulseHR - Deploy su Render (Backend) e Vercel (Frontend)
# ============================================================

## Panoramica

Questa guida descrive come effettuare il deploy di PulseHR su:
- **Backend**: Django su Render (Web Service + PostgreSQL)
- **Frontend**: Next.js su Vercel

---

## Prerequisiti

- Account GitHub con accesso al repository `sheddy93/pulse`
- Account Render (render.com)
- Account Vercel (vercel.com)

---

## PASSO 1: Deploy Backend su Render

### 1.1 Crea PostgreSQL Database

1. Vai su [dashboard.render.com](https://dashboard.render.com)
2. Clicca **New +** → **PostgreSQL**
3. Configura:
   - **Name**: `pulsehr-postgres`
   - **Database**: `pulsehr`
   - **User**: `pulsehr`
4. Clicca **Create Database**
5. Copia la **Connection String** (la userai dopo)

### 1.2 Crea Web Service Backend

1. Clicca **New +** → **Web Service**
2. Connetti il repository `sheddy93/pulse`
3. Configura:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3.12`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**:
     ```
     python manage.py migrate && python manage.py collectstatic --noinput && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4
     ```
4. Clicca **Create Web Service**

### 1.3 Configura Environment Variables

Nella sezione **Environment** del tuo Web Service, aggiungi:

| Key | Value |
|-----|-------|
| `DJANGO_DEBUG` | `false` |
| `DJANGO_SECRET_KEY` | `[ genera una chiave sicura ]` |
| `DJANGO_ALLOWED_HOSTS` | `pulsehr-backend.onrender.com` (sostituisci con il tuo URL) |
| `DATABASE_URL` | `[ incolla la Connection String dal database ]` |
| `CORS_ALLOWED_ORIGINS` | `https://[tuo-frontend].vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://[tuo-frontend].vercel.app,https://pulsehr-backend.onrender.com` |
| `FRONTEND_URL` | `https://[tuo-frontend].vercel.app` |
| `AI_ENABLED` | `false` |
| `EMAIL_HOST` | `smtp.sendgrid.net` (o il tuo provider) |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `true` |

### 1.4 Deploy

1. Clicca **Deployments** → **Create Deployment**
2. Oppure fai push su GitHub e Render farà auto-deploy

### 1.5 Verifica Backend

Dopo il deploy, verifica che il backend risponda:
```
https://pulsehr-backend.onrender.com/api/auth/me/
```
Dovrebbe restituire `401` (non autenticato) invece di `502`.

---

## PASSO 2: Deploy Frontend su Vercel

### 2.1 Importa Repository

1. Vai su [vercel.com](https://vercel.com)
2. Clicca **Add New...** → **Project**
3. Importa il repository `sheddy93/pulse`
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Configura Environment Variables

In **Environment Variables**, aggiungi:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://pulsehr-backend.onrender.com/api` |
| `NEXT_PUBLIC_SITE_URL` | `https://[tuo-frontend].vercel.app` |
| `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` | `false` |

### 2.3 Deploy

1. Clicca **Deploy**
2. Vercel farà `npm run build` e mostrerà URL del frontend

---

## PASSO 3: Aggiorna CORS/ALLOWED_HOSTS

Dopo aver creato entrambi i servizi:

1. Nel backend Render, aggiorna:
   - `DJANGO_ALLOWED_HOSTS`: aggiungi l'URL del frontend Vercel
   - `CORS_ALLOWED_ORIGINS`: aggiungi l'URL del frontend Vercel
   - `CSRF_TRUSTED_ORIGINS`: aggiungi entrambi gli URL

2. Fai redeploy del backend

---

## PASSO 4: Smoke Test

### Backend Tests

```bash
# Test salute
curl https://pulsehr-backend.onrender.com/api/auth/me/

# Risposta attesa: {"detail": "Authentication credentials were not provided."}
```

### Frontend Tests

1. Apri il frontend Vercel
2. Prova registrazione consulente → deve chiamare `https://pulsehr-backend.onrender.com/api/public/consultant-registration/`
3. Prova login → deve chiamare `https://pulsehr-backend.onrender.com/api/auth/login/`
4. Verifica network: nessun `/api/api/...`
5. Nessun errore CORS

---

## Troubleshooting

### Backend 502
- Verifica che gunicorn sia partito
- Controlla i log in Render dashboard
- Verifica che `startCommand` sia corretto

### CORS Errors
- Verifica `CORS_ALLOWED_ORIGINS` nel backend
- Verifica che l'URL del frontend sia completo (https://...)

### Static files non caricano
- Verifica che `collectstatic` sia nel startCommand
- Verifica `STATIC_ROOT` in settings.py

### Next.js build fails
- Verifica che `next` sia in `dependencies` (non devDependencies)
- Verifica che `npm run build` funzioni localmente

---

## Alternative: Render Blueprint

Se preferisci usare il file `render.yaml` per deploy automatico:

1. Vai su Render → **New +** → **Blueprint**
2. Connetti il repository GitHub
3. Render leggerà automaticamente `render.yaml`
4. Dovrai solo configurare le variabili sensitive nell'interfaccia

---

## Struttura File

```
pulse/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── backend/
│   │   ├── settings.py
│   │   └── urls.py
│   └── users/
├── frontend/
│   ├── package.json
│   ├── next.config.mjs
│   ├── app/
│   └── lib/
│       └── api.js
├── render.yaml
├── .gitignore
└── README.md
```
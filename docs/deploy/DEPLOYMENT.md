# PulseHR - Guida Deployment

Questa guida descrive come deployare PulseHR su **Vercel** (frontend) e **Railway** (backend + database).

---

## Indice

- [Prerequisiti](#prerequisiti)
- [Deployment Backend (Railway)](#deployment-backend-railway)
- [Deployment Frontend (Vercel)](#deployment-frontend-vercel)
- [Configurazione DNS (Opzionale)](#configurazione-dns-opzionale)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisiti

Prima di iniziare, assicurati di avere:

- [x] Account GitHub con repository PulseHR
- [x] Account Railway ([railway.app](https://railway.app))
- [x] Account Vercel ([vercel.com](https://vercel.com))
- [x] Codice testato localmente (frontend e backend funzionanti)
- [x] `.env.example` file presenti in `/frontend` e `/backend`
- [x] Migrations Django pronte

---

## Deployment Backend (Railway)

Railway ospiterà il backend Django e il database PostgreSQL.

### Step 1: Crea Progetto Railway

1. Vai su [railway.app](https://railway.app)
2. Login con GitHub
3. Click **"New Project"**
4. Seleziona **"Deploy from GitHub repo"**
5. Autorizza Railway ad accedere al tuo repository
6. Seleziona il repository `PulseHR`

### Step 2: Configura Database PostgreSQL

1. Nel progetto Railway, click **"+ New Service"**
2. Seleziona **"Database" → "PostgreSQL"**
3. Railway creerà automaticamente un database PostgreSQL
4. Copia il valore di `DATABASE_URL` (sarà disponibile nelle variabili di ambiente)

### Step 3: Configura Backend Service

1. Nel progetto Railway, click **"+ New Service"**
2. Seleziona **"GitHub Repo"**
3. Seleziona il repository `PulseHR`
4. Configura:
   - **Root Directory:** `backend`
   - **Build Command:** (Railway auto-detecta Django)
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

### Step 4: Environment Variables Backend

Nel service backend, vai su **"Variables"** e aggiungi:

```bash
# Django Core
DJANGO_SECRET_KEY=<genera-una-secret-key-sicura>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app,your-custom-domain.com
CSRF_TRUSTED_ORIGINS=https://*.railway.app,https://your-frontend-domain.vercel.app

# Database (auto-configurato da Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS (permetti frontend Vercel)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://pulsehr.it

# Email (configurazione SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# OpenAI (opzionale, se abiliti AI)
OPENAI_API_KEY=your-openai-api-key
AI_ENABLED=False

# Redis (opzionale, per future implementazioni)
REDIS_URL=${{Redis.REDIS_URL}}
```

**Come generare DJANGO_SECRET_KEY:**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Step 5: Aggiungi Dependenze Python

Verifica che `backend/requirements.txt` includa:

```txt
Django>=6.0
djangorestframework>=3.15
django-cors-headers
psycopg2-binary
gunicorn
whitenoise
python-dotenv
```

### Step 6: Configura Gunicorn

Crea `backend/Procfile` (se non esiste):

```
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
```

### Step 7: Static Files con WhiteNoise

Nel file `backend/config/settings.py`, aggiungi:

```python
# Static files (WhiteNoise)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... other middleware
]

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

Installa WhiteNoise:
```bash
pip install whitenoise
pip freeze > requirements.txt
```

### Step 8: Run Migrations

Dopo il primo deploy, apri la **Railway Shell** del backend service e esegui:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser  # (opzionale, per admin Django)
```

**Nota:** Railway esegue automaticamente migrations se configuri un `Procfile` release phase:

```
release: python manage.py migrate --noinput
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

### Step 9: Verifica Deployment

1. Railway assegna un URL pubblico: `https://your-backend.railway.app`
2. Testa l'endpoint: `https://your-backend.railway.app/api/health/`
3. Dovresti ricevere: `{"status": "ok"}`

---

## Deployment Frontend (Vercel)

Vercel ospiterà il frontend Next.js.

### Step 1: Crea Progetto Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Login con GitHub
3. Click **"Add New Project"**
4. Seleziona il repository `PulseHR`
5. Configura:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (auto-detectato)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)

### Step 2: Environment Variables Frontend

Nella configurazione del progetto Vercel, aggiungi le seguenti **Environment Variables**:

```bash
# API Backend URL (Railway)
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app

# Site URL (Vercel deployment URL)
NEXT_PUBLIC_SITE_URL=https://your-frontend.vercel.app

# AI Assistant (opzionale)
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=false
```

**Importante:** Tutte le env vars per Next.js devono iniziare con `NEXT_PUBLIC_` se devono essere accessibili nel browser.

### Step 3: Deploy

1. Click **"Deploy"**
2. Vercel farà automaticamente:
   - `npm install`
   - `npm run build`
   - Deploy su edge network
3. Il deploy richiede ~2-3 minuti

### Step 4: Verifica Deployment

1. Vercel assegna un URL: `https://your-project.vercel.app`
2. Visita l'URL e verifica la landing page
3. Prova login/register e verifica che le chiamate API funzionino

---

## Configurazione DNS (Opzionale)

Se hai un dominio personalizzato (es. `pulsehr.it`):

### Frontend (Vercel)

1. In Vercel, vai su **"Settings" → "Domains"**
2. Aggiungi il tuo dominio: `pulsehr.it` e `www.pulsehr.it`
3. Vercel ti darà record DNS da configurare:
   - `A` record: `76.76.21.21` (Vercel IP)
   - `CNAME` record: `cname.vercel-dns.com`
4. Configura questi record nel tuo DNS provider (Cloudflare, Namecheap, etc.)
5. Attendi propagazione DNS (5-30 minuti)
6. Vercel abiliterà automaticamente SSL con Let's Encrypt

### Backend (Railway)

1. In Railway, vai su **"Settings" → "Domains"**
2. Aggiungi custom domain: `api.pulsehr.it`
3. Railway ti darà un `CNAME` target
4. Configura il CNAME nel tuo DNS provider:
   ```
   api.pulsehr.it  CNAME  your-backend.railway.app
   ```
5. Railway abiliterà automaticamente SSL

### Aggiorna Environment Variables

Dopo aver configurato i domini custom, aggiorna:

**Backend (Railway):**
```bash
DJANGO_ALLOWED_HOSTS=api.pulsehr.it,*.railway.app
CSRF_TRUSTED_ORIGINS=https://pulsehr.it,https://www.pulsehr.it
CORS_ALLOWED_ORIGINS=https://pulsehr.it,https://www.pulsehr.it
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.pulsehr.it
NEXT_PUBLIC_SITE_URL=https://pulsehr.it
```

---

## Post-Deployment

### 1. Test Completo

- [ ] Landing page carica correttamente
- [ ] Registrazione azienda funziona
- [ ] Login funziona
- [ ] Dashboard carica dati dal backend
- [ ] Upload documenti funziona
- [ ] Notifiche funzionano
- [ ] Email vengono inviate (se configurato SMTP)

### 2. Monitoring

**Vercel:**
- Dashboard Analytics automaticamente abilitata
- Monitora: Performance, Errors, Traffic

**Railway:**
- Dashboard Metrics automaticamente abilitata
- Monitora: CPU, Memory, Network

**Consigliato:**
- Aggiungi [Sentry](https://sentry.io) per error tracking:
  ```bash
  # Backend
  pip install sentry-sdk
  
  # settings.py
  import sentry_sdk
  sentry_sdk.init(dsn="your-sentry-dsn")
  ```

### 3. Backup Database

Railway offre backup automatici, ma configura anche backup manuali:

```bash
# Backup manuale (da Railway shell)
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### 4. Security Checklist

- [ ] `DJANGO_DEBUG=False` in produzione
- [ ] `DJANGO_SECRET_KEY` è unica e sicura (non quella di dev)
- [ ] `CORS_ALLOWED_ORIGINS` contiene solo domini fidati
- [ ] `CSRF_TRUSTED_ORIGINS` configurato correttamente
- [ ] SSL abilitato su frontend e backend
- [ ] `.env` files NON committati in git (`.gitignore` configurato)
- [ ] Firewall Railway configurato (solo porte necessarie aperte)
- [ ] Rate limiting abilitato (Django Ratelimit consigliato)

---

## Troubleshooting

### Problema: Build Frontend fallisce su Vercel

**Errore:** `Module not found` o `npm ERR!`

**Soluzione:**
1. Verifica che `package.json` e `package-lock.json` siano committati
2. Controlla che `next.config.mjs` sia valido
3. Verifica logs Vercel per dettagli errore
4. Test build locale: `cd frontend && npm run build`

### Problema: Backend 500 Error su Railway

**Errore:** `Internal Server Error` quando chiami API

**Soluzione:**
1. Controlla Railway logs: vai su **"Deployments" → "View logs"**
2. Verifica che `DATABASE_URL` sia configurato correttamente
3. Esegui migrations: `python manage.py migrate`
4. Verifica `DJANGO_ALLOWED_HOSTS` include il dominio Railway
5. Test locale: `python manage.py runserver`

### Problema: CORS Errors

**Errore:** `Access to fetch at 'https://api.../api/...' has been blocked by CORS policy`

**Soluzione:**
1. Verifica `CORS_ALLOWED_ORIGINS` include il dominio frontend Vercel
2. Esempio:
   ```python
   # backend/config/settings.py
   CORS_ALLOWED_ORIGINS = [
       "https://pulsehr.vercel.app",
       "https://pulsehr.it",
       "http://localhost:3000",  # Solo per dev
   ]
   ```
3. Verifica `django-cors-headers` installato e configurato

### Problema: Database Connection Refused

**Errore:** `could not connect to server`

**Soluzione:**
1. Verifica che PostgreSQL service sia attivo su Railway
2. Controlla che `DATABASE_URL` sia configurato (Railway lo setta automaticamente)
3. Verifica network permissions Railway (default: allow all)

### Problema: Static Files non caricano

**Errore:** CSS/JS non caricano in produzione Django

**Soluzione:**
1. Verifica WhiteNoise installato: `pip install whitenoise`
2. Esegui `python manage.py collectstatic --noinput`
3. Verifica `STATIC_ROOT` e `STATICFILES_STORAGE` in `settings.py`

### Problema: Environment Variables non funzionano

**Errore:** `KeyError: 'SOME_ENV_VAR'`

**Soluzione:**
1. Vercel: vai su **"Settings" → "Environment Variables"**
2. Railway: vai su **"Variables"**
3. Verifica che le variabili siano salvate correttamente
4. **Importante:** Dopo aver modificato env vars, fai **"Redeploy"**

---

## CI/CD Automatico

Vercel e Railway supportano auto-deploy su push GitHub:

### Auto-Deploy Setup

**Vercel:**
- Default: deploy automatico su push `main` branch
- Preview deployments: ogni push su PR
- Configurazione: **"Settings" → "Git"**

**Railway:**
- Default: deploy automatico su push `main` branch
- Configurazione: **"Settings" → "Service" → "Deploy Trigger"**

### Branch Strategy

Consigliato:
- `main` → Production (Vercel + Railway)
- `develop` → Staging (deploy su environment separato)
- `feature/*` → Preview deployments (solo Vercel)

---

## Costi Stimati

### Tier Gratuiti (Sufficiente per MVP)

**Vercel:**
- ✅ Gratis: 100 GB bandwidth/mese, deploy illimitati, SSL gratis
- 💰 Pro ($20/mese): Più bandwidth, analytics avanzate

**Railway:**
- ✅ Gratis: $5 credito/mese (sufficiente per backend + DB piccoli)
- 💰 Developer ($5/mese + usage): Database più grande, più risorse

### Produzione Stimata (100 aziende, 1000 utenti)

- Vercel Pro: ~$20/mese
- Railway: ~$30-50/mese (backend + PostgreSQL)
- **Totale: ~$50-70/mese**

---

## Checklist Pre-Deploy

Usa questa checklist prima del primo deploy:

### Backend
- [ ] `.env.example` presente e aggiornato
- [ ] `requirements.txt` completo
- [ ] Migrations applicate e testate localmente
- [ ] `Procfile` configurato con gunicorn
- [ ] WhiteNoise configurato per static files
- [ ] `DJANGO_DEBUG=False` in production
- [ ] CORS configurato correttamente
- [ ] Tests passing: `python manage.py test`

### Frontend
- [ ] `.env.example` presente
- [ ] Build locale successful: `npm run build`
- [ ] `NEXT_PUBLIC_API_BASE_URL` punta a backend corretto
- [ ] No console errors nel browser
- [ ] Immagini ottimizzate (< 500KB)
- [ ] SEO meta tags configurati

### Security
- [ ] `.env` files in `.gitignore`
- [ ] No hardcoded secrets nel codice
- [ ] SSL abilitato su frontend e backend
- [ ] Rate limiting considerato
- [ ] CSRF protection abilitato

---

## Supporto

Per problemi di deployment:

1. **Railway:** [docs.railway.app](https://docs.railway.app)
2. **Vercel:** [vercel.com/docs](https://vercel.com/docs)
3. **Django:** [docs.djangoproject.com](https://docs.djangoproject.com)
4. **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)

---

## Prossimi Passi (Post-MVP)

- [ ] Configurare Redis per caching
- [ ] Setup Celery per task async
- [ ] Migrare storage da locale a S3
- [ ] Abilitare monitoring con Sentry
- [ ] Setup backup database automatici
- [ ] Configurare CDN per static assets
- [ ] Load testing (Artillery, k6)
- [ ] Disaster recovery plan

---

**Deployment completato!** 🚀

Il tuo PulseHR è ora live su internet.

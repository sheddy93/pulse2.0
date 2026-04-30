# Deploy PulseHR su Vercel

## Frontend (Vercel)

### Setup Automatico

1. Vai su https://vercel.com/new
2. Importa il repository GitHub: `sheddy93/pulse`
3. Seleziona il branch `master`
4. Vercel rileva automaticamente Next.js

### Setup Manuale

1. Root Directory: `.` (root del repo)
2. Build Command: `cd frontend && npm install && npm run build`
3. Output Directory: `frontend/.next`
4. Install Command: `cd frontend && npm install`

### Environment Variables da configurare su Vercel

| Nome | Valore | Note |
|------|--------|------|
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend Railway | es. `https://pulsehr-backend.up.railway.app/api` |
| `NEXT_PUBLIC_SITE_URL` | URL del sito Vercel | es. `https://pulsehr.vercel.app` |

### Dominio Personalizzato (opzionale)

1. Settings → Domains
2. Aggiungi `pulsehr.it` o altro dominio
3. Configura DNS come indicato

## Backend (Railway)

### Setup

1. Vai su https://railway.new
2. Seleziona "Deploy from GitHub repo"
3. Seleziona il repository `sheddy93/pulse`
4. Root Directory: `backend`

### Environment Variables su Railway

| Nome | Valore |
|------|--------|
| `DEBUG` | `false` |
| `DJANGO_SECRET_KEY` | Chiave segreta sicura |
| `DJANGO_ALLOWED_HOSTS` | Dominio Vercel, es. `*.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | URL Vercel |
| `CSRF_TRUSTED_ORIGINS` | URL Vercel |
| `DATABASE_URL` | PostgreSQL ( Railway plugin) |
| `REDIS_URL` | Redis (opzionale, per Celery) |

## Smoke Test Post-Deploy

1. Apri URL Vercel
2. Verifica landing page carica
3. Verifica /login funziona
4. Verifica /api/health risponde
5. Verifica CORS configurato correttamente

## Troubleshooting

### CORS Errors
- Verifica CORS_ALLOWED_ORIGINS include URL Vercel
- Verifica che backend sia raggiungibile

### 404 su /api
- Verifica rewrites in vercel.json
- Verifica NEXT_PUBLIC_API_BASE_URL corretto

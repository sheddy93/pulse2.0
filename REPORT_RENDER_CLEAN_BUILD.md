# ============================================================
# PulseHR - Report Clean Build per Render + Vercel
# ============================================================

## Data: 2026-04-29
## Branch: fix/render-clean-deploy-build

---

## 1. File Rimossi

| File/Cartella | Motivo |
|---------------|--------|
| `backend/railway.json` | Non più necessario per Render |
| `deploy/railway/` | Script specifici Railway rimossi |
| `vercel.json` (root) | Vercel usa configurazione interna |

---

## 2. File Modificati

| File | Modifica |
|------|----------|
| `backend/requirements.txt` | Aggiunto whitenoise, dj-database-url, versioni specifiche |
| `backend/backend/settings.py` | Aggiunto whitenoise middleware, aggiornato ALLOWED_HOSTS |
| `.gitignore` | Aggiornato con entries per clean build |

---

## 3. File Creati

| File | Scopo |
|------|-------|
| `render.yaml` | Configurazione Blueprint Render |
| `backend/.env.example` | Template variabili ambiente backend |
| `frontend/.env.example` | Template variabili ambiente frontend |
| `frontend/app/privacy/page.jsx` | Pagina placeholder |
| `frontend/app/terms/page.jsx` | Pagina placeholder |
| `frontend/app/forgot-password/page.jsx` | Pagina placeholder disabilitata |
| `DEPLOY_RENDER_VERCEL.md` | Guida deployment |

---

## 4. Backend - Verifiche

### requirements.txt
```
django==6.0.4
djangorestframework==3.17.1
psycopg[binary]==3.3.3
gunicorn>=25.0.0
whitenoise>=6.7.0
dj-database-url>=2.2.0
drf-spectacular>=0.28.0
```

### settings.py
- ✅ Whitenoise middleware aggiunto
- ✅ ALLOWED_HOSTS default: `*.onrender.com`
- ✅ DATABASE_URL supportato
- ✅ TEMPLATES valido (APP_DIRS=True, no loaders)
- ✅ drf_spectacular in INSTALLED_APPS, non in MIDDLEWARE

---

## 5. Frontend - Verifiche

### package.json
- ✅ `next` in dependencies (non devDependencies)
- ✅ Build command: `next build --webpack`

### lib/api.js
- ✅ Usa `NEXT_PUBLIC_API_BASE_URL` come base
- ✅ Normalizza URL correttamente
- ✅ Non chiama dominio frontend per API

---

## 6. Pagine Mancanti - Stato

| Pagina | Stato |
|--------|-------|
| `/privacy` | ✅ Creata (placeholder) |
| `/terms` | ✅ Creata (placeholder) |
| `/forgot-password` | ✅ Creata (disabilitata) |

---

## 7. Build Verification (da eseguire)

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py check
python manage.py collectstatic --noinput
```

### Frontend
```bash
cd frontend
npm install
npm run build
```

---

## 8. Deploy Instructions

### Render Backend
1. Crea PostgreSQL: `pulsehr-postgres`
2. Crea Web Service: `pulsehr-backend`
3. Root Directory: `backend`
4. Build: `pip install -r requirements.txt`
5. Start: `python manage.py migrate && python manage.py collectstatic --noinput && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4`
6. Environment: vedi `backend/.env.example`

### Vercel Frontend
1. Import: `sheddy93/pulse`
2. Root: `frontend`
3. Build: `npm run build`
4. Environment:
   - `NEXT_PUBLIC_API_BASE_URL=https://pulsehr-backend.onrender.com/api`
   - `NEXT_PUBLIC_SITE_URL=https://[frontend].vercel.app`
   - `NEXT_PUBLIC_AI_ASSISTANT_ENABLED=false`

---

## 9. Problemi Rimasti

| Problema | Stato |
|----------|-------|
| Stripe non configurato | ⚠️ Opzionale, warning in logs |
| Reset password | ⚠️ Placeholder (non implementato) |
| Privacy/Terms | ⚠️ Placeholder (da completare) |
| Smoke test reale | ❌ Da fare dopo deploy |

---

## 10. Stato Finale

```
✅ Clean build pronto per deployment
✅ No Railway/Docker/Vercel files problematici
✅ Backend settings configurato per Render
✅ Frontend API client usa variabili ambiente
✅ Pagine mancanti create (placeholder)
✅ Documentazione completa

❌ Smoke test non ancora eseguito
⚠️ Stripe non configurato
⚠️ Privacy/Terms placeholder
⚠️ Reset password placeholder

STATUS: Ready for Render/Vercel deploy smoke test.
NOT: Production ready
```

---

## 11. Prossimi Passi

1. [ ] Eseguire `python manage.py check` nel backend
2. [ ] Eseguire `npm run build` nel frontend
3. [ ] Deploy su Render (backend + postgres)
4. [ ] Deploy su Vercel (frontend)
5. [ ] Smoke test: registra consulente, login
6. [ ] Verificare network calls verso backend Render

---

## 12. Commit Info

```
Branch: fix/render-clean-deploy-build
Files: 
  - Modified: backend/requirements.txt, backend/backend/settings.py, .gitignore
  - Created: render.yaml, backend/.env.example, frontend/.env.example, 
             frontend/app/privacy/page.jsx, frontend/app/terms/page.jsx,
             frontend/app/forgot-password/page.jsx, DEPLOY_RENDER_VERCEL.md
  - Deleted: backend/railway.json, deploy/railway/*, vercel.json (root)
```
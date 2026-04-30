# PulseHR M2.7 - Smoke Test Checklist

## Obiettivo
Verifica rapida pre-deployment per confermare che l'applicazione funziona correttamente.

---

## 1. Build Verification

```
cd frontend && npm run build
cd backend && python manage.py check
```

- [ ] Frontend build: SUCCESS
- [ ] Backend check: SUCCESS (0 issues)

---

## 2. API Endpoints Verification

### Autenticazione
- [ ] `POST /auth/login/` - Login utente
- [ ] `POST /auth/register/` - Registrazione
- [ ] `GET /auth/me/` - Profilo utente corrente

### Dashboard
- [ ] `GET /dashboard/employee/summary/` - Dashboard dipendente
- [ ] `GET /dashboard/company/summary/` - Dashboard azienda
- [ ] `GET /dashboard/consultant/summary/` - Dashboard consulente
- [ ] `GET /dashboard/admin/summary/` - Dashboard admin

### Ferie e Permessi
- [ ] `GET /leave/types/` - Tipi ferie
- [ ] `GET /leave/balances/` - Saldi ferie
- [ ] `GET /leave/requests/` - Richieste ferie
- [ ] `POST /leave/requests/` - Crea richiesta
- [ ] `POST /leave/requests/{id}/approve/` - Approva
- [ ] `POST /leave/requests/{id}/reject/` - Rifiuta

### Documenti
- [ ] `GET /documents/` - Lista documenti
- [ ] `POST /documents/` - Upload documento
- [ ] `GET /documents/{id}/download/` - Download

### Presenze
- [ ] `POST /time/check-in/` - Entrata
- [ ] `POST /time/check-out/` - Uscita
- [ ] `GET /time/today/` - Riepilogo odierno

### Notifiche
- [ ] `GET /notifications/` - Lista notifiche
- [ ] `POST /notifications/{id}/mark-read/` - Segna letta
- [ ] `POST /notifications/mark-all-read/` - Segna tutte lette

### Assistente
- [ ] `POST /assistant/chat/` - Chat assistenza
- [ ] `GET /assistant/suggestions/` - Suggerimenti

---

## 3. Critical Flows Test

### Onboarding Flow
1. [ ] Registrazione nuova azienda
2. [ ] Login utente
3. [ ] Completamento onboarding
4. [ ] Redirect a dashboard

### Timbratura Flow
1. [ ] Check-in con geolocalizzazione
2. [ ] Check-out
3. [ ] Visualizzazione riepilogo ore

### Richiesta Ferie Flow
1. [ ] Visualizzazione saldi
2. [ ] Creazione richiesta
3. [ ] Approvazione/rifiuto da admin

### Documenti Flow
1. [ ] Upload documento
2. [ ] Download documento
3. [ ] Acknowledgement documento

---

## 4. Security Checks

- [ ] CORS configurato correttamente
- [ ] CSRF tokens presenti
- [ ] API richiede autenticazione (401 se non loggato)
- [ ] .env.example pulito (no credenziali reali)

---

## 5. UI/UX Checks

### Pagine Statiche
- [ ] `/` - Landing page carica
- [ ] `/login` - Form login visibile
- [ ] `/register/company` - Form registrazione visibile

### Dashboard Dinamiche
- [ ] `/dashboard/employee` - Dati reali da API
- [ ] `/dashboard/company` - Dati reali da API
- [ ] `/dashboard/consultant` - Dati reali da API
- [ ] `/dashboard/admin` - Dati reali da API

### Componenti Comuni
- [ ] Loading states visibili
- [ ] Error states gestiti
- [ ] Empty states appropriati

---

## 6. Performance Checks

- [ ] Build < 60 secondi
- [ ] API response < 2 secondi
- [ ] No memory leaks in build
- [ ] Bundle size accettabile

---

## 7. Deployment Checks

### Backend (Railway)
- [ ] Environment variables configurate
- [ ] Database migrations eseguite
- [ ] Static files serviti
- [ ] CORS whitelist configurata

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_BASE_URL` impostato
- [ ] Build succeeded
- [ ] Preview URL accessibile

---

## 8. Post-Deployment Smoke

Dopo deploy, verificare:
1. [ ] Login funziona
2. [ ] Dashboard carica dati
3. [ ] API calls non danno 404/500
4. [ ] No console errors critici

---

## Sign-off

| Check | Data | Esito |
|-------|------|-------|
| Build | ___/___/____ | [ ] OK [ ] FAIL |
| API Test | ___/___/____ | [ ] OK [ ] FAIL |
| Security | ___/___/____ | [ ] OK [ ] FAIL |
| Deploy | ___/___/____ | [ ] OK [ ] FAIL |

**Tester**: _________________  
**Approvatore**: _________________

---

*Documento generato: M2.7 Critical Path Focus*

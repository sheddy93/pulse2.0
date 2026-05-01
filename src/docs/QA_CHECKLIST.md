# QA Test Checklist - AldevionHR

## 1. Super Admin Tests

### Dashboard Access
- [ ] Super admin vede tutti i tab (Companies, Users, Subscriptions, etc.)
- [ ] Non può navigare fuori da `/dashboard/admin`
- [ ] Logout redirige a login

### Companies Tab
- [ ] Può visualizzare lista di tutte le aziende
- [ ] Può creare nuova azienda
- [ ] Può visualizzare dettagli azienda (owner, employees, subscription)
- [ ] Può disabilitare azienda
- [ ] Non vede dati azienda B se guarda azienda A (tenant isolation)

### Users Tab
- [ ] Può visualizzare lista globale utenti
- [ ] Filtra per azienda
- [ ] Filtra per ruolo
- [ ] Può cambiare ruolo utente
- [ ] Non può eliminare utente (soft-delete future)

### Feature Flags Tab
- [ ] Vede matrice feature flags per azienda
- [ ] Può abilitare/disabilitare features
- [ ] Cambio persiste nel database
- [ ] Effetto immediato sui dashboard dei clienti

### Usage Limits Tab
- [ ] Vede limiti per ogni azienda
- [ ] Mostra usage attuale vs limite
- [ ] Avvisi rossi se >90% di uso
- [ ] Può aggiornare limite per azienda

### Audit Log Tab
- [ ] Visualizza log completo (tutte aziende)
- [ ] Filtra per company_id
- [ ] Filtra per azione (create, update, delete)
- [ ] Mostra: chi, cosa, quando, where, risultato
- [ ] Export log come CSV (future)

### System Health
- [ ] Mostra health database
- [ ] Mostra active connections
- [ ] Mostra backup status
- [ ] Mostra error rate ultimi giorni

---

## 2. Company Owner / Admin Tests

### Dashboard Access
- [ ] Vede dashboard con KPI azienda
- [ ] Non può navigare su `/dashboard/admin`
- [ ] Non vede altre aziende

### Employees Tab
- [ ] Può creare dipendente
- [ ] Può visualizzare lista dipendenti (solo sua azienda)
- [ ] Può editare dati dipendente
- [ ] Non vede dipendenti di azienda B

### Presenze Tab
- [ ] Vede presenze dipendenti
- [ ] Filtra per periodo
- [ ] Vede alert geofence (se abilitato)
- [ ] Non vede presenze azienda B

### Feature Flags
- [ ] Vede quali features sono abilitate per sua azienda
- [ ] Non può cambiarle (read-only)
- [ ] Messaggio: "Contatta supporto per abilitare feature X"

### Documenti
- [ ] Carica documento (se documents_enabled = true)
- [ ] Non può caricare se documents_enabled = false (grayed out)
- [ ] Firma richiesta mostra bottone firma per employees

### Subscription
- [ ] Vede piano attuale
- [ ] Vede features incluse
- [ ] Vede storage usage
- [ ] Bottone upgrade (future)

---

## 3. HR Manager Tests

### Dashboard
- [ ] Vede KPI team (non cross-company)
- [ ] Non vede dati confidenziali (billing, audit, system)

### Employees
- [ ] Vede lista dipendenti (sua azienda)
- [ ] Può creare/editare dipendente
- [ ] Può assegnare ruoli (employee, manager, consultant)
- [ ] Non può creare admin (accesso negato)

### Leave Requests
- [ ] Vede richieste ferie dipendenti
- [ ] Può approvare/rifiutare
- [ ] Email notification su approvazione (future)
- [ ] Saldo ferie aggiornato automaticamente

### Payroll
- [ ] Vede stipendi dipendenti (se payroll_enabled)
- [ ] Non vede di azienda B
- [ ] Non può fare pagamenti (company owner only)

### Audit Log
- [ ] Vede log solo sua azienda
- [ ] Filtra per azione
- [ ] Non vede log super admin

---

## 4. Manager Tests

### Dashboard
- [ ] Vede KPI del suo team (max 20 dipendenti)
- [ ] Non vede dipendenti di altri manager

### Attendance
- [ ] Vede presenze dipendenti suo team
- [ ] Può approvare presenze (se workflow lo richiede)
- [ ] Vede alert per assenze ingiustificate

### Leave Requests
- [ ] Vede richieste ferie suo team
- [ ] Può approvare/rifiutare
- [ ] Non vede ferie team di manager B

### Team Analytics
- [ ] Vede semplici grafici (presenze, ferie, performance)
- [ ] Non vede dati financiali

### Permission Denied Tests
- [ ] Non può accedere `/dashboard/company/*` se non ha company_id
- [ ] Non vede menu admin
- [ ] Non può creare nuovi dipendenti (solo view)

---

## 5. Employee Tests

### Dashboard
- [ ] Vede propri dati (presenze, ferie, documenti)
- [ ] Vede calendario turni
- [ ] Vede messaggi manager

### Attendance
- [ ] Può fare check-in/out (se attendance_enabled)
- [ ] Geofence validation (se geofence_enabled)
- [ ] Offline-first sync quando back online
- [ ] Non vede presenze altri dipendenti

### Leave Request
- [ ] Può richiedere ferie (se leave_enabled)
- [ ] Vede saldo ferie
- [ ] Richiesta va a manager
- [ ] Vede stato approvazione

### Documents
- [ ] Vede documenti assegnati
- [ ] Firma digitale quando richiesto
- [ ] Scarica documento con signed URL
- [ ] Non vede documenti azienda

### Profile
- [ ] Vede profilo proprio
- [ ] Può cambiare password
- [ ] Abilita 2FA
- [ ] Non vede profilo altri dipendenti

### Training
- [ ] Vede corsi assegnati (se training_enabled)
- [ ] Completa moduli
- [ ] Scarica certificato
- [ ] Non vede corsi disabilitati

### Chat
- [ ] Manda messaggi a manager
- [ ] Riceve messaggi da manager
- [ ] Non vede chat con dipendenti non supervisori

---

## 6. Consultant Tests

### Dashboard
- [ ] Vede lista aziende clienti
- [ ] Accede a dati azienda per cui è linked

### Link Request
- [ ] Riceve richiesta link da azienda
- [ ] Accetta/rifiuta link
- [ ] Dopo accettazione vede dati azienda

### Employee View
- [ ] Vede dipendenti azienda per cui linked
- [ ] Vede presenze/ferie per documenti
- [ ] Non vede se consultant_enabled = false

### Document Review
- [ ] Vede documenti per firma (se consulente esterno)
- [ ] Approva/rifiuta documenti
- [ ] Audit log traccia azioni consulente

### Permission Denied
- [ ] Non vede azienda se non linked
- [ ] Non può accedere `/dashboard/company` di azienda non autorizzata
- [ ] Non vede payroll
- [ ] Non vede settings azienda

---

## 7. Cross-Tenant Security Tests

### Critical Security Checks
- [ ] Employee di azienda A non vede dati azienda B tramite API
- [ ] Manager di azienda A non vede team azienda B
- [ ] URL hack: `/dashboard/company?company_id=OTHER` fallisce
- [ ] API call con header company_id falso viene rifiutato
- [ ] Logout richiede re-login (no session reuse)

### Database-Level Tests
- [ ] Query senza `company_id` filter fallisce
- [ ] Update documenti con wrong company_id rifiutato
- [ ] Delete su entity di altra azienda rifiutato

---

## 8. Feature Flag Tests

### Disabled Features
- [ ] Se `attendance_enabled = false`:
  - Menu Timbratura non visibile
  - URL `/dashboard/employee/attendance` redirect
  - API returns 403 Forbidden

- [ ] Se `documents_enabled = false`:
  - Menu Documenti disabilitato
  - Upload button grayed out
  - API upload rifiutato

- [ ] Se `payroll_enabled = false`:
  - Menu Payroll non visibile
  - No export options

### Feature Availability
- [ ] Feature abilitato subito dopo cambio flag
- [ ] Clearing cache non necessario
- [ ] Logout/login non necessario (client-side refresh)

---

## 9. Usage Limit Tests

### Validation
- [ ] Employee creation bloccato se max_employees raggiunto
- [ ] Documento upload bloccato se max_documents raggiunto
- [ ] Admin creation bloccato se max_admin_users raggiunto
- [ ] Error message chiaro: "Limite raggiunto. Upgrade per continuare"

### Warnings
- [ ] Alert giallo se >80% utilizzo
- [ ] Alert rosso se >95% utilizzo
- [ ] Warning prima di accettare altro
- [ ] Dashboard mostra usage bar

---

## 10. Performance Tests

### Page Load Times
- [ ] Dashboard employee < 2s
- [ ] Dashboard super admin < 3s
- [ ] Employee list (50 dipendenti) < 1.5s
- [ ] Presence calendar (1 mese) < 2s

### Lazy Loading
- [ ] Heavy analytics pages load in background
- [ ] Fallback spinner mostra
- [ ] No UI freeze su analytics heavy load

### Pagination
- [ ] List pagina 1-10 mostra correttamente
- [ ] Navigation tra pagine smooth
- [ ] Sort funziona correttamente

---

## 11. Browser/Device Tests

### Desktop
- [ ] Chrome latest ✓
- [ ] Firefox latest ✓
- [ ] Safari latest ✓
- [ ] Edge latest ✓

### Mobile
- [ ] iOS Safari (responsive) ✓
- [ ] Android Chrome (responsive) ✓
- [ ] Touch gestures funzionano
- [ ] Offline functionality (PWA) ✓

### Responsive
- [ ] Sidebar collapse su mobile
- [ ] Menu hamburger su <768px
- [ ] Tables scroll su mobile
- [ ] Forms stack su mobile

---

## 12. Integration Tests

### Stripe (if enabled)
- [ ] Test card 4242 4242 4242 4242 va a success
- [ ] Webhook ricevuto e processato
- [ ] Subscription attivata in database
- [ ] Email conferma inviata

### Geofence (if enabled)
- [ ] GPS check-in works only dentro raggio
- [ ] Check-in fallisce se fuori geofence
- [ ] Alert loggato in AttendanceFailureLog

### Email (future)
- [ ] Welcome email ricevuto
- [ ] Password reset link funziona
- [ ] Notifications mandate correttamente

---

## 13. Error Handling

### Network Errors
- [ ] Connexione interrotta mostra retry button
- [ ] Offline mode salva dati localmente
- [ ] Sync quando back online

### Validation Errors
- [ ] Empty fields: required message
- [ ] Invalid email: format message
- [ ] Duplicate: "Already exists" message
- [ ] Form highlights red field in error

### Permission Errors
- [ ] 403 Forbidden: "Non autorizzato"
- [ ] 401 Unauthorized: Redirect login
- [ ] 404 Not Found: Pagina non trovata

---

## 14. Accessibility Tests

- [ ] Keyboard navigation funziona (Tab, Enter, Esc)
- [ ] ARIA labels presenti
- [ ] Color contrast WCAG AA compliant
- [ ] Form labels associati a input
- [ ] Screen reader friendly (future)

---

## Test Data Setup

### Users
```
super_admin: admin@aldevion.com
company_owner: owner@company.it
hr_manager: hr@company.it
manager: manager@company.it
employee: worker@company.it
consultant: consultant@aldevion.com
```

### Companies
- Company A: 50 employees, Starter plan
- Company B: 100 employees, Professional plan

### Test Scenario
- 30 giorni presenze
- 10 richieste ferie (5 approvate, 5 pending)
- 20 documenti
- 2 consulenti linked

---

## Sign-Off Checklist

Before launch, team signs off on:

- [ ] All critical bugs fixed
- [ ] No cross-tenant data leaks
- [ ] Performance baseline met
- [ ] Accessibility WCAG AA
- [ ] Mobile responsive
- [ ] Error handling complete
- [ ] Test coverage >70%
- [ ] Security review passed
- [ ] Load testing passed (100 concurrent)

---

**Last Updated**: 2026-05-01  
**Test Owner**: QA Team
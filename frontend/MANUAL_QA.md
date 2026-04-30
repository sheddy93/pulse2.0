# Manual QA Script - PulseHR

## Desktop (1440px)

### Login Flow
1. Vai su /
2. Clicca "Accedi"
3. Verifica che form sia centrato
4. Prova login con credenziali errate → errore visualizzato
5. Verifica che link "Password dimenticata" funzioni

### Register Company
1. Vai su /register/company
2. Completa tutti i step
3. Verifica che al submit non ci siano errori

### Dashboard Company
1. Verifica KPI cards presenti
2. Verifica che quick actions siano cliccabili
3. Verifica che checklist onboarding appaia per nuovi utenti

## Mobile (390px)

### Employee Dashboard
1. Vai su /dashboard/employee
2. Verifica bottone TIMBRA grande e centrato
3. Verifica bottom navigation
4. Verifica che swipe/navigation funzioni

### Attendence
1. Vai su /attendance
2. Verifica che form sia usabile su mobile
3. Verifica tastierino numerico

## Edge Cases

### Empty States
1. Vai su /company/users con 0 dipendenti
2. Verifica empty state con CTA

### Error States
1. Vai su /attendance senza login
2. Verifica redirect a login

### Loading States
1. Ricarica /dashboard/company
2. Verifica skeleton/loading
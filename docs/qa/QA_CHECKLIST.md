# QA CHECKLIST - PULSEHR

## Layout Issues
- [ ] No overlap tra elementi
- [ ] No input invisibili
- [ ] No icone invisibili
- [ ] No dropdown tagliati
- [ ] No modal fuori viewport
- [ ] No testo tagliato
- [ ] No pulsanti disallineati
- [ ] Spacing coerente 8px grid

## Responsive Breakpoints
- [ ] Desktop 1440px - layout completo
- [ ] Laptop 1024px - nessun overflow orizzontale
- [ ] Tablet 768px - layout a colonna singola
- [ ] Mobile 390px - tutto accessibile
- [ ] Mobile 360px - nessun contenuto tagliato

## Accessibilità (WCAG AA)
- [ ] Labels input presenti e visibili
- [ ] Focus visible su tutti i link/button
- [ ] aria-label su icon button
- [ ] Contrast ratio minimo 4.5:1
- [ ] Tap target minimo 44px
- [ ] Keyboard navigation funziona (Tab, Enter, Escape)
- [ ] Skip to content link presente

## Pagine da verificare

### Autenticazione
- [ ] /login - form accessibile, focus corretto
- [ ] /register/company - tutti i campi funzionano
- [ ] /register/consultant - validazione corretta

### Dashboard
- [ ] /dashboard/company - KPI cards visibili
- [ ] /dashboard/consultant - statistiche caricate
- [ ] /dashboard/employee - presenze visibili

### Gestione
- [ ] /company/users - lista utenti, form ricerca
- [ ] /company/attendance - calendario presenze
- [ ] /company/leave - richieste ferie
- [ ] /company/documents - upload documenti

## Componenti UI
- [ ] Button - hover, active, disabled states
- [ ] Input - focus, error, disabled states
- [ ] Badge - tutte le varianti visibili
- [ ] Card - shadow e border corretti
- [ ] Modal - apertura/chiusura, focus trap

## States
- [ ] Loading - skeleton visibili durante caricamento
- [ ] Empty - empty state quando non ci sono dati
- [ ] Error - messaggio errore chiaro con retry

## Performance
- [ ] Nessun layout shift (CLS < 0.1)
- [ ] Immagini ottimizzate
- [ ] Font caricati correttamente

## Browser Compatibility
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
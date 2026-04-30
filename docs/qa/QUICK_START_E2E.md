# 🚀 Quick Start - Test E2E Playwright

## Setup Iniziale (Una volta sola)

### 1. Installa i browser Playwright
```powershell
cd C:\Users\shedd\Desktop\webApp\frontend
npx playwright install
```

Questo installerà:
- ✅ Chromium
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Browser mobile

**Tempo richiesto**: ~2-3 minuti

---

## Eseguire i Test

### Modalità Consigliata: UI Interattiva ⭐
```powershell
npm run test:e2e:ui
```

**Perché usarla?**
- 👁️ Vedi i test in esecuzione
- 🐛 Debug visuale
- 🎯 Selezioni quali test eseguire
- 📊 Report in tempo reale

### Modalità Headless (CI/CD)
```powershell
npm run test:e2e
```

Esegue tutti i test senza aprire il browser.

### Modalità Debug
```powershell
npm run test:e2e:debug
```

Step-by-step debugging con DevTools.

### Modalità Headed (Browser Visibile)
```powershell
npm run test:e2e:headed
```

Vedi i browser in azione durante i test.

---

## Test Specifici

### Solo un file
```powershell
npx playwright test test-landing
npx playwright test test-auth
npx playwright test test-dashboard
npx playwright test test-navigation
```

### Solo un browser
```powershell
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"
```

### Test specifico per nome
```powershell
npx playwright test -g "homepage loads correctly"
```

---

## Visualizzare i Report

Dopo l'esecuzione:

```powershell
npm run test:e2e:report
```

Apre un report HTML interattivo con:
- ✅ Test passati/falliti
- 📸 Screenshot degli errori
- 🎥 Video delle failure
- 📊 Statistiche dettagliate

---

## Verifica Setup

Controlla che tutto sia configurato correttamente:

```powershell
node tests/e2e/verify-setup.js
```

Output atteso:
```
✅ Configurazione perfetta! Tutto pronto per i test E2E.
📊 Totale: 31 test
```

---

## Test Coverage

### 31 Test Totali

**Landing Page** (6 test)
- Homepage caricamento
- Logo scroll to top
- CTA buttons
- Footer links
- Responsive menu
- Hero section

**Autenticazione** (8 test)
- Login form
- Validazione
- Errori credenziali
- Registrazione azienda
- Registrazione consulente
- Password toggle

**Dashboard** (8 test)
- Dashboard azienda
- Dashboard dipendente
- Dashboard consulente
- Navigazione sidebar
- User menu

**Navigazione** (9 test)
- Accessibilità pagine
- Link navigation
- Back button
- 404 handling
- Legal pages

---

## Browser Supportati

Ogni test viene eseguito su **5 browser**:

1. **Desktop Chrome** (Chromium)
2. **Desktop Firefox**
3. **Desktop Safari** (WebKit)
4. **Mobile Chrome** (Pixel 5)
5. **Mobile Safari** (iPhone 12)

**Totale esecuzioni**: 31 test × 5 browser = **155 test runs**

---

## Troubleshooting

### ❌ "Executable doesn't exist"
```powershell
npx playwright install
```

### ❌ "Server not responding"
Assicurati che il dev server non sia già in esecuzione.
Il config avvia automaticamente `npm run dev`.

### ❌ Test timeout
Aumenta il timeout in `playwright.config.js`:
```javascript
timeout: 30000, // 30 secondi
```

### ❌ Port già in uso
Cambia porta in `playwright.config.js`:
```javascript
baseURL: 'http://localhost:3001',
```

---

## File Importanti

```
frontend/
├── playwright.config.js          # Configurazione
├── package.json                   # Script npm
└── tests/e2e/
    ├── README.md                  # Documentazione completa
    ├── verify-setup.js            # Script verifica
    ├── test-landing.spec.js       # Test landing
    ├── test-auth.spec.js          # Test auth
    ├── test-dashboard.spec.js     # Test dashboard
    └── test-navigation.spec.js    # Test navigation
```

---

## Comandi Rapidi

| Comando | Descrizione |
|---------|-------------|
| `npm run test:e2e` | Esegui tutti i test (headless) |
| `npm run test:e2e:ui` | Modalità UI interattiva ⭐ |
| `npm run test:e2e:debug` | Debug step-by-step |
| `npm run test:e2e:headed` | Browser visibile |
| `npm run test:e2e:report` | Mostra report HTML |

---

## Best Practices

### ✅ Prima di committare
```powershell
npm run test:e2e
```

### ✅ Durante sviluppo
```powershell
npm run test:e2e:ui
```

### ✅ Debug problemi
```powershell
npm run test:e2e:debug
```

### ✅ Test mobile
```powershell
npx playwright test --project="Mobile Chrome"
```

---

## CI/CD Integration

I test sono già configurati per CI/CD:
- ✅ Auto-retry su fallimento (2×)
- ✅ Screenshot automatici
- ✅ Video recording
- ✅ HTML report generato

Aggiungi al `.github/workflows/test.yml`:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

---

## 📚 Risorse

- [Playwright Docs](https://playwright.dev)
- [README Completo](./tests/e2e/README.md)
- [Riepilogo FASE 18](../FASE_18_COMPLETE.md)

---

**Pronto? Inizia subito!**

```powershell
npm run test:e2e:ui
```

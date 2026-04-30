# Test E2E con Playwright - PulseHR

## Panoramica

Questa suite di test end-to-end verifica i workflow critici dell'applicazione PulseHR usando Playwright.

## Struttura Test

### 1. **test-landing.spec.js**
Testa la landing page:
- Caricamento homepage
- Scroll to top con logo
- Presenza CTA buttons
- Link footer
- Navigazione responsive
- Hero section

### 2. **test-auth.spec.js**
Testa l'autenticazione:
- Caricamento pagina login
- Validazione form
- Errori credenziali invalide
- Pagine registrazione azienda
- Pagine registrazione consulente
- Campi obbligatori
- Toggle visibilità password

### 3. **test-dashboard.spec.js**
Testa le dashboard:
- Dashboard azienda
- Dashboard dipendente
- Dashboard consulente
- Navigazione sidebar
- User menu

### 4. **test-navigation.spec.js**
Testa la navigazione:
- Accessibilità pagine principali
- Navigazione tra pagine
- Back button
- Link footer
- Gestione 404

## Installazione

I browser Playwright devono essere installati:

\`\`\`powershell
cd C:\Users\shedd\Desktop\webApp\frontend
npx playwright install
\`\`\`

## Esecuzione Test

### Tutti i test su tutti i browser
\`\`\`powershell
npm run test:e2e
\`\`\`

### Solo browser specifico
\`\`\`powershell
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
\`\`\`

### Singolo file di test
\`\`\`powershell
npx playwright test test-landing.spec.js
\`\`\`

### Modalità UI (interattiva)
\`\`\`powershell
npx playwright test --ui
\`\`\`

### Modalità debug
\`\`\`powershell
npx playwright test --debug
\`\`\`

### Con browser visibile (headed mode)
\`\`\`powershell
npx playwright test --headed
\`\`\`

## Report

Dopo l'esecuzione, visualizza il report HTML:

\`\`\`powershell
npx playwright show-report
\`\`\`

## Configurazione

La configurazione è in `playwright.config.js`:

- **Base URL**: http://localhost:3000
- **Browser**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retry**: 2 volte in CI, 0 in locale
- **Trace**: Salvato al primo retry
- **Screenshot**: Solo su failure
- **Video**: Solo su failure
- **Web Server**: Avvia automaticamente `npm run dev`

## Script Package.json

Aggiungi al `package.json`:

\`\`\`json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
\`\`\`

## Best Practices

### 1. **Selettori stabili**
Usa selettori semantici:
\`\`\`javascript
// ✅ Buono
await page.getByRole('button', { name: 'Login' });
await page.getByLabel('Email');
await page.getByText('Benvenuto');

// ❌ Evita
await page.click('.btn-123');
\`\`\`

### 2. **Attesa esplicita**
\`\`\`javascript
// ✅ Buono
await expect(page.getByText('Caricato')).toBeVisible({ timeout: 5000 });

// ❌ Evita
await page.waitForTimeout(3000);
\`\`\`

### 3. **Isolamento test**
Ogni test deve essere indipendente:
\`\`\`javascript
test.beforeEach(async ({ page }) => {
  // Setup stato iniziale
  await page.goto('/');
});
\`\`\`

### 4. **Test data**
Usa dati di test dedicati:
\`\`\`javascript
const testUser = {
  email: 'test@example.com',
  password: 'Test123!'
};
\`\`\`

## CI/CD Integration

### GitHub Actions
\`\`\`yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
\`\`\`

## Troubleshooting

### Timeout errori
Aumenta il timeout globale:
\`\`\`javascript
// playwright.config.js
export default defineConfig({
  timeout: 30000, // 30 secondi per test
});
\`\`\`

### Server non risponde
Verifica che il dev server sia avviato:
\`\`\`powershell
npm run dev
\`\`\`

### Browser non installati
\`\`\`powershell
npx playwright install --with-deps
\`\`\`

## Risorse

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

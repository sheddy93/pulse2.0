import { test, expect } from '@playwright/test';

/**
 * Esempio di workflow completo E2E
 * 
 * Questo test dimostra un user journey completo:
 * Home → Registrazione → Dashboard
 */

test.describe('Complete User Workflow - Company Registration', () => {
  test('complete company registration flow', async ({ page }) => {
    // Step 1: Visita homepage
    await test.step('Visit homepage', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/PulseHR/);
      await expect(page.getByText('Registra azienda')).toBeVisible();
    });

    // Step 2: Naviga a registrazione azienda
    await test.step('Navigate to company registration', async () => {
      await page.click('text=Registra azienda');
      await expect(page).toHaveURL(/\/register\/company/);
      await expect(page.getByText('Registra Azienda')).toBeVisible();
    });

    // Step 3: Compila form (esempio - adatta ai tuoi campi)
    await test.step('Fill registration form', async () => {
      // Nota: Questi sono campi di esempio
      // Adattali ai campi reali del tuo form
      
      const companyName = page.getByLabel(/nome azienda/i);
      if (await companyName.count() > 0) {
        await companyName.fill('Test Company SRL');
      }
      
      const vatNumber = page.getByLabel(/p\.iva|partita iva/i);
      if (await vatNumber.count() > 0) {
        await vatNumber.fill('12345678901');
      }
      
      const email = page.getByLabel(/email/i);
      if (await email.count() > 0) {
        await email.fill(`test-${Date.now()}@example.com`);
      }
      
      const password = page.getByLabel(/password/i).first();
      if (await password.count() > 0) {
        await password.fill('TestPassword123!');
      }
    });

    // Step 4: Submit form (commentato per evitare registrazioni reali)
    await test.step('Submit form (mocked)', async () => {
      // In un test reale, qui faresti:
      // await page.click('button[type="submit"]');
      // await expect(page).toHaveURL(/\/dashboard\/company/);
      
      // Per ora, solo verifica che il form sia presente
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await expect(submitButton).toBeEnabled();
      }
    });
  });
});

test.describe('Complete User Workflow - Login to Dashboard', () => {
  test('login and navigate to dashboard', async ({ page }) => {
    // Step 1: Vai a login
    await test.step('Navigate to login page', async () => {
      await page.goto('/login');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    // Step 2: Compila credenziali (test - non reali)
    await test.step('Fill login credentials', async () => {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
    });

    // Step 3: Submit (commentato per evitare login reali)
    await test.step('Submit login (mocked)', async () => {
      // In un test reale con auth mock:
      // await page.click('button[type="submit"]');
      // await expect(page).toHaveURL(/\/dashboard/);
      
      // Per ora, verifica che il bottone sia presente
      const loginButton = page.locator('button[type="submit"]');
      await expect(loginButton).toBeVisible();
    });
  });
});

test.describe('Navigation Workflow', () => {
  test('navigate through main pages', async ({ page }) => {
    const navigationFlow = [
      { path: '/', name: 'Home' },
      { path: '/pricing', name: 'Pricing' },
      { path: '/legal/privacy', name: 'Privacy' },
      { path: '/legal/terms', name: 'Terms' },
      { path: '/login', name: 'Login' },
    ];

    for (const step of navigationFlow) {
      await test.step(`Visit ${step.name}`, async () => {
        const response = await page.goto(step.path);
        expect(response?.status()).toBeLessThan(400);
        await expect(page).toHaveURL(step.path);
      });
    }
  });
});

test.describe('Responsive Workflow', () => {
  test('mobile navigation flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Visit homepage on mobile', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/PulseHR/);
    });

    await test.step('Open mobile menu', async () => {
      // Cerca il menu hamburger
      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]');
      
      if (await menuButton.count() > 0) {
        await menuButton.first().click();
        // Il menu dovrebbe essere visibile
        await page.waitForTimeout(500); // Attendi animazione
      }
    });

    await test.step('Navigate to login on mobile', async () => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login/);
      
      // Form dovrebbe essere visibile anche su mobile
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });
  });
});

/**
 * COME USARE QUESTO FILE
 * 
 * 1. Esegui tutti i workflow:
 *    npx playwright test example-workflow
 * 
 * 2. Esegui solo un workflow specifico:
 *    npx playwright test -g "Complete User Workflow - Company Registration"
 * 
 * 3. Debug un workflow:
 *    npx playwright test example-workflow --debug
 * 
 * 4. Modalità UI:
 *    npx playwright test example-workflow --ui
 * 
 * PERSONALIZZAZIONE:
 * - Adatta i selettori ai tuoi componenti
 * - Aggiungi step per i tuoi workflow specifici
 * - Usa test.step() per organizzare i passaggi
 * - Implementa mock per auth quando necessario
 */

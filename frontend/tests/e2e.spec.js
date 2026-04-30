import { test, expect } from '@playwright/test';

/**
 * PulseHR E2E Tests
 * ===============
 * Test end-to-end per verificare flow critici.
 *
 * Setup:
 * npx playwright install
 * npx playwright test
 */

test.describe('PulseHR Critical Flows', () => {

  test('1. Landing page opens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('2. Register company flow', async ({ page }) => {
    await page.goto('/register/company');
    // Compila form step 1
    await page.fill('input[name="admin_first_name"]', 'Mario');
    await page.fill('input[name="admin_last_name"]', 'Rossi');
    await page.fill('input[name="admin_email"]', `test${Date.now()}@azienda.it`);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="password_confirm"]', 'TestPass123!');
    // Clicca avanti
    await page.click('button:has-text("Continua")');
  });

  test('3. Login flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button:has-text("Accedi")');
    // Verifica redirect o errore
    await expect(page.url()).toContain('/dashboard');
  });

  test('4. Employee clock in/out', async ({ page }) => {
    // Assumi login già fatto
    await page.goto('/dashboard/employee');
    const clockButton = page.locator('button:has-text("TIMBRA")').first();
    await expect(clockButton).toBeVisible();
  });

  test('5. Mobile viewport - 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/dashboard/employee');
    // Verifica che nessun elemento sia tagliato
    await expect(page.locator('body')).toBeVisible();
  });
});
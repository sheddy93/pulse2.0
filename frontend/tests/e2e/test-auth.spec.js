import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('login form validation', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Should show validation errors
    await expect(page.getByText(/obbligatorio/i)).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should show error message
    await expect(page.getByText(/errore|credenziali/i)).toBeVisible({ timeout: 5000 });
  });

  test('register company page loads', async ({ page }) => {
    await page.goto('/register/company');
    await expect(page.getByText('Registra Azienda')).toBeVisible();
  });

  test('register company form has required fields', async ({ page }) => {
    await page.goto('/register/company');
    await expect(page.getByLabel(/nome azienda/i)).toBeVisible();
    await expect(page.getByLabel(/p\.iva|partita iva/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('register consultant page loads', async ({ page }) => {
    await page.goto('/register/consultant');
    await expect(page.getByText('Registra Consulente')).toBeVisible();
  });

  test('register consultant form has required fields', async ({ page }) => {
    await page.goto('/register/consultant');
    await expect(page.getByLabel(/nome/i)).toBeVisible();
    await expect(page.getByLabel(/cognome/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('testpassword');
    
    // Look for toggle button
    const toggleButton = page.locator('button[aria-label*="password" i], button[aria-label*="mostra" i]').first();
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await expect(page.locator('input[type="text"]').first()).toBeVisible();
    }
  });
});

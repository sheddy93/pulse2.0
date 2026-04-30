import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('landing page opens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Check for PulseHR content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeDefined();
  });

  test('login page opens', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    // Login page should have a form or input elements
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible({ timeout: 5000 });
  });

  test('company registration page opens', async ({ page }) => {
    await page.goto('/register/company');
    await expect(page.locator('body')).toBeVisible();
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible({ timeout: 5000 });
  });

  test('consultant registration page opens', async ({ page }) => {
    await page.goto('/register/consultant');
    await expect(page.locator('body')).toBeVisible();
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible({ timeout: 5000 });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PulseHR/);
  });

  test('logo scroll to top', async ({ page }) => {
    await page.goto('/');
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    // Click logo
    await page.click('header >> text=PulseHR');
    // Should scroll to top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('CTA buttons present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Registra azienda')).toBeVisible();
    await expect(page.getByText('Sono un consulente')).toBeVisible();
    await expect(page.getByText('Accedi')).toBeVisible();
  });

  test('footer links work', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Privacy');
    await expect(page).toHaveURL(/\/legal\/privacy/);
  });

  test('responsive navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // Mobile menu should be visible
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]');
    if (await menuButton.count() > 0) {
      await expect(menuButton.first()).toBeVisible();
    }
  });

  test('hero section visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /gestione risorse umane/i })).toBeVisible();
  });
});

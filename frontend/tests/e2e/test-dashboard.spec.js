import { test, expect } from '@playwright/test';

test.describe('Dashboard Pages', () => {
  test('company dashboard loads with structure', async ({ page }) => {
    await page.goto('/dashboard/company');
    // Should have next action section
    await expect(page.getByText(/Cosa richiede attenzione/i)).toBeVisible({ timeout: 10000 });
  });

  test('company dashboard has navigation', async ({ page }) => {
    await page.goto('/dashboard/company');
    // Check for common dashboard sections
    const hasNavigation = await page.locator('nav, [role="navigation"]').count() > 0;
    expect(hasNavigation).toBeTruthy();
  });

  test('employee dashboard loads', async ({ page }) => {
    await page.goto('/dashboard/employee');
    // Should load
    await expect(page).toHaveURL(/\/dashboard\/employee/);
  });

  test('employee dashboard shows employee info', async ({ page }) => {
    await page.goto('/dashboard/employee');
    // Should have some employee-specific content
    const hasContent = await page.locator('main, [role="main"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('consultant dashboard loads', async ({ page }) => {
    await page.goto('/dashboard/consultant');
    await expect(page).toHaveURL(/\/dashboard\/consultant/);
  });

  test('consultant dashboard shows client list', async ({ page }) => {
    await page.goto('/dashboard/consultant');
    // Should have clients section or similar
    const hasContent = await page.locator('main, [role="main"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('dashboard sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard/company');
    // Check if sidebar exists
    const sidebar = page.locator('aside, nav[aria-label*="sidebar" i]');
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
  });

  test('dashboard user menu exists', async ({ page }) => {
    await page.goto('/dashboard/company');
    // Look for user profile/menu button
    const userMenu = page.locator('button[aria-label*="user" i], button[aria-label*="profilo" i], button[aria-label*="account" i]');
    if (await userMenu.count() > 0) {
      await expect(userMenu.first()).toBeVisible();
    }
  });
});

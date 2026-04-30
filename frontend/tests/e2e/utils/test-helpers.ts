/**
 * Test Helper Functions for PulseHR E2E Tests
 */

// Get base URL from environment or use default
export function getBaseURL(): string {
  return process.env.BASE_URL || 'http://localhost:3000';
}

// Generate unique test email
export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}@test.pulsehr.it`;
}

// Generate test company name
export function generateCompanyName(): string {
  const timestamp = Date.now();
  return `Test Company ${timestamp}`;
}

// Generate test VAT number
export function generateVatNumber(): string {
  const timestamp = Date.now().toString().slice(-11);
  return `IT${timestamp}`;
}

// Wait for page to be fully loaded
export async function waitForPageLoad(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

// Clear form fields
export async function clearAndFill(
  page: import('@playwright/test').Page,
  selector: string,
  value: string
): Promise<void> {
  await page.locator(selector).clear();
  await page.locator(selector).fill(value);
}

// Click with retry for elements that may take time to appear
export async function clickWithRetry(
  page: import('@playwright/test').Page,
  selector: string,
  maxRetries = 3
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.locator(selector).click({ timeout: 5000 });
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}

// Login helper
export async function login(
  page: import('@playwright/test').Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto(`${getBaseURL()}/login`);
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

// Logout helper
export async function logout(page: import('@playwright/test').Page): Promise<void> {
  // Try common logout selectors
  const logoutSelectors = [
    'button:has-text("logout")',
    'button:has-text("esci")',
    'button:has-text("disconnetti")',
    '[data-testid="logout"]',
    'a[href="/logout"]',
  ];
  
  for (const selector of logoutSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible().catch(() => false)) {
      await element.click();
      await page.waitForLoadState('networkidle');
      return;
    }
  }
  
  // Clear local storage as fallback
  await page.evaluate(() => localStorage.clear());
}

// Take screenshot on failure (useful for debugging)
export async function screenshotOnFailure(
  page: import('@playwright/test').Page,
  testName: string
): Promise<void> {
  await page.screenshot({ 
    path: `test-results/screenshots/${testName}-${Date.now()}.png`,
    fullPage: true 
  });
}

// API helpers
export async function apiRequest(
  page: import('@playwright/test').Page,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: Record<string, unknown>
): Promise<import('@playwright/test').APIResponse> {
  const baseURL = getBaseURL();
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get auth token from local storage/session
  const token = await page.evaluate(() => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  });
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return page.request.fetch(url, {
    method,
    headers,
    data,
  });
}

// Check if element exists and is visible
export async function elementExists(
  page: import('@playwright/test').Page,
  selector: string
): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible({ timeout: 2000 });
  } catch {
    return false;
  }
}

// Wait for URL pattern
export async function waitForUrlPattern(
  page: import('@playwright/test').Page,
  pattern: RegExp | string,
  timeout = 10000
): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}

// Get authenticated API client
export async function getAuthHeaders(
  page: import('@playwright/test').Page
): Promise<Record<string, string>> {
  const token = await page.evaluate(() => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

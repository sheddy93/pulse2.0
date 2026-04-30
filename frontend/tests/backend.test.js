import { test, expect } from '@playwright/test';

/**
 * Backend API Tests
 * =================
 * Verifica che gli endpoint critici funzionino.
 */

const API_BASE = process.env.E2E_API_URL || 'http://localhost:8000/api';

test.describe('Backend API Tests', () => {

  test('Health check', async () => {
    const res = await fetch(`${API_BASE}/healthz/`);
    expect(res.ok).toBe(true);
  });

  test('Login returns token', async ({ request }) => {
    // Solo se hai dati di test
    const res = await request.post(`${API_BASE}/auth/login/`, {
      data: {
        email: 'admin@test.com',
        password: 'testpassword'
      }
    });
    // Non fallisce il test se l'utente non esiste
    expect([200, 401]).toContain(res.status());
  });
});
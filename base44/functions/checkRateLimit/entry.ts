import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Endpoint helper per controllare rate limit
 * Uso: await base44.functions.invoke('checkRateLimit', {identifier, endpoint})
 */

const ENDPOINTS = {
  login: { max: 5, window: 15 },
  generateTotpSecret: { max: 3, window: 60 },
  verifyTotpToken: { max: 10, window: 5 },
  stripeCheckout: { max: 10, window: 60 },
  importEmployees: { max: 2, window: 60 },
  generatePayroll: { max: 5, window: 60 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { identifier, endpoint } = await req.json();

    if (!identifier || !endpoint) {
      return Response.json({ error: 'Missing identifier or endpoint' }, { status: 400 });
    }

    const config = ENDPOINTS[endpoint];
    if (!config) {
      return Response.json({ error: 'Unknown endpoint' }, { status: 400 });
    }

    const now = new Date();
    const records = await base44.entities.ApiRateLimit.filter({
      identifier,
      endpoint
    });

    if (records.length === 0) {
      await base44.entities.ApiRateLimit.create({
        identifier,
        endpoint,
        request_count: 1,
        window_start: now.toISOString(),
        max_requests: config.max,
        window_size_minutes: config.window
      });
      return Response.json({ allowed: true, remaining: config.max - 1 });
    }

    const record = records[0];
    const windowStart = new Date(record.window_start);
    const windowEnd = new Date(windowStart.getTime() + config.window * 60000);

    // Finestra scaduta → reset
    if (now > windowEnd) {
      await base44.entities.ApiRateLimit.update(record.id, {
        request_count: 1,
        window_start: now.toISOString(),
        is_blocked: false
      });
      return Response.json({ allowed: true, remaining: config.max - 1 });
    }

    // Se bloccato → controlla se blocco scaduto
    if (record.is_blocked) {
      const blockedUntil = new Date(record.blocked_until);
      if (now < blockedUntil) {
        return Response.json({
          allowed: false,
          remaining: 0,
          reset_at: blockedUntil,
          blocked: true
        }, { status: 429 });
      } else {
        await base44.entities.ApiRateLimit.update(record.id, {
          is_blocked: false,
          request_count: 1,
          window_start: now.toISOString()
        });
        return Response.json({ allowed: true, remaining: config.max - 1 });
      }
    }

    // Incrementa counter
    const newCount = record.request_count + 1;
    const remaining = config.max - newCount;

    if (newCount > config.max) {
      const blockedUntil = new Date(now.getTime() + 15 * 60000);
      await base44.entities.ApiRateLimit.update(record.id, {
        request_count: newCount,
        is_blocked: true,
        blocked_until: blockedUntil.toISOString()
      });

      return Response.json({
        allowed: false,
        remaining: 0,
        reset_at: blockedUntil,
        blocked: true
      }, { status: 429 });
    }

    await base44.entities.ApiRateLimit.update(record.id, {
      request_count: newCount
    });

    return Response.json({
      allowed: true,
      remaining,
      reset_at: windowEnd
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
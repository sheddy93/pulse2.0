import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Login endpoint with rate limiting
 * Max 5 attempts per 15 minutes per IP + email
 */

const checkLoginRateLimit = async (base44, identifier) => {
  const now = new Date();
  const records = await base44.entities.ApiRateLimit.filter({
    identifier,
    endpoint: 'login'
  });

  if (records.length === 0) {
    // Create new record
    await base44.entities.ApiRateLimit.create({
      identifier,
      endpoint: 'login',
      request_count: 1,
      window_start: now.toISOString(),
      max_requests: 5,
      window_size_minutes: 15
    });
    return { allowed: true, remaining: 4 };
  }

  const record = records[0];
  const windowStart = new Date(record.window_start);
  const windowEnd = new Date(windowStart.getTime() + 15 * 60000);

  // Window expired - reset
  if (now > windowEnd) {
    await base44.entities.ApiRateLimit.update(record.id, {
      request_count: 1,
      window_start: now.toISOString(),
      is_blocked: false
    });
    return { allowed: true, remaining: 4 };
  }

  // Currently blocked
  if (record.is_blocked) {
    const blockedUntil = new Date(record.blocked_until);
    if (now < blockedUntil) {
      return { 
        allowed: false, 
        remaining: 0,
        blocked_until: blockedUntil 
      };
    } else {
      // Unblock
      await base44.entities.ApiRateLimit.update(record.id, {
        is_blocked: false,
        request_count: 1,
        window_start: now.toISOString()
      });
      return { allowed: true, remaining: 4 };
    }
  }

  // Increment counter
  const newCount = record.request_count + 1;
  const remaining = 5 - newCount;

  if (newCount > 5) {
    // Block for 15 minutes
    const blockedUntil = new Date(now.getTime() + 15 * 60000);
    await base44.entities.ApiRateLimit.update(record.id, {
      request_count: newCount,
      is_blocked: true,
      blocked_until: blockedUntil.toISOString()
    });
    return { 
      allowed: false, 
      remaining: 0,
      blocked_until: blockedUntil 
    };
  }

  await base44.entities.ApiRateLimit.update(record.id, {
    request_count: newCount
  });

  return { allowed: true, remaining };
};

Deno.serve(async (req) => {
  try {
    const { email, ip_address } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    // Rate limit check - by email + IP
    const identifier = `${email}:${ip_address || 'unknown'}`;
    const base44 = createClientFromRequest(req);
    
    const rateLimit = await checkLoginRateLimit(base44, identifier);

    if (!rateLimit.allowed) {
      return Response.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retry_after: Math.ceil((rateLimit.blocked_until - new Date()) / 1000)
        },
        { status: 429 }
      );
    }

    // Check if 2FA required
    const totpSecrets = await base44.entities.TotpSecret.filter({
      user_email: email,
      is_enabled: true
    });

    return Response.json({
      allowed: true,
      remaining: rateLimit.remaining,
      requires_2fa: totpSecrets.length > 0,
      message: 'Rate limit check passed'
    });
  } catch (error) {
    console.error('Login rate limit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
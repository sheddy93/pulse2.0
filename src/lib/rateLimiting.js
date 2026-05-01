/**
 * Rate Limiting Utility
 * 
 * Implementa rate limiting per endpoint API critici
 * Usa ApiRateLimit entity per tracciare richieste
 */

// Configurazione rate limit per endpoint
export const RATE_LIMIT_CONFIG = {
  login: {
    max_requests: 5,
    window_minutes: 15,
    description: 'Login attempts'
  },
  stripeCheckout: {
    max_requests: 10,
    window_minutes: 60,
    description: 'Checkout session creation'
  },
  generateTotpSecret: {
    max_requests: 3,
    window_minutes: 60,
    description: 'TOTP secret generation'
  },
  verifyTotpToken: {
    max_requests: 10,
    window_minutes: 5,
    description: 'TOTP token verification'
  },
  importEmployeesFromCSV: {
    max_requests: 2,
    window_minutes: 60,
    description: 'Bulk employee import'
  },
  generatePayrollCSV: {
    max_requests: 5,
    window_minutes: 60,
    description: 'Payroll generation'
  },
  restApiV1: {
    max_requests: 100,
    window_minutes: 60,
    description: 'Generic REST API'
  }
};

/**
 * Check rate limit per un utente/endpoint
 * @param {object} base44 - SDK client
 * @param {string} identifier - email o IP address
 * @param {string} endpoint - nome dell'endpoint
 * @returns {object} {allowed: boolean, remaining: number, reset_at: Date}
 */
export async function checkRateLimit(base44, identifier, endpoint) {
  const config = RATE_LIMIT_CONFIG[endpoint];
  
  if (!config) {
    console.warn(`No rate limit config for endpoint: ${endpoint}`);
    return { allowed: true, remaining: 999 };
  }

  const now = new Date();
  
  // Cerca record rate limit
  const records = await base44.entities.ApiRateLimit.filter({
    identifier,
    endpoint
  });

  let record = records[0];
  
  // Se nessun record o finestra scaduta, crea uno nuovo
  if (!record) {
    record = await base44.entities.ApiRateLimit.create({
      identifier,
      endpoint,
      request_count: 1,
      window_start: now.toISOString(),
      max_requests: config.max_requests,
      window_size_minutes: config.window_minutes,
      is_blocked: false
    });
    
    return {
      allowed: true,
      remaining: config.max_requests - 1,
      reset_at: new Date(now.getTime() + config.window_minutes * 60000)
    };
  }

  const windowStart = new Date(record.window_start);
  const windowEnd = new Date(windowStart.getTime() + config.window_minutes * 60000);
  
  // Se finestra scaduta, reset
  if (now > windowEnd) {
    await base44.entities.ApiRateLimit.update(record.id, {
      request_count: 1,
      window_start: now.toISOString(),
      is_blocked: false
    });
    
    return {
      allowed: true,
      remaining: config.max_requests - 1,
      reset_at: new Date(now.getTime() + config.window_minutes * 60000)
    };
  }

  // Se bloccato, verifica se il blocco è scaduto
  if (record.is_blocked) {
    const blockedUntil = new Date(record.blocked_until);
    if (now < blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        reset_at: blockedUntil,
        reason: 'Rate limit exceeded'
      };
    } else {
      // Sblocca
      await base44.entities.ApiRateLimit.update(record.id, {
        is_blocked: false,
        request_count: 1,
        window_start: now.toISOString()
      });
      
      return {
        allowed: true,
        remaining: config.max_requests - 1,
        reset_at: new Date(now.getTime() + config.window_minutes * 60000)
      };
    }
  }

  // Incrementa counter
  const newCount = record.request_count + 1;
  const remaining = config.max_requests - newCount;
  
  let isBlocked = false;
  let blockedUntil = null;
  
  // Se supera limite, blocca per 15 minuti
  if (newCount > config.max_requests) {
    isBlocked = true;
    blockedUntil = new Date(now.getTime() + 15 * 60000);
  }

  await base44.entities.ApiRateLimit.update(record.id, {
    request_count: newCount,
    is_blocked: isBlocked,
    blocked_until: isBlocked ? blockedUntil.toISOString() : null
  });

  return {
    allowed: remaining >= 0,
    remaining: Math.max(0, remaining),
    reset_at: windowEnd,
    is_blocked: isBlocked
  };
}

/**
 * Middleware da aggiungere alle backend functions
 * Uso: const rateLimit = await checkRateLimit(base44, identifier, 'endpoint_name')
 *      if (!rateLimit.allowed) return Response.json({error: 'Rate limited'}, {status: 429})
 */
export function createRateLimitResponse(rateLimit) {
  return {
    status: 429,
    body: {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset_at - new Date()) / 1000)} seconds`,
      remaining: rateLimit.remaining,
      reset_at: rateLimit.reset_at
    }
  };
}
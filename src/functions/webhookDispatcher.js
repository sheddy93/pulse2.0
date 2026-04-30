/// <reference lib="deno.window" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

/**
 * Crea HMAC signature per webhook
 */
const createSignature = async (payload, secret) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(JSON.stringify(payload))
  );
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Invia webhook a URL remota
 */
const sendWebhook = async (webhook, event, payload) => {
  try {
    const signature = await createSignature(payload, webhook.api_secret);
    
    const response = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-ID': webhook.id,
        'X-Event-Type': event
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });

    const success = response.ok;
    return {
      success,
      status: response.status,
      error: success ? null : await response.text()
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
};

/**
 * Dispatch evento a tutti i webhook registrati
 */
export const dispatchWebhooks = async (base44, companyId, eventType, payload) => {
  try {
    const webhooks = await base44.asServiceRole.entities.WebhookIntegration.filter({
      company_id: companyId,
      is_active: true
    });

    const matching = webhooks.filter(w => w.events?.includes(eventType));
    
    if (matching.length === 0) return { dispatched: 0 };

    let successful = 0;
    let failed = 0;

    for (const webhook of matching) {
      const result = await sendWebhook(webhook, eventType, payload);
      
      if (result.success) {
        successful++;
        // Aggiorna last_triggered_at
        await base44.asServiceRole.entities.WebhookIntegration.update(webhook.id, {
          last_triggered_at: new Date().toISOString(),
          last_error: null,
          retry_count: 0
        });
      } else {
        failed++;
        // Registra errore
        await base44.asServiceRole.entities.WebhookIntegration.update(webhook.id, {
          last_error: result.error,
          retry_count: (webhook.retry_count || 0) + 1
        });
      }
    }

    return { dispatched: matching.length, successful, failed };
  } catch (error) {
    console.error('Webhook dispatch error:', error);
    return { dispatched: 0, error: error.message };
  }
};

/**
 * Handler per testare webhook
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { companyId, eventType, payload } = body;

    if (!companyId || !eventType || !payload) {
      return Response.json(
        { error: 'Missing companyId, eventType, or payload' },
        { status: 400 }
      );
    }

    const result = await dispatchWebhooks(base44, companyId, eventType, payload);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
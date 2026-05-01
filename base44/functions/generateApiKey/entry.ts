/**
 * Generate API Key
 * Crea una nuova API key per una company
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function hashKey(key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateKey() {
  const prefix = 'pk_live_';
  const random = crypto.getRandomValues(new Uint8Array(24)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  return prefix + random;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { name, scopes } = payload;

    if (!name || !scopes || !Array.isArray(scopes)) {
      return Response.json({ error: 'Missing name or scopes' }, { status: 400 });
    }

    // Genera key
    const plainKey = generateKey();
    const keyHash = await hashKey(plainKey);
    const keyPrefix = plainKey.substring(0, 12);

    // Salva nel DB
    const apiKey = await base44.entities.APIKey.create({
      company_id: user.company_id,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes,
      created_by: user.email
    });

    // Ritorna solo una volta (non salvare plain key nel DB)
    return Response.json({
      id: apiKey.id,
      name: apiKey.name,
      api_key: plainKey, // Show only once!
      prefix: keyPrefix,
      scopes: apiKey.scopes,
      created_at: apiKey.created_date
    }, { status: 201 });
  } catch (error) {
    console.error('Generate API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
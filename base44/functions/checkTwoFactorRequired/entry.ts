import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Check if 2FA is required for user
 * Called after password verification, before session creation
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    // Check if user has 2FA enabled
    const totpSecrets = await base44.entities.TotpSecret.filter({
      user_email: email,
      is_enabled: true
    });

    const requires2fa = totpSecrets.length > 0;

    return Response.json({
      email,
      requires_2fa: requires2fa,
      message: requires2fa ? 'Please enter 2FA token' : 'No 2FA required'
    });
  } catch (error) {
    console.error('Error checking 2FA requirement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
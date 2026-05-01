import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import speakeasy from 'npm:speakeasy@^2.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token || token.length !== 6) {
      return Response.json({ error: 'Invalid token format' }, { status: 400 });
    }

    // Get TOTP secret for user
    const totpSecrets = await base44.asServiceRole.entities.TotpSecret.filter({
      user_email: user.email
    });

    if (!totpSecrets.length) {
      return Response.json({ error: 'TOTP not setup' }, { status: 400 });
    }

    const totpSecret = totpSecrets[0];

    // Verify token using speakeasy (RFC 4226 compliant)
    const verified = speakeasy.totp.verify({
      secret: totpSecret.secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 30 seconds before/after
    });

    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Log verification
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'totp_verified',
      actor_email: user.email,
      entity_name: 'TotpSecret',
      details: {
        timestamp: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return Response.json({ success: true, message: 'TOTP verified' });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
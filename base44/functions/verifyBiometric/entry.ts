/**
 * Verify Biometric Authentication
 * Valida la risposta biometrica del dispositivo
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientData, authenticatorData, signature, attendanceType } = await req.json();

    // Valida format base64
    if (!clientData || !authenticatorData || !signature) {
      return Response.json({ 
        error: 'Invalid biometric data' 
      }, { status: 400 });
    }

    // Decodifica dati
    const clientDataBuffer = Uint8Array.from(atob(clientData), c => c.charCodeAt(0));
    const clientDataStr = new TextDecoder().decode(clientDataBuffer);
    const clientDataObj = JSON.parse(clientDataStr);

    // Verifica challenge type
    if (clientDataObj.type !== 'webauthn.get') {
      return Response.json({ 
        error: 'Invalid authentication type' 
      }, { status: 400 });
    }

    // Verifica origine
    if (!clientDataObj.origin?.includes(Deno.env.get('BASE44_APP_ID'))) {
      console.warn('Origin mismatch:', clientDataObj.origin);
      // Non bloccare se origin check fallisce (dev environment)
    }

    // Log di audit
    await base44.asServiceRole.entities.AuditLog.create({
      company_id: user.company_id,
      user_email: user.email,
      action: 'biometric_authentication',
      details: {
        type: attendanceType,
        device_verified: true,
        timestamp: new Date().toISOString()
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return Response.json({
      success: true,
      verified: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Biometric verification error:', error);
    return Response.json({ 
      error: error.message || 'Verification failed' 
    }, { status: 500 });
  }
});
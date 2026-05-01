import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { email, temp_password } = await req.json();

    if (!email || !temp_password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Fetch temporary login records (without auth context)
    const base44 = createClientFromRequest(req);
    
    // Search for matching temporary login - using service role since user isn't authenticated yet
    const tempLogins = await base44.asServiceRole.entities.TemporaryLogin.filter({});

    const matchingLogin = tempLogins.find(tl => 
      tl.user_email === email && 
      tl.temp_password === temp_password &&
      tl.status === "active"
    );

    if (!matchingLogin) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check expiry
    if (new Date(matchingLogin.expires_at) < new Date()) {
      await base44.asServiceRole.entities.TemporaryLogin.update(matchingLogin.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Login expired' }, { status: 401 });
    }

    // Mark as used
    await base44.asServiceRole.entities.TemporaryLogin.update(matchingLogin.id, {
      status: 'used',
      first_login_at: new Date().toISOString(),
      used: true
    });

    console.log(`Temporary login used for ${email} with role ${matchingLogin.user_role}`);

    return Response.json({
      success: true,
      user_email: matchingLogin.user_email,
      user_role: matchingLogin.user_role,
      company_id: matchingLogin.company_id,
      must_change_password: true
    });
  } catch (error) {
    console.error('authenticateTemporaryLogin error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
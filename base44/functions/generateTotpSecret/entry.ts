import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Library: speakeasy per TOTP
// Install: npm install speakeasy
// Per generare secret + QR code

const generateBase32Secret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

const generateQRCodeUrl = (email, secret) => {
  // Google Authenticator format: otpauth://totp/label?secret=SECRET&issuer=issuer
  const label = encodeURIComponent(`PulseHR (${email})`);
  const issuer = encodeURIComponent('PulseHR');
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
};

const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push({
      code,
      used: false
    });
  }
  return codes;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Controlla se TOTP già esiste
    const existing = await base44.entities.TotpSecret.filter({ user_email: user.email });
    if (existing.length > 0 && existing[0].is_enabled) {
      return Response.json({ error: '2FA already enabled' }, { status: 400 });
    }

    // Genera secret
    const secret = generateBase32Secret();
    const qrCodeUrl = generateQRCodeUrl(user.email, secret);
    const backupCodes = generateBackupCodes(10);

    // Salva nel database (non ancora enabled)
    if (existing.length > 0) {
      // Update
      await base44.entities.TotpSecret.update(existing[0].id, {
        secret,
        qr_code_url: qrCodeUrl,
        backup_codes: backupCodes,
        is_enabled: false
      });
    } else {
      // Create
      await base44.entities.TotpSecret.create({
        user_email: user.email,
        secret,
        qr_code_url: qrCodeUrl,
        backup_codes: backupCodes,
        is_enabled: false
      });
    }

    return Response.json({
      secret,
      qr_code_url: qrCodeUrl,
      backup_codes: backupCodes.map(bc => bc.code),
      message: 'Scan QR code with Google Authenticator or similar app'
    });
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
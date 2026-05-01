import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// TOTP real implementation using RFC 6238
// Secret generation + QR code generation

const generateBase32Secret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

// Generate otpauth:// URL for QR code
const generateOtpauthUrl = (email, secret, issuer = 'PulseHR') => {
  const label = encodeURIComponent(`${issuer} (${email})`);
  const secretEncoded = encodeURIComponent(secret);
  const issuerEncoded = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secretEncoded}&issuer=${issuerEncoded}&algorithm=SHA1&digits=6&period=30`;
};

// Generate QR code URL (using qr-server API - free)
const generateQRCodeUrl = (otpauthUrl) => {
  const encoded = encodeURIComponent(otpauthUrl);
  // Using qr-server.com free API
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
};

const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character codes: XXXX-XXXX format
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    codes.push({
      code: `${code.substring(0, 4)}-${code.substring(4, 8)}`,
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

    // Rate limiting: max 3 per hour
    const records = await base44.entities.ApiRateLimit.filter({
      identifier: user.email,
      endpoint: 'generateTotpSecret'
    });

    if (records.length > 0) {
      const record = records[0];
      const now = new Date();
      const windowStart = new Date(record.window_start);
      const windowEnd = new Date(windowStart.getTime() + 60 * 60000);

      if (now < windowEnd && record.request_count >= 3) {
        return Response.json(
          { error: 'Rate limit exceeded. Max 3 per hour.' },
          { status: 429 }
        );
      }
    }

    // Check if 2FA already enabled
    const existing = await base44.entities.TotpSecret.filter({
      user_email: user.email,
      is_enabled: true
    });

    if (existing.length > 0) {
      return Response.json(
        { error: '2FA already enabled. Disable first to regenerate.' },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = generateBase32Secret();
    const otpauthUrl = generateOtpauthUrl(user.email, secret);
    const qrCodeUrl = generateQRCodeUrl(otpauthUrl);
    const backupCodes = generateBackupCodes(10);

    // Save to DB (not enabled yet)
    const pending = await base44.entities.TotpSecret.filter({
      user_email: user.email,
      is_enabled: false
    });

    if (pending.length > 0) {
      // Update existing pending
      await base44.entities.TotpSecret.update(pending[0].id, {
        secret,
        qr_code_url: qrCodeUrl,
        backup_codes: backupCodes
      });
    } else {
      // Create new
      await base44.entities.TotpSecret.create({
        user_email: user.email,
        secret,
        qr_code_url: qrCodeUrl,
        backup_codes: backupCodes,
        is_enabled: false
      });
    }

    console.log(`TOTP secret generated for ${user.email}`);

    return Response.json({
      success: true,
      secret,
      qr_code_url: qrCodeUrl,
      backup_codes: backupCodes.map(bc => bc.code),
      message: 'Scan QR code with authenticator app. Keep backup codes safe.'
    });
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
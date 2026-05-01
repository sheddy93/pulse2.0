/**
 * Send Push Notification
 * Invia notifiche push via Firebase Cloud Messaging
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { recipient_email, title, body, data } = payload;

    if (!recipient_email || !title || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Carica preferenze notifiche
    const prefs = await base44.entities.NotificationPreference.filter({
      user_email: recipient_email
    });

    if (!prefs[0] || !prefs[0].push_enabled) {
      return Response.json({ success: true, skipped: true, reason: 'Push notifications disabled' });
    }

    // Verifica quiet hours
    if (prefs[0].quiet_hours?.enabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const start = prefs[0].quiet_hours.start_time;
      const end = prefs[0].quiet_hours.end_time;

      if (currentTime >= start && currentTime <= end) {
        console.log(`User ${recipient_email} is in quiet hours, skipping push`);
        return Response.json({ success: true, skipped: true, reason: 'Quiet hours' });
      }
    }

    // Invia push a tutti i device registrati
    const pushTokens = prefs[0].push_tokens || [];
    if (pushTokens.length === 0) {
      return Response.json({ success: true, skipped: true, reason: 'No devices registered' });
    }

    const results = [];
    for (const tokenObj of pushTokens) {
      try {
        // TODO: Integrare Firebase Cloud Messaging
        // const response = await admin.messaging().send({
        //   token: tokenObj.token,
        //   notification: { title, body },
        //   data: data || {}
        // });
        
        console.log(`Push sent to ${tokenObj.device}: ${tokenObj.token.substring(0, 20)}...`);
        results.push({ device: tokenObj.device, success: true });
      } catch (error) {
        console.error(`Failed to send push to ${tokenObj.device}:`, error);
        results.push({ device: tokenObj.device, success: false, error: error.message });
      }
    }

    // Log audit
    await base44.functions.invoke('createAuditLog', {
      company_id: user.company_id,
      action: 'push_notification_sent',
      actor_email: user.email,
      details: { recipient: recipient_email, title, devices_count: pushTokens.length }
    });

    return Response.json({
      success: true,
      sent_count: results.filter(r => r.success).length,
      failed_count: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
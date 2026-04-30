/// <reference lib="deno.window" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Sincronizza notifiche con Slack
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.company_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { webhookId, slackWebhookUrl, eventType, payload } = body;

    if (!webhookId || !slackWebhookUrl || !eventType || !payload) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Formatta messaggio Slack in base al tipo di evento
    let slackMessage = {
      text: '📋 PulseHR Notification',
      blocks: []
    };

    switch (eventType) {
      case 'time_entry_created':
        slackMessage.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Timbratura registrata*\n${payload.employee_name} - ${payload.type} alle ${new Date(payload.timestamp).toLocaleTimeString('it-IT')}`
          }
        });
        break;

      case 'leave_request_approved':
        slackMessage.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Ferie approvate*\n${payload.employee_name}\nDal ${payload.start_date} al ${payload.end_date} (${payload.days_count} giorni)`
          }
        });
        break;

      case 'employee_created':
        slackMessage.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👤 *Nuovo dipendente*\n${payload.first_name} ${payload.last_name}\n${payload.job_title || 'N/A'}`
          }
        });
        break;

      default:
        slackMessage.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📢 *${eventType}*\n${JSON.stringify(payload, null, 2)}`
          }
        });
    }

    // Invia a Slack
    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!slackResponse.ok) {
      return Response.json(
        { error: `Slack API error: ${slackResponse.status}` },
        { status: slackResponse.status }
      );
    }

    return Response.json({
      success: true,
      message: 'Message sent to Slack'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
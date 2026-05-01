import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Advanced Slack integration
 * Features:
 * - Send leave request notifications to manager
 * - Send daily standup reminders
 * - Send shift alerts to team
 * - Send performance review reminders
 * - Log all HR events to #hr-log channel
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { eventType, userId, message, channel = '#hr-log' } = await req.json();

    if (!eventType) {
      return Response.json({ error: 'Missing eventType' }, { status: 400 });
    }

    // Get Slack webhook URL from secrets (would need setup)
    const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL');
    if (!slackWebhook) {
      return Response.json({ error: 'Slack webhook not configured' }, { status: 400 });
    }

    let slackMessage = {};

    switch (eventType) {
      case 'leave_request_submitted':
        slackMessage = {
          channel,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*📋 Nuova richiesta di ferie*\n${message}`
              }
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Approva' },
                  style: 'primary',
                  value: `approve_${userId}`
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Rifiuta' },
                  style: 'danger',
                  value: `reject_${userId}`
                }
              ]
            }
          ]
        };
        break;

      case 'standup_reminder':
        slackMessage = {
          channel,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `⏰ *Reminder standup giornaliero*\nInvia il tuo aggiornamento!`
              }
            }
          ]
        };
        break;

      case 'shift_assigned':
        slackMessage = {
          channel,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `📅 *Nuovo turno assegnato*\n${message}`
              }
            }
          ]
        };
        break;

      case 'performance_review_due':
        slackMessage = {
          channel,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `⭐ *Valutazione performance in scadenza*\n${message}`
              }
            }
          ]
        };
        break;

      default:
        slackMessage = {
          channel,
          text: message || `PulseHR event: ${eventType}`
        };
    }

    // Send to Slack webhook
    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    console.log(`Slack message sent for event: ${eventType}`);

    return Response.json({
      success: true,
      event_type: eventType,
      message: 'Slack message sent'
    });
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
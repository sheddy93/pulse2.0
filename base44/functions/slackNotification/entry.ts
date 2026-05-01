/**
 * Slack Notification Handler
 * Invia notifiche a Slack per events HR
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, event_type, data, channel } = await req.json();

    // Fetch Slack config
    const slackConfigs = await base44.entities.SlackIntegration.filter({
      company_id,
      enabled: true
    });

    if (!slackConfigs.length) {
      return Response.json({ success: false, message: 'Slack not configured' });
    }

    const config = slackConfigs[0];
    const webhookUrl = config.webhook_url;

    // Check event enabled
    if (!config.events[event_type]) {
      return Response.json({ success: true, message: 'Event type disabled' });
    }

    // Build message based on event
    let message = buildSlackMessage(event_type, data);

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: channel || config.channel,
        ...message
      })
    });

    if (!response.ok) {
      console.error('Slack error:', await response.text());
      return Response.json({ success: false, error: 'Failed to send to Slack' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildSlackMessage(eventType, data) {
  const messages = {
    leave_request: {
      text: `📅 New Leave Request`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Leave Request from ${data.employee_name}*\n${data.start_date} to ${data.end_date}\nType: ${data.leave_type}\n_Needs approval_`
          }
        }
      ]
    },
    approval_pending: {
      text: `⏳ Approval Pending`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${data.title}* needs your approval\nRequester: ${data.requester_name}`
          }
        }
      ]
    },
    overtime_request: {
      text: `⚡ Overtime Request`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Overtime from ${data.employee_name}*\nHours: ${data.hours}\nDate: ${data.date}`
          }
        }
      ]
    },
    expense_request: {
      text: `💰 Expense Reimbursement`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Expense from ${data.employee_name}*\nAmount: €${data.amount}\nCategory: ${data.category}`
          }
        }
      ]
    }
  };

  return messages[eventType] || { text: `Event: ${eventType}` };
}
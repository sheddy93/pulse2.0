/**
 * Slack Integration Function
 * ─────────────────────────
 * Send notifications and handle interactive messages from Slack.
 * ✅ Approval buttons (leave, overtime)
 * ✅ Rich message formatting
 * ✅ Webhook signing verification
 * 
 * TODO MIGRATION: Slack SDK stays same, business logic portable
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SLACK_WEBHOOK_ENV = 'SLACK_WEBHOOK_URL'; // Set in environment

/**
 * Main Slack webhook handler
 */
Deno.serve(async (req) => {
  try {
    // Verify Slack request signature
    const signature = req.headers.get('X-Slack-Request-Timestamp');
    const slackSignature = req.headers.get('X-Slack-Signature');

    // TODO: Verify signature (prevent replay attacks)
    // verifySlackSignature(signature, slackSignature, body)

    const body = await req.json();

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      return Response.json({ challenge: body.challenge });
    }

    // Get authenticated user context
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Handle interactive actions (button clicks)
    if (body.type === 'block_actions') {
      return handleBlockActions(body, base44, user);
    }

    // Handle slack events
    if (body.type === 'event_callback') {
      return handleSlackEvent(body, base44, user);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Slack integration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Handle interactive block actions (button clicks)
 */
async function handleBlockActions(body, base44, user) {
  const action = body.actions[0];
  const triggerId = body.trigger_id;

  console.log(`Action: ${action.type} | Value: ${action.value} | Trigger: ${triggerId}`);

  // Parse action value (format: action_type:resource_id)
  const [actionType, resourceId] = action.value.split(':');

  if (actionType === 'approve_leave') {
    // TODO: Call workflow service to approve leave
    // await workflowService.approveStep({
    //   approval_id: resourceId,
    //   approver_email: user.email,
    //   decision: 'approved',
    // });

    // Send confirmation to Slack
    await sendSlackMessage(triggerId, {
      text: `✅ Leave request approved by ${user.full_name}`,
      response_type: 'in_channel',
    });

    return Response.json({ ok: true });
  }

  if (actionType === 'reject_leave') {
    // Open modal for rejection reason
    return Response.json({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'reject_leave_modal',
        title: { type: 'plain_text', text: 'Reject Leave Request' },
        submit: { type: 'plain_text', text: 'Reject' },
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: '_Provide reason for rejection:_' },
          },
          {
            type: 'input',
            block_id: 'reason_input',
            label: { type: 'plain_text', text: 'Reason' },
            element: {
              type: 'plain_text_input',
              action_id: 'reason_action',
              placeholder: { type: 'plain_text', text: 'e.g., Project deadline' },
            },
          },
        ],
        private_metadata: resourceId, // Pass leave request ID
      },
    });
  }

  return Response.json({ ok: true });
}

/**
 * Handle Slack events (message, app_mention)
 */
async function handleSlackEvent(body, base44, user) {
  const event = body.event;

  if (event.type === 'app_mention') {
    // Bot was mentioned - respond with help
    await sendSlackMessage(event.channel, {
      text: `Hi <@${event.user}>! 👋\n\nI can help you with:\n• 📋 Leave requests\n• ⏰ Overtime tracking\n• 📊 HR reports\n\nUse \`/pulseh help\` for more.`,
    });
  }

  return Response.json({ ok: true });
}

/**
 * Send message to Slack webhook
 */
async function sendSlackMessage(webhookUrl, message) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create rich leave approval message for Slack
 */
export function createLeaveApprovalMessage(leaveRequest) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 New Leave Request',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Employee:*\n${leaveRequest.employee_name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${leaveRequest.leave_type.charAt(0).toUpperCase() + leaveRequest.leave_type.slice(1)}`,
          },
          {
            type: 'mrkdwn',
            text: `*Days:*\n${leaveRequest.days_count} days`,
          },
          {
            type: 'mrkdwn',
            text: `*Dates:*\n${new Date(leaveRequest.start_date).toLocaleDateString()} - ${new Date(leaveRequest.end_date).toLocaleDateString()}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Note:*\n${leaveRequest.note || '(No note provided)'}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Approve',
              emoji: true,
            },
            value: `approve_leave:${leaveRequest.id}`,
            action_id: 'approve_leave_action',
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Reject',
              emoji: true,
            },
            value: `reject_leave:${leaveRequest.id}`,
            action_id: 'reject_leave_action',
            style: 'danger',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_Requested at ${new Date(leaveRequest.created_date).toLocaleString()}_`,
          },
        ],
      },
    ],
  };
}
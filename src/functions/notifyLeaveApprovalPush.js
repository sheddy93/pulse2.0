/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@pulsehr.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { leaveRequestId, employeeEmail, status, reason } = await req.json();

    if (!leaveRequestId || !employeeEmail || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get push subscriptions for the employee
    const subscriptions = await base44.asServiceRole.entities.PushSubscription?.filter({
      user_email: employeeEmail
    }) || [];

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for:', employeeEmail);
      return Response.json({ message: 'No subscriptions', sent: 0 });
    }

    // Get leave request details
    const leaveRequest = await base44.asServiceRole.entities.LeaveRequest?.get(leaveRequestId);
    if (!leaveRequest) {
      return Response.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const payload = {
      title: status === 'approved' ? 'Feria Approvata! 🎉' : 'Feria Rifiutata',
      body: status === 'approved'
        ? `La tua richiesta di ferie dal ${leaveRequest.start_date} al ${leaveRequest.end_date} è stata approvata`
        : `La tua richiesta di ferie è stata rifiutata${reason ? ': ' + reason : ''}`,
      tag: `leave-${leaveRequestId}`,
      requireInteraction: true,
      data: {
        type: 'LEAVE_' + status.toUpperCase(),
        leaveRequestId,
        url: '/dashboard/employee/leave',
        startDate: leaveRequest.start_date,
        endDate: leaveRequest.end_date,
        reason
      }
    };

    let sentCount = 0;
    const errors = [];

    for (const subscription of subscriptions) {
      try {
        const result = await sendPushNotification(
          JSON.parse(subscription.subscription_json),
          payload
        );
        
        if (result.ok) {
          sentCount++;
        } else {
          errors.push(`Failed for ${subscription.user_email}: ${result.status}`);
        }
      } catch (error) {
        console.error('Push send error for', subscription.user_email, error);
        errors.push(`Error for ${subscription.user_email}: ${error.message}`);
      }
    }

    return Response.json({
      message: 'Push notifications sent',
      sent: sentCount,
      total: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Leave approval push error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendPushNotification(subscription, payload) {
  const publicKey = VAPID_PUBLIC_KEY;
  const privateKey = VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured');
  }

  // Simple push notification sending
  // In production, use a library like web-push
  const url = new URL(subscription.endpoint);
  
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await generateAuthToken(subscription, privateKey)}`
      },
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error('Push notification error:', error);
    throw error;
  }
}

async function generateAuthToken(subscription, privateKey) {
  // Simplified version - in production use proper JWT/VAPID implementation
  const header = {
    alg: 'ES256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: new URL(subscription.endpoint).origin,
    exp: now + 12 * 60 * 60,
    sub: VAPID_SUBJECT
  };

  return 'Bearer-Token-Placeholder';
}
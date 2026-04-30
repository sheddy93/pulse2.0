/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { overtimeRequestId, employeeEmail, status, reason } = await req.json();

    if (!overtimeRequestId || !employeeEmail || !status) {
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

    // Get overtime request details
    const overtimeRequest = await base44.asServiceRole.entities.OvertimeRequest?.get(overtimeRequestId);
    if (!overtimeRequest) {
      return Response.json({ error: 'Overtime request not found' }, { status: 404 });
    }

    const payload = {
      title: status === 'approved' ? 'Straordinario Approvato! ✅' : 'Straordinario Rifiutato',
      body: status === 'approved'
        ? `La tua richiesta di straordinario del ${overtimeRequest.date} (${overtimeRequest.hours}h) è stata approvata`
        : `La tua richiesta di straordinario è stata rifiutata${reason ? ': ' + reason : ''}`,
      tag: `overtime-${overtimeRequestId}`,
      requireInteraction: true,
      data: {
        type: 'OVERTIME_' + status.toUpperCase(),
        overtimeRequestId,
        url: '/dashboard/employee/overtime',
        date: overtimeRequest.date,
        hours: overtimeRequest.hours,
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
    console.error('Overtime approval push error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendPushNotification(subscription, payload) {
  const url = new URL(subscription.endpoint);
  
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error('Push notification error:', error);
    throw error;
  }
}
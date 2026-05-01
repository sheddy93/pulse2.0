/**
 * Google Calendar Sync
 * Sincronizza leave requests a Google Calendar
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, leave_request_id, action } = await req.json();

    // Fetch Google Calendar config
    const calendarConfigs = await base44.entities.GoogleCalendarIntegration.filter({
      company_id,
      enabled: true,
      sync_leave: true
    });

    if (!calendarConfigs.length) {
      return Response.json({ success: false, message: 'Google Calendar not configured' });
    }

    const config = calendarConfigs[0];
    const leaveRequest = await base44.entities.LeaveRequest.filter({ id: leave_request_id });

    if (!leaveRequest.length) {
      return Response.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const leave = leaveRequest[0];
    const accessToken = decryptToken(config.access_token); // In production, use proper encryption

    // Create/update/delete calendar event
    if (action === 'create' || action === 'update') {
      await createCalendarEvent(accessToken, config.calendar_id, leave);
    } else if (action === 'delete') {
      await deleteCalendarEvent(accessToken, config.calendar_id, leave);
    }

    return Response.json({ success: true, action });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createCalendarEvent(accessToken, calendarId, leave) {
  const event = {
    summary: `Leave: ${leave.employee_name} (${leave.leave_type})`,
    description: leave.reason || 'Leave request',
    start: {
      date: leave.start_date.split('T')[0]
    },
    end: {
      date: new Date(new Date(leave.end_date).getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    },
    colorId: '9', // Light blue
    visibility: 'public'
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  );

  if (!response.ok) {
    throw new Error(`Google Calendar error: ${response.statusText}`);
  }

  return response.json();
}

async function deleteCalendarEvent(accessToken, calendarId, leave) {
  // Fetch event by summary
  const listResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=${encodeURIComponent(leave.employee_name)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  const data = await listResponse.json();
  if (data.items && data.items.length > 0) {
    const eventId = data.items[0].id;
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
  }
}

function decryptToken(token) {
  // TODO: Implement proper encryption/decryption
  return token;
}
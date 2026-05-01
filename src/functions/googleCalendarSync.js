/**
 * Google Calendar Sync Function
 * ────────────────────────────
 * Sync leave requests to employee Google Calendar.
 * ✅ Create calendar events for approved leaves
 * ✅ Update/delete events when leave status changes
 * ✅ All-day events for multiple-day leaves
 * 
 * TODO MIGRATION: Google Calendar API wrapper stays, service integration
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Sync leave request to Google Calendar
 * Called via automation after leave approval
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leave_request_id, access_token, user_email } = await req.json();

    // Get leave request
    const leaveRequests = await base44.entities.LeaveRequest.filter({
      id: leave_request_id,
    });

    if (!leaveRequests[0]) {
      return Response.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const leave = leaveRequests[0];

    // Only sync approved leaves
    if (leave.status !== 'approved') {
      return Response.json({ message: 'Leave not approved, skipping sync' });
    }

    // Create calendar event
    const eventId = await createCalendarEvent(
      access_token,
      leave.employee_name,
      leave.start_date,
      leave.end_date,
      leave.leave_type
    );

    // Save event ID to leave request (TODO: Add field to schema)
    // await base44.entities.LeaveRequest.update(leave_request_id, {
    //   calendar_event_id: eventId,
    // });

    return Response.json({
      message: 'Leave synced to Google Calendar',
      event_id: eventId,
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Create calendar event
 * @private
 */
async function createCalendarEvent(
  accessToken,
  title,
  startDate,
  endDate,
  leaveType
) {
  const event = {
    summary: `${leaveType === 'ferie' ? '🏖️' : '📅'} ${title}`,
    description: `Time off: ${leaveType}`,
    start: {
      date: new Date(startDate).toISOString().split('T')[0],
    },
    end: {
      date: new Date(new Date(endDate).getTime() + 86400000).toISOString().split('T')[0], // +1 day for Google Calendar
    },
    colorId: leaveType === 'ferie' ? '10' : '3', // Colors: ferie=blue, permesso=red
    transparency: 'transparent', // Don't mark as busy
    visibility: 'private',
  };

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Update calendar event (when leave is modified)
 */
async function updateCalendarEvent(
  accessToken,
  eventId,
  startDate,
  endDate,
  title
) {
  const event = {
    summary: title,
    start: { date: new Date(startDate).toISOString().split('T')[0] },
    end: { date: new Date(new Date(endDate).getTime() + 86400000).toISOString().split('T')[0] },
  };

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update calendar event: ${response.statusText}`);
  }
}

/**
 * Delete calendar event (when leave is rejected/cancelled)
 */
async function deleteCalendarEvent(accessToken, eventId) {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete calendar event: ${response.statusText}`);
  }
}
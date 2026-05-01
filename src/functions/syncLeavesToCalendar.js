/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employee_id, leave_id } = await req.json();

    // Fetch leave request
    const leaves = await base44.entities.LeaveRequest.filter({ id: leave_id });
    const leave = leaves[0];
    if (!leave) {
      return Response.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Only sync approved leaves
    if (leave.status !== 'approved' && leave.status !== 'manager_approved') {
      return Response.json({ message: 'Leave not approved yet' });
    }

    // Fetch active calendar syncs
    const syncs = await base44.entities.CalendarSync.filter({
      employee_id,
      is_active: true,
      sync_types: { $in: ['leaves'] }
    });

    const results = [];

    for (const sync of syncs) {
      const leaveTypeMap = {
        ferie: 'Ferie',
        permesso: 'Permesso',
        malattia: 'Malattia',
        extra: 'Ferie extra'
      };

      const eventSummary = `${leaveTypeMap[leave.leave_type] || leave.leave_type}`;

      if (sync.calendar_provider === 'google') {
        const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('google_calendar_sync');

        const eventData = {
          summary: eventSummary,
          description: leave.note || `${eventSummary} - ${leave.days_count} giorni`,
          start: {
            date: leave.start_date
          },
          end: {
            date: new Date(new Date(leave.end_date).getTime() + 86400000).toISOString().split('T')[0]
          },
          transparency: 'transparent'
        };

        const existingEvents = await base44.entities.CalendarEvent.filter({
          employee_id,
          source_entity_id: leave_id,
          calendar_provider: 'google'
        });

        let response;
        if (existingEvents.length > 0) {
          response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${sync.calendar_id}/events/${existingEvents[0].external_event_id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventData)
            }
          );
        } else {
          response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${sync.calendar_id}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventData)
            }
          );
        }

        const data = await response.json();
        if (existingEvents.length > 0) {
          await base44.entities.CalendarEvent.update(existingEvents[0].id, {
            last_synced: new Date().toISOString()
          });
        } else {
          await base44.entities.CalendarEvent.create({
            employee_id,
            employee_email: user.email,
            external_event_id: data.id,
            source_entity_type: 'leave_request',
            source_entity_id: leave_id,
            calendar_provider: 'google',
            event_title: eventSummary,
            start_date: leave.start_date,
            end_date: leave.end_date,
            last_synced: new Date().toISOString(),
            sync_direction: 'base44_to_calendar'
          });
        }

        results.push({ provider: 'google', status: 'synced' });
      }
    }

    return Response.json({ synced: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
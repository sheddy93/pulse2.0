/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employee_id, shift_id } = await req.json();

    // Fetch shift data
    const shifts = await base44.entities.Shift.filter({ id: shift_id });
    const shift = shifts[0];
    if (!shift) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Fetch active calendar syncs for this employee
    const syncs = await base44.entities.CalendarSync.filter({
      employee_id,
      is_active: true,
      sync_types: { $in: ['shifts'] }
    });

    const results = [];

    for (const sync of syncs) {
      let eventId;

      if (sync.calendar_provider === 'google') {
        const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('google_calendar_sync');

        const eventData = {
          summary: `Turno: ${shift.shift_type}`,
          description: shift.notes || `Turno ${shift.shift_type}`,
          start: {
            dateTime: new Date(`${shift.date}T${shift.start_time}`).toISOString(),
            timeZone: 'Europe/Rome'
          },
          end: {
            dateTime: new Date(`${shift.date}T${shift.end_time}`).toISOString(),
            timeZone: 'Europe/Rome'
          }
        };

        // Check if event already exists
        const existingEvents = await base44.entities.CalendarEvent.filter({
          employee_id,
          source_entity_id: shift_id,
          calendar_provider: 'google'
        });

        let response;
        if (existingEvents.length > 0) {
          // Update existing event
          const eventId = existingEvents[0].external_event_id;
          response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${sync.calendar_id}/events/${eventId}`,
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
          // Create new event
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
        eventId = data.id;

        // Store/update mapping
        if (existingEvents.length > 0) {
          await base44.entities.CalendarEvent.update(existingEvents[0].id, {
            last_synced: new Date().toISOString()
          });
        } else {
          await base44.entities.CalendarEvent.create({
            employee_id,
            employee_email: user.email,
            external_event_id: eventId,
            source_entity_type: 'shift',
            source_entity_id: shift_id,
            calendar_provider: 'google',
            event_title: `Turno: ${shift.shift_type}`,
            start_date: `${shift.date}T${shift.start_time}`,
            end_date: `${shift.date}T${shift.end_time}`,
            last_synced: new Date().toISOString(),
            sync_direction: 'base44_to_calendar'
          });
        }

        results.push({ provider: 'google', eventId, status: 'synced' });
      } else if (sync.calendar_provider === 'outlook') {
        const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('outlook_calendar_sync');

        const eventData = {
          subject: `Turno: ${shift.shift_type}`,
          bodyPreview: shift.notes || `Turno ${shift.shift_type}`,
          start: {
            dateTime: new Date(`${shift.date}T${shift.start_time}`).toISOString(),
            timeZone: 'Europe/Rome'
          },
          end: {
            dateTime: new Date(`${shift.date}T${shift.end_time}`).toISOString(),
            timeZone: 'Europe/Rome'
          }
        };

        const existingEvents = await base44.entities.CalendarEvent.filter({
          employee_id,
          source_entity_id: shift_id,
          calendar_provider: 'outlook'
        });

        let response;
        if (existingEvents.length > 0) {
          response = await fetch(
            `https://graph.microsoft.com/v1.0/me/calendars/${sync.calendar_id}/events/${existingEvents[0].external_event_id}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventData)
            }
          );
        } else {
          response = await fetch(
            `https://graph.microsoft.com/v1.0/me/calendars/${sync.calendar_id}/events`,
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
        eventId = data.id;

        if (existingEvents.length > 0) {
          await base44.entities.CalendarEvent.update(existingEvents[0].id, {
            last_synced: new Date().toISOString()
          });
        } else {
          await base44.entities.CalendarEvent.create({
            employee_id,
            employee_email: user.email,
            external_event_id: eventId,
            source_entity_type: 'shift',
            source_entity_id: shift_id,
            calendar_provider: 'outlook',
            event_title: `Turno: ${shift.shift_type}`,
            start_date: `${shift.date}T${shift.start_time}`,
            end_date: `${shift.date}T${shift.end_time}`,
            last_synced: new Date().toISOString(),
            sync_direction: 'base44_to_calendar'
          });
        }

        results.push({ provider: 'outlook', eventId, status: 'synced' });
      }
    }

    return Response.json({ synced: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
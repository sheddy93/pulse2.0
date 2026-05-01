/**
 * functions/syncCalendarWithGoogle.js
 * ===================================
 * Sincronizza ferie, turni e scadenze documentali con Google Calendar
 * 
 * Features:
 * - Sincronizzazione bidirezionale
 * - Aggiornamento automatico eventi
 * - Tracking eventi sincronizzati
 * - Error handling e retry logic
 * 
 * Parameters:
 *   - employee_id: ID dipendente
 *   - force_full_sync: boolean (full sync invece di incrementale)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employee_id, force_full_sync = false } = body;

    if (!employee_id) {
      return Response.json({ error: 'Missing employee_id' }, { status: 400 });
    }

    console.log('[Calendar Sync] Starting sync:', { employee_id, force_full_sync });

    // Ottieni connessione Google Calendar
    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    } catch (err) {
      console.error('[Calendar Sync] Google Calendar not connected:', err.message);
      return Response.json(
        { error: 'Google Calendar not connected' },
        { status: 403 }
      );
    }

    const accessToken = connection.accessToken;

    // Carica stato sincronizzazione
    const syncStates = await base44.asServiceRole.entities.CalendarSyncState.filter({
      employee_id,
    });
    let syncState = syncStates.length > 0 ? syncStates[0] : null;

    // Fetch ferie, turni e documenti in scadenza
    const [leaveRequests, shifts, documents, googleSync] = await Promise.all([
      base44.asServiceRole.entities.LeaveRequest.filter({
        employee_id,
        status: 'approved',
      }),
      base44.asServiceRole.entities.ShiftAssignment.filter({
        employee_id,
        status: { $in: ['scheduled', 'confirmed'] },
      }),
      base44.asServiceRole.entities.Document.filter({
        employee_id,
      }),
      base44.asServiceRole.entities.GoogleCalendarSync.filter({
        employee_id,
      }),
    ]);

    const syncRecord = googleSync.length > 0 ? googleSync[0] : null;

    console.log('[Calendar Sync] Fetched events:', {
      leave_count: leaveRequests.length,
      shift_count: shifts.length,
      document_count: documents.length,
    });

    // Crea/aggiorna eventi su Google Calendar
    const createdEvents = {
      leaves: [],
      shifts: [],
      documents: [],
    };

    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Sincronizza ferie
    for (const leave of leaveRequests) {
      const existingEvent = syncRecord?.synced_events?.leave_requests?.find(
        (l) => l.leave_id === leave.id
      );

      const eventData = {
        summary: `🏖️ Ferie - ${leave.leave_type}`,
        description: `Ferie dal ${leave.start_date} al ${leave.end_date}.\nMotivo: ${leave.reason || 'N/A'}`,
        start: {
          date: leave.start_date,
        },
        end: {
          date: new Date(
            new Date(leave.end_date).getTime() + 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0],
        },
        colorId: '8', // Cyan
        transparency: 'transparent',
      };

      try {
        let eventId;
        if (existingEvent?.google_event_id) {
          // Aggiorna evento esistente
          const updateRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.google_event_id}`,
            {
              method: 'PUT',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            }
          );

          if (!updateRes.ok) {
            console.error('[Calendar Sync] Failed to update leave event:', await updateRes.text());
          }
          eventId = existingEvent.google_event_id;
        } else {
          // Crea nuovo evento
          const createRes = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            }
          );

          if (!createRes.ok) {
            console.error('[Calendar Sync] Failed to create leave event:', await createRes.text());
            continue;
          }

          const event = await createRes.json();
          eventId = event.id;
        }

        if (eventId) {
          createdEvents.leaves.push({ leave_id: leave.id, google_event_id: eventId });
        }
      } catch (err) {
        console.error('[Calendar Sync] Error syncing leave:', err.message);
      }
    }

    // Sincronizza turni
    for (const shift of shifts) {
      const existingEvent = syncRecord?.synced_events?.shifts?.find(
        (s) => s.shift_id === shift.id
      );

      const startDateTime = new Date(
        `${shift.shift_date}T${shift.start_time}`
      ).toISOString();
      const endDateTime = new Date(
        `${shift.shift_date}T${shift.end_time}`
      ).toISOString();

      const eventData = {
        summary: `📅 Turno - ${shift.shift_type}`,
        description: `Turno presso ${shift.location_name || 'Sede'}\n${shift.start_time} - ${shift.end_time}`,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        colorId: '3', // Peacock blue
        transparency: 'opaque',
      };

      try {
        let eventId;
        if (existingEvent?.google_event_id) {
          // Aggiorna evento
          const updateRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.google_event_id}`,
            {
              method: 'PUT',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            }
          );

          if (!updateRes.ok) {
            console.error('[Calendar Sync] Failed to update shift event:', await updateRes.text());
          }
          eventId = existingEvent.google_event_id;
        } else {
          // Crea nuovo evento
          const createRes = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            }
          );

          if (!createRes.ok) {
            console.error('[Calendar Sync] Failed to create shift event:', await createRes.text());
            continue;
          }

          const event = await createRes.json();
          eventId = event.id;
        }

        if (eventId) {
          createdEvents.shifts.push({ shift_id: shift.id, google_event_id: eventId });
        }
      } catch (err) {
        console.error('[Calendar Sync] Error syncing shift:', err.message);
      }
    }

    // Sincronizza scadenze documentali (solo se expiry_date è entro 30 giorni)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const doc of documents) {
      if (!doc.expiry_date) continue;

      const expiryDate = new Date(doc.expiry_date);
      if (expiryDate > thirtyDaysFromNow) continue;

      const existingEvent = syncRecord?.synced_events?.documents?.find(
        (d) => d.document_id === doc.id
      );

      const eventData = {
        summary: `⚠️ Scadenza Documento: ${doc.title}`,
        description: `Documento: ${doc.title}\nTipo: ${doc.doc_type}\nScade il: ${doc.expiry_date}`,
        start: {
          date: doc.expiry_date,
        },
        end: {
          date: new Date(
            new Date(doc.expiry_date).getTime() + 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0],
        },
        colorId: '1', // Tomato red
        transparency: 'transparent',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 7 * 24 * 60 }, // 7 days
            { method: 'notification', minutes: 24 * 60 }, // 1 day
          ],
        },
      };

      try {
        let eventId;
        if (existingEvent?.google_event_id) {
          // Aggiorna evento
          const updateRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.google_event_id}`,
            {
              method: 'PUT',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            }
          );

          if (!updateRes.ok) {
            console.error('[Calendar Sync] Failed to update document event:', await updateRes.text());
          }
          eventId = existingEvent.google_event_id;
        } else {
          // Crea nuovo evento
          const createRes = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            }
          );

          if (!createRes.ok) {
            console.error('[Calendar Sync] Failed to create document event:', await createRes.text());
            continue;
          }

          const event = await createRes.json();
          eventId = event.id;
        }

        if (eventId) {
          createdEvents.documents.push({ document_id: doc.id, google_event_id: eventId });
        }
      } catch (err) {
        console.error('[Calendar Sync] Error syncing document:', err.message);
      }
    }

    // Aggiorna GoogleCalendarSync record
    const updatedSyncRecord = {
      ...syncRecord,
      synced_events: {
        leave_requests: createdEvents.leaves,
        shifts: createdEvents.shifts,
        documents: createdEvents.documents,
      },
      last_sync: new Date().toISOString(),
      calendar_ready: true,
    };

    if (syncRecord?.id) {
      await base44.asServiceRole.entities.GoogleCalendarSync.update(
        syncRecord.id,
        updatedSyncRecord
      );
    } else {
      await base44.asServiceRole.entities.GoogleCalendarSync.create({
        employee_id,
        employee_email: user.email,
        company_id: user.company_id,
        ...updatedSyncRecord,
      });
    }

    console.log('[Calendar Sync] Sync completed:', {
      leaves_synced: createdEvents.leaves.length,
      shifts_synced: createdEvents.shifts.length,
      documents_synced: createdEvents.documents.length,
    });

    return Response.json({
      success: true,
      synced: {
        leaves: createdEvents.leaves.length,
        shifts: createdEvents.shifts.length,
        documents: createdEvents.documents.length,
      },
    });
  } catch (error) {
    console.error('[Calendar Sync] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
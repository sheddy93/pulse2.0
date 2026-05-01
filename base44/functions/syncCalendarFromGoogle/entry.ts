/**
 * functions/syncCalendarFromGoogle.js
 * ==================================
 * Webhook handler per sincronizzazione inversa da Google Calendar
 * 
 * Recupera gli ultimi cambiamenti da Google Calendar usando syncToken
 * (non invia pull requests manuali - asincrono e efficiente)
 * 
 * Utilizzato con:
 * create_automation({
 *   automation_type: "connector",
 *   integration_type: "googlecalendar",
 *   events: ["events"],
 *   function_name: "syncCalendarFromGoogle",
 * })
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Webhook di sincronizzazione Google Calendar
    const providerMeta = body.data?._provider_meta || {};
    const state = providerMeta['x-goog-resource-state'];

    console.log('[Google Sync Webhook] Received:', { state });

    // 'sync' è solo un acknowledge, non ha dati
    if (state === 'sync') {
      return Response.json({ status: 'sync_ack' });
    }

    // Ottieni connessione Google
    const connection = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const accessToken = connection.accessToken;
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Carica sync token salvato
    const syncStates = await base44.asServiceRole.entities.CalendarSyncState.list();
    const syncState = syncStates.length > 0 ? syncStates[0] : null;

    // URL incremental sync con syncToken
    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100';
    
    if (syncState?.sync_token) {
      url += `&syncToken=${syncState.sync_token}`;
      console.log('[Google Sync Webhook] Using syncToken for incremental sync');
    } else {
      // Full sync - ultimi 7 giorni
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      url += `&timeMin=${sevenDaysAgo.toISOString()}`;
      console.log('[Google Sync Webhook] Full sync (last 7 days)');
    }

    // Fetch eventi da Google Calendar
    let response = await fetch(url, { headers: authHeader });

    // Se syncToken scaduto (410), riprova con timeMin
    if (response.status === 410) {
      console.log('[Google Sync Webhook] syncToken expired, doing fresh sync');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&timeMin=${sevenDaysAgo.toISOString()}`;
      response = await fetch(url, { headers: authHeader });
    }

    if (!response.ok) {
      console.error('[Google Sync Webhook] Google API error:', response.status, await response.text());
      return Response.json({ error: 'Google API error' }, { status: 500 });
    }

    // Recupera tutte le pagine
    const allEvents = [];
    let pageData = await response.json();
    let nextSyncToken = null;

    while (true) {
      allEvents.push(...(pageData.items || []));

      if (pageData.nextSyncToken) {
        nextSyncToken = pageData.nextSyncToken;
      }

      if (!pageData.nextPageToken) break;

      const nextRes = await fetch(
        url + `&pageToken=${pageData.nextPageToken}`,
        { headers: authHeader }
      );
      if (!nextRes.ok) break;

      pageData = await nextRes.json();
    }

    console.log('[Google Sync Webhook] Retrieved events:', { 
      count: allEvents.length,
      has_sync_token: !!nextSyncToken 
    });

    // Processa eventi (controlla aggiornamenti/cancellazioni)
    for (const event of allEvents) {
      console.log('[Google Sync Webhook] Event:', {
        id: event.id,
        summary: event.summary,
        status: event.status,
      });

      // Nota: Gli eventi sono read-only in questa direzione
      // Possono essere usati per notifiche, ma le modifiche devono venire da AldevionHR
      // Se utente elimina evento da Google Calendar, non facciamo nulla per ora
    }

    // Salva nuovo syncToken per prossime sync
    if (nextSyncToken) {
      if (syncState?.id) {
        await base44.asServiceRole.entities.CalendarSyncState.update(syncState.id, {
          sync_token: nextSyncToken,
          last_full_sync: new Date().toISOString(),
          events_count: allEvents.length,
        });
      } else {
        // Crea nuovo record (prende employee_id da evento se presente)
        const firstEmployeeId = body.data?.employee_id || 'unknown';
        await base44.asServiceRole.entities.CalendarSyncState.create({
          employee_id: firstEmployeeId,
          sync_token: nextSyncToken,
          last_full_sync: new Date().toISOString(),
          events_count: allEvents.length,
        });
      }
    }

    return Response.json({
      success: true,
      events_processed: allEvents.length,
      sync_token_saved: !!nextSyncToken,
    });
  } catch (error) {
    console.error('[Google Sync Webhook] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
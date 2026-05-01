# Google Calendar Sync - AldevionHR

**Document**: `docs/GOOGLE_CALENDAR_SYNC.md`  
**Date**: 2026-05-01  
**Status**: Implementation Guide ✅

---

## 🎯 Overview

Sincronizzazione bidirezionale con Google Calendar che permette ai dipendenti di visualizzare:
- ✅ Ferie approvate
- ✅ Turni assegnati
- ✅ Scadenze documentali (entro 30 giorni)

Sincronizzazione avviene in tempo reale e automaticamente ogni ora.

---

## 🏗️ Architecture

### Components & Functions

#### 1. **Entities**

```json
// GoogleCalendarSync
// Traccia sincronizzazione per dipendente
{
  employee_id: string,
  employee_email: string,
  company_id: string,
  google_calendar_id: string,
  sync_token: string,          // Per sync incrementale
  calendar_ready: boolean,
  synced_events: {
    leave_requests: [{leave_id, google_event_id}],
    shifts: [{shift_id, google_event_id}],
    documents: [{document_id, google_event_id}]
  },
  last_sync: ISO8601,
  sync_errors: [{timestamp, error, retry_count}],
  is_active: boolean
}

// CalendarSyncState
// Stato incrementale per Google Calendar API
{
  employee_id: string,
  sync_token: string,           // Per recupero cambamenti
  last_page_token: string,
  last_full_sync: ISO8601,
  sync_range_start: date,
  events_count: number
}
```

#### 2. **Backend Functions**

**`syncCalendarWithGoogle.js`** (Avanti)
- Sincronizza ferie → Google Calendar
- Sincronizza turni → Google Calendar
- Sincronizza scadenze documentali → Google Calendar
- Crea/aggiorna eventi
- Traccia mapping evento

**`syncCalendarFromGoogle.js`** (Indietro - Webhook)
- Webhook handler per cambiamenti Google Calendar
- Recupera incrementali con syncToken
- Processa eliminazioni/aggiornamenti
- Salva stato per prossime sync

#### 3. **Frontend Component**

**`CalendarSyncSettings.jsx`**
- Panel di controllo per dipendenti
- Connetti/disconnetti Google Calendar
- Sincronizzazione manuale
- Visualizza statistiche eventi
- Mostra ultimi errori

---

## 🔌 Setup & Configuration

### 1. Create Entities

Prima di tutto, crea le entità nel dashboard:
```
POST /entities/GoogleCalendarSync
POST /entities/CalendarSyncState
```

### 2. Enable Google Calendar Connector

```
Dashboard > Integrations > Connect Google Calendar
```

Autorizzare con scopes:
- `calendar.events` (read/write)
- `calendar` (read)

### 3. Deploy Backend Functions

```
- functions/syncCalendarWithGoogle.js
- functions/syncCalendarFromGoogle.js
```

### 4. Create Automations (Optional but Recommended)

**Hourly sync (Scheduled)**:
```javascript
create_automation({
  automation_type: "scheduled",
  name: "Hourly Google Calendar Sync",
  function_name: "syncCalendarWithGoogle",
  repeat_interval: 1,
  repeat_unit: "hours",
})
```

**Webhook sync (Real-time)**:
```javascript
create_automation({
  automation_type: "connector",
  integration_type: "googlecalendar",
  name: "Google Calendar Webhook Sync",
  events: ["events"],
  function_name: "syncCalendarFromGoogle",
})
```

---

## 📋 Usage

### For Employees

1. **Go to notification settings**
   ```
   /dashboard/employee/notification-settings
   ```

2. **Click "Sync with Google Calendar"**
   - Redirects to Google Calendar auth flow
   - Requests calendar.events permission
   - Returns to app

3. **First sync triggers automatically**
   - Creates events for all approved leaves
   - Creates events for all assigned shifts
   - Creates events for expiring documents

4. **Events auto-sync hourly**
   - New leaves → automatically added
   - Cancelled shifts → automatically removed
   - Document expiry approaching → reminder added

5. **See stats in CalendarSyncSettings**
   - Number of synced leaves, shifts, documents
   - Last sync timestamp
   - Manual sync button
   - Disconnect option

### For Developers

**Trigger sync programmatically**:
```javascript
import { base44 } from '@/api/base44Client';

const response = await base44.functions.invoke('syncCalendarWithGoogle', {
  employee_id: 'emp_123',
  force_full_sync: false,  // true for full, false for incremental
});

console.log(response.data.synced);
// { leaves: 5, shifts: 3, documents: 2 }
```

**Check sync status**:
```javascript
const syncRecords = await base44.entities.GoogleCalendarSync.filter({
  employee_id: 'emp_123',
});

const status = syncRecords[0];
console.log(status.synced_events);  // View all synced events
console.log(status.last_sync);      // Last sync time
console.log(status.sync_errors);    // Recent errors
```

---

## 🔄 Sync Logic

### Leave Request (Ferie)

**What syncs**: Only `status: "approved"`

**Google Calendar Event**:
```
Summary: 🏖️ Ferie - [leave_type]
Description: Ferie dal [start_date] al [end_date]. Motivo: [reason]
Start Date: [start_date]
End Date: [end_date + 1 day]  // All-day event
Color: Cyan (#24C6DC)
Transparency: Transparent
```

**Update Logic**:
- If leave already synced (mapping exists) → update event
- If new leave → create new event
- Store mapping (leave_id → google_event_id)

### Shift Assignment (Turni)

**What syncs**: Only `status: "scheduled"` or `"confirmed"`

**Google Calendar Event**:
```
Summary: 📅 Turno - [shift_type]
Description: Turno presso [location_name]. [start_time] - [end_time]
Start DateTime: [shift_date]T[start_time]
End DateTime: [shift_date]T[end_time]
Color: Peacock Blue (#51B2DF)
Transparency: Opaque  // Blocks calendar time
```

**Update Logic**:
- Same as leaves
- Uses dateTime (not all-day)

### Document Expiry (Scadenze)

**What syncs**: Only documents expiring within 30 days

**Google Calendar Event**:
```
Summary: ⚠️ Scadenza Documento: [title]
Description: Tipo: [doc_type]. Scade il: [expiry_date]
Start Date: [expiry_date]
End Date: [expiry_date + 1 day]
Color: Tomato Red (#E24B49)
Reminders:
  - Email 7 days before
  - Notification 1 day before
```

**Update Logic**:
- Same as leaves
- Auto-removes from Google Calendar if > 30 days away

---

## 🔐 Security & Privacy

### Scopes Used
- `calendar.events` → Create, read, update calendar events
- `calendar` → Access calendar metadata

### Data Stored
```
GoogleCalendarSync entity:
- employee_id (for filtering)
- sync_token (for incremental syncs)
- synced_events (mapping IDs only)
- sync_errors (for debugging)
```

**NOT stored**:
- Google Calendar auth token (stored securely by Base44)
- Full event details (only IDs stored)
- Personal user data beyond employee_id

### Disconnection
- User can disconnect anytime
- Events in Google Calendar are preserved
- Mappings are deleted
- Next sync starts fresh

---

## 🐛 Troubleshooting

### "Google Calendar not connected"
**Cause**: Connector not authorized

**Fix**:
1. Go to Dashboard > Integrations
2. Click "Connect Google Calendar"
3. Authorize with account
4. Retry sync

### Events not appearing
**Cause**: Sync function not triggered

**Fix**:
1. Manually trigger via CalendarSyncSettings component
2. Check function logs in Dashboard > Functions
3. Verify LeaveRequest/ShiftAssignment have correct fields
4. Ensure employee_id matches

### Duplicate events
**Cause**: Sync triggered multiple times before mapping saved

**Fix**:
1. Manual cleanup in Google Calendar (delete duplicates)
2. Update mapping in GoogleCalendarSync entity
3. Future syncs will use mapping to prevent duplicates

### "syncToken expired"
**Cause**: >1 week without sync

**Fix**: Automatic - function detects 410 error and does full sync

### Events not updating
**Cause**: Mapping missing or incorrect

**Fix**:
1. Check GoogleCalendarSync.synced_events
2. Verify mapping has correct leave_id/google_event_id
3. Manually update mapping
4. Retry sync

---

## 📊 Analytics & Monitoring

### Useful Queries

**Check sync health**:
```javascript
const syncRecords = await base44.asServiceRole.entities.GoogleCalendarSync.list();
const active = syncRecords.filter(s => s.is_active).length;
console.log(`${active} / ${syncRecords.length} employees synced`);
```

**Check for errors**:
```javascript
const errorRecords = syncRecords.filter(s => s.sync_errors?.length > 0);
console.log('Employees with sync errors:', errorRecords.length);
```

**Last sync timestamp**:
```javascript
const lastSync = syncRecords
  .filter(s => s.last_sync)
  .sort((a, b) => new Date(b.last_sync) - new Date(a.last_sync))[0];
console.log('Last sync:', lastSync.last_sync);
```

---

## 📋 Checklist

- [ ] Create GoogleCalendarSync entity
- [ ] Create CalendarSyncState entity
- [ ] Deploy syncCalendarWithGoogle.js
- [ ] Deploy syncCalendarFromGoogle.js
- [ ] Create scheduled automation (hourly)
- [ ] Create connector automation (webhook)
- [ ] Add CalendarSyncSettings to employee profile/settings
- [ ] Test sync with test employee account
- [ ] Verify events appear in Google Calendar
- [ ] Test manual sync
- [ ] Test disconnect/reconnect
- [ ] Monitor error logs

---

## 🔗 Related Documentation

- Google Calendar API: https://developers.google.com/calendar/api
- Base44 Connectors: [Platform docs]
- Automations: [Platform docs]

---

**Status**: Production Ready ✅  
**Last Updated**: 2026-05-01  
**Version**: 1.0.0
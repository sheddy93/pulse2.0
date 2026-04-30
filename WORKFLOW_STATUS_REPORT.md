# WORKFLOW ENGINE STATUS REPORT - PulseHR

**Data Analisi:** 2026-04-25
**Progetto:** PulseHR - Backend Django
**Directory:** `C:\Users\shedd\Desktop\webApp\backend\`

---

## 1. FERIE WORKFLOW

**Stato:** ✅ ESISTENTE E COMPLETO

### Model
- `LeaveRequest` (models.py) con stati: `pending`, `approved`, `rejected`, `cancelled`
- `LeaveType` per configurazione tipologie ferie
- `LeaveBalance` per gestione saldi dipendenti

### Endpoint Registrati (urls.py)

| Metodo | Endpoint | Funzionalita |
|--------|----------|--------------|
| GET | `/leave/types/` | Lista tipologie ferie aziendali |
| POST | `/leave/types/` | Crea nuova tipologia ferie |
| GET | `/leave/balances/` | Lista saldi ferie dipendente |
| GET | `/leave/requests/` | Lista richieste ferie (con filtri year, status, employee_id) |
| POST | `/leave/requests/` | Crea nuova richiesta ferie |
| GET | `/leave/requests/<uuid:id>/` | Dettaglio richiesta ferie |
| DELETE | `/leave/requests/<uuid:id>/` | Cancella richiesta (solo se pending) |
| POST | `/leave/requests/<uuid:id>/approve/` | Approva o rifiuta richiesta |
| GET | `/leave/calendar/` | Vista calendario ferie aziendali |
| GET | `/leave/stats/` | Statistiche ferie aziendali |

### Stati Workflow Ferie
1. **PENDING** - Richiesta in attesa di approvazione
2. **APPROVED** - Richiesta approvata
3. **REJECTED** - Richiesta rifiutata
4. **CANCELLED** - Richiesta cancellata dal dipendente

### Funzionalita Implementate
- Calcolo automatico giorni lavorativi (esclude weekend)
- Supporto mezza giornata inizio/fine
- Verifica saldo disponibile
- Notifiche automatiche al manager/HR alla creazione richiesta
- Notifiche al dipendente all'approvazione/rifiuto
- Verifica limite giorni consecutivi per tipologia
- Calendario vista aziendale

---

## 2. DOCUMENTI WORKFLOW

**Stato:** ✅ ESISTENTE E COMPLETO

### Model
- `Document` (models.py) con stati: `draft`, `active`, `archived`
- `DocumentReceipt` - Ricevute di presa visione
- `SignatureRequest` - Richieste firma digitale
- `SignatureLog` - Log azioni firma

### Endpoint Registrati (urls.py)

| Metodo | Endpoint | Funzionalita |
|--------|----------|--------------|
| GET | `/documents/` | Lista documenti (con filtri: category, status, employee_id, company_id) |
| POST | `/documents/` | Carica nuovo documento |
| GET | `/documents/<uuid:id>/` | Dettaglio documento |
| PATCH | `/documents/<uuid:id>/` | Aggiorna metadati documento |
| GET | `/documents/<uuid:id>/download/` | Download file documento |
| POST | `/documents/<uuid:id>/archive/` | Archivia documento |

### Funzionalita Implementate
- Upload sicuro con path protetto (`protected/company_{id}/{year}/{month}/`)
- Sistema di visibilita documenti (company_only, consultant_only, employee_only, etc.)
- Collegamento documenti a PayrollRun tramite `PayrollDocumentLink`
- Download tracciato con AuditLog
- Gestione firme digitali (SignatureRequest, SignatureSignView)
- Ricevute presa visione (DocumentReceipt)

---

## 3. PAYROLL LIGHT

**Stato:** ✅ ESISTENTE E COMPLETO

### Model
- `PayrollRun` (models.py) con 8 stati workflow
- `PayrollDocumentLink` per collegamento documenti

### Endpoint Registrati (urls.py)

| Metodo | Endpoint | Funzionalita |
|--------|----------|--------------|
| GET | `/payroll/` | Lista payroll runs (con filtri: month, year, status, employee_id, company_id) |
| POST | `/payroll/` | Crea nuova payroll run |
| GET | `/payroll/<uuid:id>/` | Dettaglio payroll run |
| PATCH | `/payroll/<uuid:id>/` | Aggiorna payroll run |
| POST | `/payroll/<uuid:id>/change-status/` | Cambia stato payroll |
| POST | `/payroll/<uuid:id>/attach-document/` | Collega documento a payroll |
| GET | `/payroll/<uuid:id>/documents/` | Lista documenti collegati |
| GET | `/payroll/employee/mine/` | View personale dipendente |
| GET | `/payroll/company/overview/` | Overview aziendale con statistiche |
| GET | `/payroll/consultant/overview/` | Overview consulente del lavoro |
| GET | `/payroll/monthly-summary/` | Riepilogo mensile绢 |
| GET | `/payroll/assistant/` | Assistente workflow payroll |

### Stati PayrollRun Workflow
1. **DRAFT** - Bozza iniziale
2. **WAITING_DOCUMENTS** - In attesa documenti
3. **IN_PROGRESS** - In elaborazione
4. **READY_FOR_REVIEW** - Pronto per revisione
5. **APPROVED_BY_COMPANY** - Approvato dall'azienda
6. **DELIVERED_TO_EMPLOYEE** - Consegnato al dipendente
7. **CORRECTION_REQUESTED** - Correzione richiesta
8. **ARCHIVED** - Archiviato

### Funzionalita Implementate
- Controllo accesso modulo payroll (verifica piano aziendale)
- Gestione labor_consultant associato
- Note aziendali e consulente separate
- Collegamento documenti con ruoli (input, output, attachment, final_payslip)
- Assistente workflow con priorita per ruolo (consulente vs azienda)

---

## 4. AUTOMATIONS

**Stato:** ❌ DA CREARE

### Model
**AutomationRule** NON esiste nel progetto.

### Da Implementare
```python
# Nuovo model da aggiungere in models.py
class AutomationRule(models.Model):
    """Regole di automazione per azienda."""

    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='automation_rules')

    class TriggerType(models.TextChoices):
        MISSING_CLOCK_IN = 'missing_clock_in', 'Timbrazione mancante'
        PENDING_LEAVE = 'pending_leave_request', 'Ferie pending'
        DOCUMENT_EXPIRING = 'document_expiring', 'Documento in scadenza'
        MONTHLY_REPORT = 'monthly_report_due', 'Report mensile'

    class ActionType(models.TextChoices):
        NOTIFICATION = 'create_notification', 'Crea notifica'
        EMAIL = 'send_email', 'Invia email'
        TASK = 'create_task', 'Crea task'
        ALERT = 'dashboard_alert', 'Alert dashboard'

    name = models.CharField(max_length=255)
    trigger_type = models.CharField(max_length=50, choices=TriggerType.choices)
    conditions = models.JSONField(default=dict)
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    action_payload = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
```

### View/Endpoint Necessari
- `AutomationRuleViewSet` per CRUD regole
- Endpoint attivazione trigger
- Servizio elaborazione automazioni (da collegare a celery o similar)

---

## 5. NOTIFICATIONS

**Stato:** ✅ ESISTENTE

### Model
`Notification` (models.py) con le seguenti caratteristiche:

```python
class Notification(models.Model):
    # Type
    class TypeChoices(models.TextChoices):
        INFO = "info", "Info"
        SUCCESS = "success", "Successo"
        WARNING = "warning", "Avviso"
        ERROR = "error", "Errore"
        ATTENTION = "attention", "Richiede attenzione"

    # Priority
    class PriorityChoices(models.TextChoices):
        LOW = "low", "Bassa"
        MEDIUM = "medium", "Media"
        HIGH = "high", "Alta"
        URGENT = "urgent", "Urgente"
```

### Endpoint Registrati (urls.py)

| Metodo | Endpoint | Funzionalita |
|--------|----------|--------------|
| GET | `/notifications/` | Lista notifiche utente |
| POST | `/notifications/` | Crea notifica |
| POST | `/notifications/<uuid:pk>/mark-read/` | Segna come letta |
| POST | `/notifications/mark-all-read/` | Segna tutte come lette |
| GET | `/notifications/unread-count/` | Conteggio notifiche non lette |

### View
`NotificationViewSet` in `views.py`

### Funzionalita Implementate
- Notifiche automatiche per: nuovi dipendenti, ferie richieste/approvate/rifiutate, link consulente approvato
- Signal handlers per creazione automatica
- Mark as read con timestamp
- ordinamento per data creazione discendente

---

## 6. AUDIT LOG

**Stato:** ✅ ESISTENTE

### Model
`AuditLog` (models.py) con **40+ action types**

### Action Types Tracciati

| Categoria | Actions |
|-----------|---------|
| **Company** | company_created, company_registered, company_suspended, company_reactivated, company_deactivated, company_soft_deleted, company_access_reset |
| **User** | company_user_created, company_user_updated, company_user_disabled, role_assigned, password_reset, invite_generated |
| **Employee** | employee_created, employee_updated, employee_suspended, employee_reactivated |
| **Attendance** | attendance_corrected, attendance_day_approved, attendance_month_approved, anomaly_reviewed |
| **Consultant** | consultant_access, consultant_link_requested, consultant_link_approved, consultant_link_rejected, consultant_link_removed |
| **Document** | document_uploaded, document_downloaded, document_archived |
| **Payroll** | payroll_created, payroll_status_changed, payroll_approved, payroll_correction_requested, payroll_delivered |
| **Leave** | leave_requested, leave_approved, leave_rejected, leave_cancelled |
| **Security** | unauthorized_access_attempt |

### Endpoint
AuditLog utilizzato come servizio (log_audit_event) non esposto come API pubblica.

---

## 7. PRESENZE / TIMBRATURE

**Stato:** ✅ ESISTENTE E COMPLETO

### Model
- `TimeEntry` (models.py) - Entry timbrature
- `AttendanceDayReview` - Revisione giornaliera presenze
- `AttendancePeriod` - Periodo presenze (mese)
- `AttendanceCorrection` - Correzioni timbrature

### Endpoint Registrati (urls.py)

| Metodo | Endpoint | Funzionalita |
|--------|----------|--------------|
| POST | `/time/check-in/` | Check-in |
| POST | `/time/check-out/` | Check-out |
| POST | `/time/break-start/` | Inizio pausa |
| POST | `/time/break-end/` | Fine pausa |
| GET | `/time/today/` | Vista timbrature odierne |
| GET | `/time/history/` | Storico timbrature |
| GET | `/time/company/overview/` | Overview presenze aziendali |
| GET | `/time/company/daily-review/` | Revisione giornaliera |
| POST | `/time/company/correct-entry/` | Correzione timbratura |
| POST | `/time/company/approve-day/` | Approva giorno |
| POST | `/time/company/approve-month/` | Approva mese |
| GET | `/time/workflow-assistant/` | Assistente workflow presenze |
| GET | `/time/consultant/companies/` | Companies per consulente |
| GET | `/time/consultant/company-overview/` | Overview azienda per consulente |
| GET | `/time/monthly-summary/` | Riepilogo mensile |
| POST | `/time/check-in-gps/` | Check-in con geolocalizzazione |
| POST | `/time/check-out-gps/` | Check-out con geolocalizzazione |

### Stati AttendanceDayReview
1. **DRAFT** - Bozza
2. **REVIEW_NEEDED** - Richiede revisione (anomalie rilevate)
3. **APPROVED** - Approvato
4. **CORRECTED** - Corretto

### Stati AttendancePeriod
1. **OPEN** - Aperto
2. **IN_REVIEW** - In revisione
3. **APPROVED** - Approvato
4. **CLOSED** - Chiuso
5. **EXPORTED** - Esportato

### Funzionalita Implementate
- Check-in/check-out con geolocalizzazione (GPS)
- Supporto geofence (OfficeLocation con lat/lng/radius)
- Break start/end per pausa pranzo
- Revisione anomalie giornaliere
- Approvazione mese presenze
- Correzioni timbrature con history
- Notifiche per anomalie
- Supporto offline (OfflineTimeEntry model)
- Integration with MedicalCertificate per malattie

---

## 8. PRIORITA DI IMPLEMENTAZIONE

### bassa Priorita (gia esistente)
1. **Ferie Workflow** - Completamente funzionante
2. **Documenti Workflow** - Completamente funzionante
3. **Payroll Light** - Completamente funzionante
4. **Notifications** - Completamente funzionante
5. **Audit Log** - Completamente funzionante
6. **Presenze/Timbrature** - Completamente funzionante

### Alta Priorita (DA CREARE)

| Priorita | Componente | Descrizione | Effort |
|----------|------------|-------------|--------|
| 1 | **AutomationRule Model** | Model base per regole automazione | Basso |
| 2 | **AutomationRule Views** | CRUD per regole | Medio |
| 3 | **Automation Engine Service** | Elaborazione trigger/action | Alto |
| 4 | **Celery Integration** | Task asincroni per automazioni | Alto |

---

## 9. FASI MANUALE PulseHR - STATO

| Fase | Componente | Stato | Note |
|------|------------|-------|------|
| FASE 1-4 | Autenticazione e Anagrafica | N/A | gia implementato |
| FASE 5 | Workflow Ferie | ✅ COMPLETO | Model + View + URL |
| FASE 6 | Workflow Documenti | ✅ COMPLETO | Model + View + URL |
| FASE 7 | Workflow Payroll | ✅ COMPLETO | Model + View + URL |
| FASE 8 | Automation Engine | ❌ DA IMPLEMENTARE | Solo model da creare |
| FASE 9 | Notification System | ✅ COMPLETO | gia integrato |
| FASE 10 | Presenze/Timbrature | ✅ COMPLETO | Model + View + URL |

---

## 10. OSSERVAZIONI

### Puntidi Forza
- Architettura workflow ben definita con stati chiari
- Integrazione completa tra modulo ferie e notifiche
- Supporto multi-ruolo per approvazioni (owner, hr_manager, manager)
- Gestione geofencing per timbrature
- Sistema audit completo per compliance

### Aree di Miglioramento
- **AutomationRule**: Manca completamente - blocca automazioni BP
- **Signal handlers**: gia presenti per alcuni eventi, estendibili per automation
- **Celery/Task Queue**: Non presente nei file analizzati, necessario per automazioni

### Dipendenze
- AutomationRule richiede Celery per elaborazione task asincroni
- Notification gia implementato ma potrebbe essere esteso con canali email/push

---

*Report generato automaticamente da PulseHR Workflow Analyzer*

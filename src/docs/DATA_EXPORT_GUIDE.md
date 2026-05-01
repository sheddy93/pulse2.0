# Data Export Guide - AldevionHR

Questa guida documenta come esportare dati per GDPR compliance e migrazioni.

## 1. Export Azienda

**Endpoint**: `GET /api/v1/company/{company_id}/export`  
**Permission**: company_owner, super_admin  
**Format**: JSON  
**Size**: ~500KB per azienda media

### Dati inclusi
```json
{
  "company": {
    "id": "...",
    "name": "...",
    "email": "...",
    "tax_id": "...",
    "created_date": "...",
    "settings": { ... }
  },
  "exported_at": "2026-05-01T10:00:00Z",
  "employee_count": 150,
  "document_count": 350
}
```

### Implementazione (Future)
```javascript
// functions/exportCompany.js
Deno.serve(async (req) => {
  const { company_id } = req.params;
  const company = await base44.entities.Company.get(company_id);
  
  const export_data = {
    company,
    exported_at: new Date().toISOString(),
    employee_count: await countEmployees(company_id),
    document_count: await countDocuments(company_id),
  };
  
  return Response.json(export_data);
});
```

---

## 2. Export Dipendenti

**Endpoint**: `GET /api/v1/employees/export`  
**Permission**: company_owner, hr_manager, super_admin  
**Format**: CSV, Excel, JSON  

### CSV Schema
```
ID,Nome,Email,Ruolo,Dipartimento,Data Assunzione,Stato,Stipendio*
001,Mario Rossi,mario@company.it,Manager,IT,2020-01-15,active,2500
002,Anna Bianchi,anna@company.it,Employee,HR,2021-06-10,active,1800
```

### JSON Schema
```json
[
  {
    "id": "001",
    "first_name": "Mario",
    "last_name": "Rossi",
    "email": "mario@company.it",
    "job_title": "Manager",
    "department": "IT",
    "hire_date": "2020-01-15",
    "status": "active",
    "phone": "...",
    "address": "...",
    "salary": 2500
  }
]
```

### Implementazione (Future)
```javascript
// functions/exportEmployees.js
Deno.serve(async (req) => {
  const { format } = req.query; // csv, json, excel
  const { company_id } = req.body;
  
  const employees = await base44.entities.EmployeeProfile
    .filter({ company_id });
  
  if (format === 'csv') {
    const csv = convertToCSV(employees);
    return new Response(csv, {
      headers: { 'Content-Type': 'text/csv' }
    });
  }
  
  return Response.json(employees);
});
```

---

## 3. Export Presenze

**Endpoint**: `GET /api/v1/attendance/export`  
**Permission**: company_owner, manager, hr_manager  
**Format**: CSV, Excel  
**Date Range**: Customizable (es. 1 mese, 1 anno)

### CSV Schema
```
Data,Dipendente,Tipo,Ora Inizio,Ora Fine,Durata (h),Nota
2026-05-01,Mario Rossi,check-in,08:00,17:30,8.5,Regolare
2026-05-01,Anna Bianchi,check-in,09:00,13:00,4.0,Permesso pomeriggio
```

### Filtri disponibili
- Date range: `from=2026-01-01&to=2026-05-01`
- Dipendente: `employee_id=001`
- Tipo: `type=check-in,break_start,break_end`
- Anomalie only: `anomalies_only=true`

### Implementazione (Future)
```javascript
// functions/exportAttendance.js
Deno.serve(async (req) => {
  const { company_id, from, to, format } = req.body;
  
  const entries = await base44.entities.AttendanceEntry
    .filter({
      company_id,
      created_date: { $gte: from, $lte: to }
    });
  
  return formatExport(entries, format);
});
```

---

## 4. Export Ferie

**Endpoint**: `GET /api/v1/leave/export`  
**Permission**: company_owner, hr_manager  
**Format**: CSV, Excel  

### CSV Schema
```
Dipendente,Tipo,Data Inizio,Data Fine,Giorni,Status,Approvato Da
Mario Rossi,Ferie,2026-06-01,2026-06-15,15,approved,Anna Bianchi
Anna Bianchi,Permesso,2026-05-10,2026-05-10,1,pending,-
```

### Dati inclusi
- Richieste approvate
- Richieste pending
- Richieste rifiutate
- Saldo ferie per dipendente
- Approvatore
- Note

---

## 5. Export Documenti (Metadata)

**Endpoint**: `GET /api/v1/documents/export`  
**Permission**: company_owner, hr_manager  
**Format**: JSON, CSV  
**Note**: Non include contenuto file (privacy)

### JSON Schema
```json
[
  {
    "id": "doc_001",
    "title": "Contratto Mario Rossi",
    "type": "employment_contract",
    "employee_id": "001",
    "uploaded_date": "2020-01-15",
    "expiry_date": "2030-01-15",
    "status": "approved",
    "signature_required": true,
    "signature_status": "signed",
    "file_url": "[REDACTED]",
    "file_name": "contratto_rossi.pdf",
    "file_size_kb": 250
  }
]
```

### Esclusioni (Privacy)
- File URL (solo nome e size)
- Contenuto file
- Indirizzi IP uploader

---

## 6. Export Audit Log

**Endpoint**: `GET /api/v1/audit/export`  
**Permission**: super_admin, company_owner  
**Format**: JSON, CSV  
**Date Range**: Customizable

### JSON Schema
```json
[
  {
    "timestamp": "2026-04-01T10:30:00Z",
    "actor_email": "hr@company.it",
    "action": "create",
    "entity": "EmployeeProfile",
    "entity_id": "emp_001",
    "company_id": "comp_123",
    "old_value": null,
    "new_value": { "name": "Mario Rossi", ... },
    "ip_address": "192.168.1.1",
    "success": true
  }
]
```

### Filtri
- Date range: `from=2026-01-01&to=2026-05-01`
- Entity type: `entity=EmployeeProfile,LeaveRequest`
- Action: `action=create,update,delete`
- Actor: `actor_email=hr@company.it`

---

## GDPR Data Subject Request (DSR)

### 1. Export Dati Personali Dipendente

**Endpoint**: `GET /api/v1/me/export-personal-data`  
**Permission**: Authenticated employee (own data only)  
**Format**: ZIP contenente:
- profile.json
- attendance.csv (12 ultimi mesi)
- leave_requests.csv
- documents.json (metadata)
- messages.json
- performance_reviews.json

### Implementazione
```javascript
// functions/exportPersonalData.js
Deno.serve(async (req) => {
  const user = await base44.auth.me();
  const employee = await findEmployeeByEmail(user.email);
  
  const data = {
    profile: employee,
    attendance: await getAttendance(employee.id, '12m'),
    leave_requests: await getLeaveRequests(employee.id),
    documents: await getDocuments(employee.id),
    messages: await getMessages(employee.id),
    performance_reviews: await getReviews(employee.id),
  };
  
  return createZip(data);
});
```

### Response
```
employee-data-2026-05-01.zip
├── profile.json
├── attendance.csv
├── leave_requests.csv
├── documents.json
├── messages.json
└── performance_reviews.json
```

---

## GDPR Delete Request (Right to be Forgotten)

### 1. Eliminazione Dipendente

**Endpoint**: `DELETE /api/v1/me/account`  
**Permission**: Authenticated user (own account only)  
**Process**:
1. Soft-delete user record
2. Anonymize in audit logs (hash email)
3. Remove dari Stripe/integrations
4. Scheduled hard-delete dopo 30 giorni (cancellation_period)

### Implementazione
```javascript
// functions/deleteUserAccount.js
Deno.serve(async (req) => {
  const user = await base44.auth.me();
  
  // Soft delete
  await base44.entities.User.update(user.id, {
    deleted_at: new Date(),
    status: 'deleted'
  });
  
  // Anonymize audit logs
  await anonymizeAuditLogs(user.id);
  
  // Schedule hard delete
  scheduleHardDelete(user.id, '30d');
  
  // Log per compliance
  await base44.entities.AuditLog.create({
    action: 'gdpr_deletion_requested',
    entity: 'User',
    entity_id: user.id,
    actor_email: user.email,
    company_id: user.company_id,
    timestamp: new Date(),
  });
});
```

---

## Data Portability Timeline

| Tipo | Disponibile Entro | Conservato | Cancellabile |
|------|-------------------|-----------|-------------|
| Export Azienda | Immediato | - | No (audit) |
| Export Dipendenti | Entro 24h | 7 anni | Sì (soft) |
| Export Presenze | Entro 48h | 7 anni | Sì |
| Export Ferie | Entro 48h | 7 anni | Sì |
| Export Documenti | Entro 48h | 7 anni | Sì (metadata) |
| Export Audit | Entro 72h | 7 anni | No |
| Dati Personali | Entro 1h | - | Sì (soft dopo 30d) |

---

## Compliance Checklist

- [ ] GDPR Article 15: Right of access ✓
- [ ] GDPR Article 20: Right to data portability ✓
- [ ] GDPR Article 17: Right to be forgotten ✓
- [ ] GDPR Article 12: Communication clear/transparent ✓
- [ ] Audit log immutable ✓
- [ ] Retention policy documentata ✓
- [ ] Anonymization process ✓
- [ ] Deletion workflow testato ✓

---

**Last Updated**: 2026-05-01  
**Status**: Planning (implementazione futura)
# API Contract - AldevionHR NestJS Backend

**Target API Version**: 1.0  
**Format**: REST/JSON  
**Authentication**: JWT Bearer Token + HttpOnly Cookie  
**Base URL**: `https://api.aldevionhr.com/api`

---

## Authentication Endpoints

### POST /auth/login
Login con email/password

**Request**:
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "usr_123",
    "email": "user@company.com",
    "full_name": "John Doe",
    "role": "employee",
    "company_id": "cmp_123"
  }
}
```

### POST /auth/logout
Logout (revoca token)

**Request**: Empty body

**Response (200)**: `{ "success": true }`

### GET /auth/me
Profilo utente corrente

**Response (200)**:
```json
{
  "id": "usr_123",
  "email": "user@company.com",
  "full_name": "John Doe",
  "role": "employee",
  "company_id": "cmp_123",
  "employee_id": "emp_123",
  "permissions": ["view_dashboard", "create_attendance", ...]
}
```

### POST /auth/refresh
Refresh token scaduto

**Request**:
```json
{ "refresh_token": "..." }
```

### POST /auth/password-reset
Richiesta reset password

**Request**:
```json
{ "email": "user@company.com" }
```

---

## Companies Endpoints

### GET /companies
Lista aziende

**Query Params**:
- `skip`: numero di record da saltare
- `take`: numero di record da restituire (max 100)
- `search`: search per nome

**Response (200)**:
```json
{
  "data": [
    {
      "id": "cmp_123",
      "name": "Acme Corp",
      "email": "info@acme.com",
      "phone": "+39 02 1234 5678",
      "website": "https://acme.com",
      "employees_count": 150,
      "status": "active",
      "subscription_status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50,
  "skip": 0,
  "take": 10
}
```

### POST /companies
Crea nuova azienda (admin only)

**Request**:
```json
{
  "name": "New Company",
  "email": "info@newcompany.com",
  "phone": "+39 02 1234 5678",
  "website": "https://newcompany.com",
  "industry": "Technology"
}
```

### GET /companies/:id
Dettagli azienda

### PATCH /companies/:id
Aggiorna azienda

### DELETE /companies/:id
Cancella azienda (archive)

---

## Employees Endpoints

### GET /employees
Lista dipendenti (filtrato per tenant corrente)

**Query Params**:
- `department_id`: filtra per dipartimento
- `status`: active, inactive, terminated
- `search`: search per nome/email

**Response (200)**:
```json
{
  "data": [
    {
      "id": "emp_123",
      "full_name": "Mario Rossi",
      "email": "mario@company.com",
      "phone": "+39 334 1234 567",
      "position": "Engineer",
      "department_id": "dept_456",
      "department_name": "Engineering",
      "employment_type": "full_time",
      "status": "active",
      "start_date": "2023-01-15",
      "end_date": null,
      "avatar_url": "https://...",
      "created_at": "2023-01-15T10:00:00Z"
    }
  ],
  "total": 150,
  "skip": 0,
  "take": 20
}
```

### POST /employees
Crea dipendente

**Request**:
```json
{
  "full_name": "Mario Rossi",
  "email": "mario@company.com",
  "phone": "+39 334 1234 567",
  "position": "Engineer",
  "department_id": "dept_456",
  "employment_type": "full_time",
  "start_date": "2024-06-01"
}
```

### GET /employees/:id
Dettagli dipendente

### PATCH /employees/:id
Aggiorna dipendente

### DELETE /employees/:id
Cancella/archive dipendente

### POST /employees/import-csv
Importa dipendenti da CSV

**Request**: multipart/form-data con file CSV

**CSV Format**:
```
full_name,email,phone,position,department_id,employment_type,start_date
Mario Rossi,mario@company.com,+39 334 1234 567,Engineer,dept_456,full_time,2024-06-01
```

### GET /employees/export
Esporta dipendenti in CSV/Excel

**Query Params**:
- `format`: csv, excel, pdf
- `filters`: JSON string con filtri

---

## Attendance Endpoints

### POST /attendance/check-in
Timbratura entrata

**Request**:
```json
{
  "latitude": 45.5017,
  "longitude": 9.1603,
  "notes": "office"
}
```

**Response (201)**:
```json
{
  "id": "att_123",
  "employee_id": "emp_123",
  "entry_type": "check_in",
  "timestamp": "2024-05-01T08:30:00Z",
  "latitude": 45.5017,
  "longitude": 9.1603,
  "geofence_valid": true,
  "ip_address": "203.0.113.45"
}
```

### POST /attendance/check-out
Timbratura uscita

### GET /attendance/entries
Lista presenze per dipendente

**Query Params**:
- `start_date`: ISO 8601
- `end_date`: ISO 8601
- `employee_id`: (admin only per altri utenti)

### GET /attendance/today
Presenze di oggi per utente corrente

### GET /attendance/summary
Riepilogo presenze (weekly/monthly)

**Query Params**:
- `period`: week, month, custom
- `start_date`: per custom
- `end_date`: per custom

### GET /attendance/day-reviews
Liste approvazioni presenze (manager view)

### PATCH /attendance/day-reviews/:id/approve
Approva giornata di lavoro

**Request**:
```json
{
  "notes": "OK"
}
```

### PATCH /attendance/day-reviews/:id/reject
Rifiuta giornata

**Request**:
```json
{
  "rejection_reason": "Inconsistency detected"
}
```

---

## Leave Endpoints

### GET /leave/requests
Lista richieste ferie

**Query Params**:
- `status`: pending, approved, rejected
- `employee_id`: (admin/manager only)

### POST /leave/requests
Crea richiesta ferie

**Request**:
```json
{
  "leave_type": "vacation",
  "start_date": "2024-06-10",
  "end_date": "2024-06-15",
  "reason": "Summer vacation"
}
```

### GET /leave/requests/:id
Dettagli richiesta

### PATCH /leave/requests/:id/approve
Approva richiesta (manager/admin)

### PATCH /leave/requests/:id/reject
Rifiuta richiesta

**Request**:
```json
{
  "rejection_reason": "Budget constraints"
}
```

### GET /leave/balances
Saldi ferie per dipendente

**Query Params**:
- `year`: anno (default: current)

**Response (200)**:
```json
{
  "id": "bal_123",
  "employee_id": "emp_123",
  "year": 2024,
  "vacation_available": 20,
  "vacation_used": 5,
  "vacation_balance": 15,
  "permissions_available": 8,
  "permissions_used": 2,
  "permissions_balance": 6
}
```

### GET /leave/calendar
Calendario ferie (company wide)

---

## Documents Endpoints

### GET /documents
Lista documenti

**Query Params**:
- `category`: contract, payslip, certificate, etc
- `employee_id`: (admin only)
- `search`: search per titolo

### POST /documents
Upload documento

**Request**: multipart/form-data
```
file: [binary]
title: "Employment Contract"
category: "contract"
employee_id: "emp_123"
expiry_date: "2025-12-31"
```

### GET /documents/:id
Dettagli documento

### PATCH /documents/:id
Aggiorna metadati documento

### DELETE /documents/:id
Cancella documento

### POST /documents/request-upload-url
Richiedi URL firmato per upload (R2/S3)

**Request**:
```json
{
  "file_name": "contract.pdf",
  "file_type": "application/pdf",
  "file_size": 1024000
}
```

**Response (200)**:
```json
{
  "upload_url": "https://r2.example.com/...",
  "storage_key": "documents/emp_123/contract.pdf"
}
```

### GET /documents/:id/download-url
Richiedi URL firmato per download

**Response (200)**:
```json
{
  "download_url": "https://r2.example.com/...",
  "expires_in": 3600
}
```

---

## Billing Endpoints

### GET /billing/status
Status abbonamento azienda

**Response (200)**:
```json
{
  "plan": "professional",
  "status": "active",
  "current_period_start": "2024-05-01",
  "current_period_end": "2024-06-01",
  "amount": 99.00,
  "interval": "monthly",
  "next_billing_date": "2024-06-01",
  "stripe_customer_id": "cus_...",
  "stripe_subscription_id": "sub_..."
}
```

### GET /billing/plans
Lista piani disponibili

### POST /billing/create-checkout-session
Crea sessione Stripe Checkout

**Request**:
```json
{
  "plan_id": "plan_123",
  "billing_interval": "monthly",
  "addons": [
    { "addon_id": "addon_1", "quantity": 5 }
  ]
}
```

**Response (201)**:
```json
{
  "session_id": "cs_...",
  "url": "https://checkout.stripe.com/pay/..."
}
```

### GET /billing/customer-portal
URL portale cliente Stripe

### POST /billing/cancel-subscription
Cancella abbonamento

---

## Webhooks

### POST /webhooks/stripe
Webhook Stripe per pagamenti/fatturazione

**Headers**:
```
Stripe-Signature: t=...,v1=...
```

**Events**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## Admin Endpoints

### GET /admin/companies
(admin only) Lista tutte aziende

### GET /admin/users
(admin only) Lista utenti

### GET /admin/subscriptions
(admin only) Lista abbonamenti

### GET /admin/audit-logs
(admin only) Audit log

**Query Params**:
- `entity_type`: company, employee, attendance, etc
- `action`: create, update, delete
- `start_date`: ISO 8601
- `end_date`: ISO 8601

---

## Error Responses

Tutti gli errori ritornano lo stesso formato:

```json
{
  "status_code": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2024-05-01T10:30:00Z",
  "path": "/api/employees"
}
```

**HTTP Status Codes**:
- `200`: OK
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error

---

**Version**: 1.0  
**Last Updated**: 2026-05-01  
**Next Review**: 2026-06-01
# PulseHR API Contract (REST)

**Status:** Design phase, pre-implementation
**Version:** 1.0 (Target for Q2 2026)
**Authentication:** JWT Bearer token
**Rate Limit:** 100 req/min per user

---

## 📚 Endpoints (Organized by Feature)

### **AUTHENTICATION (Public)**

```http
POST /api/v1/auth/login
Content-Type: application/json
{
  "email": "user@company.com",
  "password": "..."
}

Response 200:
{
  "access_token": "jwt...",
  "refresh_token": "jwt...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "full_name": "John Doe",
    "role": "manager",
    "company_id": "uuid"
  }
}
```

```http
POST /api/v1/auth/refresh
Authorization: Bearer {refresh_token}

Response 200:
{
  "access_token": "jwt...",
  "expires_in": 3600
}
```

---

### **EMPLOYEES**

```http
GET /api/v1/employees
Authorization: Bearer {token}
Query Params: ?company_id=uuid&status=active&limit=50&offset=0

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@company.com",
      "employee_code": "EMP-001",
      "job_title": "Software Engineer",
      "department": "Engineering",
      "location": "Rome HQ",
      "manager": "manager@company.com",
      "hire_date": "2024-01-15",
      "status": "active"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 250
  }
}
```

```http
POST /api/v1/employees
Authorization: Bearer {token}
Content-Type: application/json
{
  "company_id": "uuid",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@company.com",
  "job_title": "HR Manager",
  "department": "HR",
  "hire_date": "2026-05-01"
}

Response 201:
{
  "id": "uuid",
  "created_at": "2026-05-01T10:00:00Z"
}
```

```http
PUT /api/v1/employees/{id}
Authorization: Bearer {token}
Content-Type: application/json
{
  "job_title": "Senior Engineer",
  "department": "Tech Leadership"
}

Response 200:
{
  "id": "uuid",
  "updated_at": "2026-05-01T10:05:00Z"
}
```

```http
DELETE /api/v1/employees/{id}
Authorization: Bearer {token}

Response 204
```

---

### **ATTENDANCE**

```http
GET /api/v1/attendance
Query Params: ?employee_id=uuid&start_date=2026-05-01&end_date=2026-05-31&limit=100

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "employee_id": "uuid",
      "timestamp": "2026-05-01T09:00:00Z",
      "type": "check_in",
      "location": "Rome HQ",
      "latitude": 41.9028,
      "longitude": 12.4964
    }
  ]
}
```

```http
POST /api/v1/attendance/check-in
Authorization: Bearer {token}
Content-Type: application/json
{
  "employee_id": "uuid",
  "latitude": 41.9028,
  "longitude": 12.4964
}

Response 201:
{
  "id": "uuid",
  "timestamp": "2026-05-01T09:00:00Z",
  "type": "check_in"
}
```

---

### **LEAVE REQUESTS**

```http
GET /api/v1/leave-requests
Query Params: ?company_id=uuid&status=pending&limit=50

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "employee_id": "uuid",
      "leave_type": "ferie",
      "start_date": "2026-06-01",
      "end_date": "2026-06-10",
      "days_count": 8,
      "status": "pending",
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

```http
POST /api/v1/leave-requests
Authorization: Bearer {token}
Content-Type: application/json
{
  "employee_id": "uuid",
  "leave_type": "ferie",
  "start_date": "2026-06-01",
  "end_date": "2026-06-10",
  "note": "Summer vacation"
}

Response 201:
{
  "id": "uuid",
  "status": "pending"
}
```

```http
POST /api/v1/leave-requests/{id}/approve
Authorization: Bearer {token}
Content-Type: application/json
{
  "manager_note": "Approved"
}

Response 200:
{
  "id": "uuid",
  "status": "manager_approved"
}
```

---

### **ANALYTICS (AI-Powered)**

```http
POST /api/v1/analytics/query
Authorization: Bearer {token}
Content-Type: application/json
{
  "company_id": "uuid",
  "query": "Show me absenteeism trends by department",
  "filters": {
    "date_range": "last_30_days",
    "departments": ["Engineering", "Sales"]
  }
}

Response 200:
{
  "analysis": "Based on attendance data...",
  "insights": [
    "Engineering team has 15% higher absenteeism than company average",
    "Mondays show 20% higher absence rate"
  ],
  "recommendations": [
    "Investigate Monday patterns",
    "Consider flexible scheduling"
  ],
  "charts": [
    {
      "type": "line",
      "title": "Absenteeism Trend",
      "data": [...]
    }
  ]
}
```

---

### **INTEGRATIONS**

```http
GET /api/v1/integrations
Authorization: Bearer {token}
Query Params: ?company_id=uuid

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "type": "slack",
      "status": "connected",
      "name": "Company Slack",
      "connected_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

```http
POST /api/v1/integrations/{type}/connect
Authorization: Bearer {token}
Content-Type: application/json
{
  "company_id": "uuid",
  "config": {
    "slack_channel": "#hr-approvals"
  }
}

Response 200:
{
  "connect_url": "https://slack.com/oauth/authorize?..."
}
```

```http
POST /api/v1/integrations/{type}/disconnect
Authorization: Bearer {token}

Response 204
```

---

### **DOCUMENTS**

```http
GET /api/v1/documents
Query Params: ?employee_id=uuid&status=in_revisione

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "title": "Employment Contract",
      "doc_type": "contratto",
      "employee_id": "uuid",
      "signature_required": true,
      "signature_status": "pending",
      "expiry_date": "2027-05-01"
    }
  ]
}
```

```http
POST /api/v1/documents/{id}/sign
Authorization: Bearer {token}
Content-Type: application/json
{
  "signature_data": "base64..."
}

Response 200:
{
  "id": "uuid",
  "signature_status": "signed",
  "signed_at": "2026-05-01T10:00:00Z"
}
```

---

### **REPORTS**

```http
POST /api/v1/reports/generate
Authorization: Bearer {token}
Content-Type: application/json
{
  "company_id": "uuid",
  "report_type": "payroll",
  "format": "pdf",
  "date_range": {
    "start": "2026-05-01",
    "end": "2026-05-31"
  }
}

Response 202 (Async)
{
  "job_id": "uuid",
  "status": "processing",
  "estimated_completion": "2026-05-01T11:00:00Z"
}
```

```http
GET /api/v1/reports/{job_id}
Authorization: Bearer {token}

Response 200:
{
  "job_id": "uuid",
  "status": "completed",
  "file_url": "https://storage.pulseh.io/..."
}
```

---

## 🔐 Error Responses

```http
HTTP 400 Bad Request
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "details": {
    "email": "must be valid email"
  }
}
```

```http
HTTP 401 Unauthorized
{
  "error": "AUTH_REQUIRED",
  "message": "Missing or invalid authorization token"
}
```

```http
HTTP 403 Forbidden
{
  "error": "PERMISSION_DENIED",
  "message": "User does not have permission to access this resource"
}
```

```http
HTTP 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Max 100 per minute",
  "retry_after": 45
}
```

```http
HTTP 500 Internal Server Error
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred",
  "request_id": "uuid"
}
```

---

## 📝 Request/Response Validation (Zod)

```typescript
// Example: CreateEmployeePayload
export const CreateEmployeePayload = z.object({
  company_id: z.string().uuid(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  job_title: z.string().min(1).max(100),
  department: z.string().optional(),
  hire_date: z.coerce.date(),
});

// Usage in backend function:
const payload = CreateEmployeePayload.parse(req.body);
```

---

## 🔄 Pagination Standard

All list endpoints return:
```json
{
  "data": [],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1000,
    "has_more": true
  }
}
```

---

## 🎯 Implementation Roadmap

| Endpoint Group | Q2 | Q3 | Q4 |
|---|---|---|---|
| Auth | ✅ | - | - |
| Employees | ✅ | - | - |
| Attendance | ✅ | - | - |
| Leave | ✅ | - | - |
| Analytics | ⚠️ | ✅ | - |
| Integrations | ⚠️ | ✅ | - |
| Documents | - | ✅ | - |
| Reports | - | ✅ | - |
| Webhooks | - | ⚠️ | ✅ |
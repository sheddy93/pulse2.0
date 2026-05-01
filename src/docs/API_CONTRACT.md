# AldevionHR REST API Contract

**Status**: Blueprint (Endpoints defined, implementations in progress)  
**Base URL**: `http://localhost:3000/api` (development) | `https://api.aldevionhr.com` (production)  
**Auth**: JWT Bearer token in `Authorization` header  
**Response Format**: JSON with `{ data, status, headers }`

---

## 🔐 Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "employee",
      "company_id": "company_456"
    }
  }
}
```

---

### POST /auth/logout
Logout (clears session cookie).

**Response** (200):
```json
{ "data": { "success": true } }
```

---

### GET /auth/me
Get current authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "employee",
    "company_id": "company_456"
  }
}
```

---

### POST /auth/refresh
Refresh JWT token.

**Response** (200):
```json
{
  "data": { "token": "eyJhbGc..." }
}
```

---

### POST /auth/password-reset
Request password reset email.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "data": { "message": "Password reset email sent" }
}
```

---

### POST /auth/change-password
Change password (requires auth).

**Request**:
```json
{
  "oldPassword": "current123",
  "newPassword": "newSecure456"
}
```

**Response** (200):
```json
{
  "data": { "message": "Password changed successfully" }
}
```

---

## 🏢 Companies Endpoints

### GET /companies
List companies (admin only).

**Query Params**:
- `skip`: 0
- `limit`: 50
- `search`: string

**Response** (200):
```json
{
  "data": [
    {
      "id": "company_123",
      "name": "Acme Corp",
      "email": "info@acme.com",
      "subscription_status": "active",
      "plan": "professional",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /companies/:id
Get company details.

**Response** (200):
```json
{
  "data": {
    "id": "company_123",
    "name": "Acme Corp",
    ...
  }
}
```

---

### POST /companies
Create company (admin only).

**Request**:
```json
{
  "name": "New Company",
  "email": "contact@newco.com",
  "phone": "+39123456789",
  "industry": "Technology"
}
```

**Response** (201):
```json
{
  "data": {
    "id": "company_789",
    "name": "New Company",
    ...
  }
}
```

---

### PATCH /companies/:id
Update company.

**Request**:
```json
{
  "name": "Updated Name",
  "phone": "+39987654321"
}
```

**Response** (200):
```json
{
  "data": {
    "id": "company_123",
    "name": "Updated Name",
    ...
  }
}
```

---

### DELETE /companies/:id
Delete company (soft delete).

**Response** (200):
```json
{
  "data": { "success": true }
}
```

---

## 👥 Employees Endpoints

### GET /employees
List employees with filters.

**Query Params**:
- `company_id`: string (required)
- `status`: active|inactive|onboarding
- `department_id`: string
- `search`: string
- `skip`: 0
- `limit`: 50

**Response** (200):
```json
{
  "data": [
    {
      "id": "emp_123",
      "company_id": "company_456",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john@acme.com",
      "job_title": "Software Engineer",
      "hire_date": "2025-01-15",
      "status": "active",
      "department_id": "dept_789",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /employees/:id
Get employee details.

**Response** (200):
```json
{
  "data": {
    "id": "emp_123",
    ...
  }
}
```

---

### POST /employees
Create employee.

**Request**:
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@acme.com",
  "job_title": "Designer",
  "hire_date": "2026-05-01",
  "department_id": "dept_789",
  "employment_type": "full-time"
}
```

**Response** (201):
```json
{
  "data": {
    "id": "emp_999",
    "first_name": "Jane",
    ...
  }
}
```

---

### PATCH /employees/:id
Update employee.

**Request**:
```json
{
  "job_title": "Senior Designer",
  "status": "inactive"
}
```

**Response** (200):
```json
{
  "data": {
    "id": "emp_123",
    ...
  }
}
```

---

### DELETE /employees/:id
Delete employee (soft delete).

**Response** (200):
```json
{
  "data": { "success": true }
}
```

---

### POST /employees/import
Import employees from CSV.

**Request**: multipart/form-data
- `file`: CSV file

**Response** (200):
```json
{
  "data": {
    "imported": 50,
    "errors": []
  }
}
```

---

### GET /employees/export
Export employees as CSV.

**Query Params**:
- `company_id`: string
- `filters`: JSON string

**Response** (200): CSV file download

---

## ⏰ Attendance Endpoints

### POST /attendance/check-in
Clock in.

**Request**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2026-05-01T09:00:00Z"
}
```

**Response** (201):
```json
{
  "data": {
    "id": "entry_123",
    "employee_id": "emp_456",
    "type": "check_in",
    "timestamp": "2026-05-01T09:00:00Z",
    "location_name": "Office - Main Floor",
    "status": "pending"
  }
}
```

---

### POST /attendance/check-out
Clock out.

**Response** (201): Similar to check-in with type: "check_out"

---

### POST /attendance/break-start
Start break.

**Response** (201): Similar to check-in with type: "break_start"

---

### POST /attendance/break-end
End break.

**Response** (201): Similar to check-in with type: "break_end"

---

### GET /attendance/today
Get today's entries for current employee.

**Response** (200):
```json
{
  "data": [
    {
      "id": "entry_123",
      "type": "check_in",
      "timestamp": "2026-05-01T09:00:00Z",
      ...
    },
    {
      "id": "entry_124",
      "type": "check_out",
      "timestamp": "2026-05-01T17:30:00Z",
      ...
    }
  ]
}
```

---

### GET /attendance/entries
Get attendance entries in date range.

**Query Params**:
- `employee_id`: string
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD

**Response** (200): Array of entries

---

### GET /attendance/summary
Get daily summary (hours worked, breaks, etc).

**Query Params**:
- `employee_id`: string
- `date`: YYYY-MM-DD

**Response** (200):
```json
{
  "data": {
    "date": "2026-05-01",
    "employee_id": "emp_123",
    "check_in": "2026-05-01T09:00:00Z",
    "check_out": "2026-05-01T17:30:00Z",
    "total_hours": 8.5,
    "breaks_duration": 0.5,
    "location_name": "Office - Main Floor",
    "status": "pending"
  }
}
```

---

### GET /attendance/day-reviews
Get pending day reviews (admin).

**Query Params**:
- `company_id`: string
- `status`: pending|approved|rejected

**Response** (200): Array of reviews

---

### PATCH /attendance/day-reviews/:id/approve
Approve day review.

**Request**:
```json
{
  "notes": "OK"
}
```

**Response** (200): Updated review

---

### PATCH /attendance/day-reviews/:id/reject
Reject day review.

**Request**:
```json
{
  "reason": "GPS discrepancy"
}
```

**Response** (200): Updated review

---

## 🏖️ Leave Endpoints

### GET /leave/requests
List leave requests.

**Query Params**:
- `company_id`: string
- `status`: pending|approved|rejected|cancelled
- `employee_id`: string

**Response** (200):
```json
{
  "data": [
    {
      "id": "leave_123",
      "employee_id": "emp_456",
      "start_date": "2026-06-01",
      "end_date": "2026-06-05",
      "leave_type": "vacation",
      "reason": "Summer vacation",
      "status": "pending",
      "created_at": "2026-05-01T00:00:00Z"
    }
  ]
}
```

---

### POST /leave/requests
Create leave request.

**Request**:
```json
{
  "start_date": "2026-06-01",
  "end_date": "2026-06-05",
  "leave_type": "vacation",
  "reason": "Summer vacation"
}
```

**Response** (201): Created leave request

---

### PATCH /leave/requests/:id
Update leave request.

**Request**:
```json
{
  "start_date": "2026-06-02",
  "leave_type": "sick"
}
```

**Response** (200): Updated request

---

### DELETE /leave/requests/:id
Cancel leave request.

**Response** (200): `{ "data": { "success": true } }`

---

### PATCH /leave/requests/:id/approve
Approve leave request (manager).

**Request**:
```json
{
  "notes": "Approved"
}
```

**Response** (200): Updated request with status: "approved"

---

### PATCH /leave/requests/:id/reject
Reject leave request (manager).

**Request**:
```json
{
  "reason": "Coverage issue"
}
```

**Response** (200): Updated request with status: "rejected"

---

### GET /leave/balances
Get leave balance for employee.

**Query Params**:
- `employee_id`: string
- `year`: number (optional, defaults to current)

**Response** (200):
```json
{
  "data": {
    "id": "balance_123",
    "employee_id": "emp_456",
    "year": 2026,
    "available_leave": 20,
    "used_leave": 5,
    "available_permissions": 8,
    "used_permissions": 1
  }
}
```

---

### GET /leave/calendar
Get leave calendar for month.

**Query Params**:
- `company_id`: string
- `month`: YYYY-MM

**Response** (200):
```json
{
  "data": [
    {
      "date": "2026-06-01",
      "employee_id": "emp_123",
      "leave_type": "vacation",
      "status": "approved"
    }
  ]
}
```

---

## 💳 Billing Endpoints

### GET /billing/status
Get company subscription status.

**Query Params**:
- `company_id`: string

**Response** (200):
```json
{
  "data": {
    "company_id": "company_123",
    "plan": "professional",
    "status": "active",
    "current_period_end": "2026-06-01T00:00:00Z",
    "amount": 99.99,
    "billing_interval": "monthly"
  }
}
```

---

### GET /billing/plans
List available plans.

**Response** (200):
```json
{
  "data": [
    {
      "id": "plan_starter",
      "name": "Starter",
      "price_monthly": 29.99,
      "price_yearly": 299.99,
      "max_employees": 10,
      "features": ["basic_attendance", "leave_requests"]
    },
    {
      "id": "plan_pro",
      "name": "Professional",
      "price_monthly": 99.99,
      "price_yearly": 999.99,
      "max_employees": 100,
      "features": ["all_features"]
    }
  ]
}
```

---

### POST /billing/checkout
Create Stripe checkout session.

**Request**:
```json
{
  "plan_id": "plan_pro",
  "billing_interval": "monthly",
  "addons": [
    {
      "addon_id": "addon_storage",
      "quantity": 5
    }
  ]
}
```

**Response** (201):
```json
{
  "data": {
    "session_id": "cs_test_123...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

---

### POST /billing/customer-portal
Create Stripe customer portal.

**Request**:
```json
{
  "company_id": "company_123",
  "return_url": "https://app.aldevionhr.com/billing"
}
```

**Response** (201):
```json
{
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

---

### POST /billing/cancel
Cancel subscription.

**Request**:
```json
{
  "company_id": "company_123",
  "reason": "Too expensive"
}
```

**Response** (200):
```json
{
  "data": { "success": true }
}
```

---

## 🔔 Notifications Endpoints

### GET /notifications
Get notifications.

**Query Params**:
- `read`: boolean
- `limit`: 50

**Response** (200):
```json
{
  "data": [
    {
      "id": "notif_123",
      "title": "Leave Request",
      "message": "Your leave request was approved",
      "type": "success",
      "read": false,
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

---

### PATCH /notifications/:id/read
Mark notification as read.

**Response** (200): Updated notification

---

### PATCH /notifications/mark-all-read
Mark all as read.

**Response** (200):
```json
{
  "data": { "success": true }
}
```

---

### GET /notifications/unread-count
Get unread count.

**Response** (200):
```json
{
  "data": { "count": 3 }
}
```

---

## 📄 Documents Endpoints

### GET /documents
List documents.

**Query Params**:
- `company_id`: string
- `status`: active|archived
- `document_type`: contract|invoice|certificate

**Response** (200): Array of documents

---

### POST /documents/request-upload-url
Get pre-signed upload URL (R2/S3).

**Request**:
```json
{
  "bucket": "documents",
  "fileName": "contract_123.pdf"
}
```

**Response** (201):
```json
{
  "data": {
    "uploadUrl": "https://..."
  }
}
```

---

### GET /documents/:id/download-url
Get download URL.

**Response** (200):
```json
{
  "data": {
    "downloadUrl": "https://..."
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "status": 400,
    "message": "Bad request",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

- `401_UNAUTHORIZED` - Missing or invalid token
- `403_FORBIDDEN` - Insufficient permissions
- `404_NOT_FOUND` - Resource not found
- `409_CONFLICT` - Resource already exists
- `422_UNPROCESSABLE_ENTITY` - Validation failed
- `500_INTERNAL_SERVER_ERROR` - Server error

---

## 📝 Notes

- All timestamps are ISO 8601 format (UTC)
- All IDs are CUID format (unique, sortable)
- Pagination: `skip` and `limit` query params
- All endpoints require authentication except `/auth/login` and `/auth/password-reset`
- Rate limiting: 100 requests/minute per user

---

**Last Updated**: 2026-05-01  
**Version**: 1.0 (Blueprint)  
**Status**: All endpoints defined, implementations pending
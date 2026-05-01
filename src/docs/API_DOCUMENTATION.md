# PulseHR API Documentation

## Overview
RESTful API for PulseHR HR Management System built on Base44 platform.

## Base URL
```
https://api.pulsehr.app/v1
```

## Authentication
All requests require Bearer token:
```
Authorization: Bearer <api_key>
```

## Entities Endpoints

### Time Entries
```bash
GET    /time-entries                  # List all time entries
POST   /time-entries                  # Create new time entry
GET    /time-entries/:id              # Get specific entry
PUT    /time-entries/:id              # Update entry
DELETE /time-entries/:id              # Delete entry
```

**Example Create:**
```json
POST /time-entries
{
  "employee_id": "emp-123",
  "type": "check_in",
  "timestamp": "2026-05-01T09:00:00Z",
  "latitude": 45.5017,
  "longitude": 37.0947
}
```

### Leave Requests
```bash
GET    /leave-requests                # List leave requests
POST   /leave-requests                # Create new request
GET    /leave-requests/:id            # Get request details
PUT    /leave-requests/:id/approve    # Approve request
PUT    /leave-requests/:id/reject     # Reject request
```

### Employees
```bash
GET    /employees                     # List all employees
POST   /employees                     # Create employee
GET    /employees/:id                 # Get employee
PUT    /employees/:id                 # Update employee
DELETE /employees/:id                 # Delete employee
```

### Documents
```bash
GET    /documents                     # List documents
POST   /documents                     # Upload document
GET    /documents/:id/sign            # Get signature URL
POST   /documents/:id/sign            # Submit signature
```

## Webhooks

### Leave Request Approved
```
POST /webhook/leave-approved
```

### Overtime Request Approved
```
POST /webhook/overtime-approved
```

### Document Expiring
```
POST /webhook/document-expiring
```

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## Rate Limiting
- 100 requests/minute per API key
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Pagination
```
?limit=20&skip=0
```

## Filtering
```
?filter={"status":"pending"}&sort="-created_date"
``
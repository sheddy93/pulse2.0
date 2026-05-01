# PulseHR Database Schema Documentation

**Format:** Base44 Entities (current) → PostgreSQL (migration target)
**Last Updated:** 2026-05-01
**Status:** Complete inventory, partial normalization

---

## 📋 Entity Inventory (35+ entities)

### TIER 1: CORE HR ENTITIES

**EmployeeProfile**
```json
{
  "id": "uuid",
  "company_id": "uuid (FK: Company)",
  "first_name": "string",
  "last_name": "string",
  "email": "string (unique per company)",
  "phone": "string",
  "employee_code": "string",
  "job_title": "string",
  "department": "string (FK: future)",
  "location": "string (FK: future)",
  "manager": "string (employee_code or FK)",
  "hire_date": "date",
  "status": "enum: active|inactive|onboarding",
  "user_email": "string (FK: User)",
  "has_account": "boolean",
  "temp_password": "string (hashed)",
  "internal_notes": "text",
  "is_deleted": "boolean (soft delete)",
  "deleted_at": "timestamp",
  "deleted_by": "string",
  "created_date": "timestamp",
  "updated_date": "timestamp",
  "created_by": "string"
}
```

**TimeEntry** (Attendance)
```json
{
  "id": "uuid",
  "employee_id": "uuid (FK: EmployeeProfile)",
  "company_id": "uuid (FK: Company)",
  "user_email": "string",
  "timestamp": "datetime",
  "type": "enum: check_in|check_out|break_start|break_end",
  "latitude": "number (nullable)",
  "longitude": "number (nullable)",
  "location": "string (nullable)",
  "ip_address": "string (nullable)",
  "user_agent": "string (nullable)",
  "created_date": "timestamp",
  "created_by": "string"
}
```

**LeaveRequest**
```json
{
  "id": "uuid",
  "employee_id": "uuid (FK: EmployeeProfile)",
  "company_id": "uuid (FK: Company)",
  "leave_type": "enum: ferie|permesso|malattia|extra|ROL|straordinario_recupero",
  "start_date": "date",
  "end_date": "date",
  "days_count": "number",
  "note": "text",
  "status": "enum: pending|manager_approved|manager_rejected|approved|rejected",
  "manager_email": "string",
  "manager_approved_at": "timestamp",
  "manager_note": "text",
  "admin_email": "string",
  "reviewed_at": "timestamp",
  "admin_note": "text",
  "is_deleted": "boolean (soft delete)",
  "created_date": "timestamp",
  "created_by": "string"
}
```

**OvertimeRequest**
```json
{
  "id": "uuid",
  "employee_id": "uuid (FK: EmployeeProfile)",
  "company_id": "uuid (FK: Company)",
  "date": "date",
  "hours": "number",
  "reason": "text",
  "status": "enum: pending|approved|rejected",
  "manager_email": "string",
  "approved_at": "timestamp",
  "created_date": "timestamp",
  "created_by": "string"
}
```

**LeaveBalance**
```json
{
  "id": "uuid",
  "employee_id": "uuid (FK: EmployeeProfile)",
  "company_id": "uuid (FK: Company)",
  "available_leave": "number (default: 20)",
  "used_leave": "number (default: 0)",
  "available_permissions": "number (default: 8)",
  "used_permissions": "number (default: 0)",
  "year": "number",
  "notes": "text",
  "updated_date": "timestamp"
}
```

### TIER 2: DOCUMENT MANAGEMENT

**Document**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "employee_id": "uuid (nullable, FK)",
  "title": "string",
  "doc_type": "enum: contratto|busta_paga|certificato|corso|altro",
  "file_url": "string (URI to private storage)",
  "uploaded_by": "string",
  "visibility": "enum: employee|company|consultant|all",
  "expiry_date": "date (nullable)",
  "signature_required": "boolean",
  "signature_status": "enum: pending|signed|rejected",
  "signed_by": "string",
  "signed_at": "timestamp",
  "is_deleted": "boolean (soft delete)",
  "created_date": "timestamp",
  "updated_date": "timestamp"
}
```

### TIER 3: APPROVAL WORKFLOWS

**WorkflowDefinition**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "name": "string",
  "request_type": "enum: leave_request|expense_reimbursement|salary_variation|document_approval|overtime|custom",
  "description": "text",
  "is_active": "boolean",
  "approval_steps": [
    {
      "step_number": "number",
      "approver_role": "string",
      "approver_email": "string (nullable)",
      "allow_rejection": "boolean",
      "allow_comments": "boolean",
      "require_all_approvers": "boolean"
    }
  ],
  "auto_approve_after_days": "number (nullable)",
  "created_date": "timestamp"
}
```

**WorkflowApproval** (Instance)
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "workflow_definition_id": "uuid (FK)",
  "request_type": "string",
  "request_id": "uuid (polymorphic FK)",
  "requester_email": "string",
  "current_step": "number",
  "total_steps": "number",
  "status": "enum: pending|approved|rejected|cancelled",
  "approval_history": [
    {
      "step_number": "number",
      "approver_email": "string",
      "decision": "enum: pending|approved|rejected",
      "comment": "text",
      "decided_at": "timestamp"
    }
  ],
  "initiated_at": "timestamp",
  "completed_at": "timestamp"
}
```

### TIER 4: BILLING & SUBSCRIPTION

**Company** (simplified from CompanyProfile)
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "country": "string",
  "employees_count": "number",
  "status": "enum: active|inactive|cancelled",
  "stripe_customer_id": "string (nullable)",
  "created_date": "timestamp"
}
```

**CompanySubscription**
```json
{
  "id": "uuid",
  "company_id": "uuid (FK: Company)",
  "stripe_subscription_id": "string",
  "plan_id": "string",
  "status": "enum: active|paused|cancelled",
  "billing_cycle": "enum: monthly|annual",
  "billing_email": "string",
  "current_period_start": "date",
  "current_period_end": "date",
  "cancelled_at": "timestamp (nullable)",
  "created_date": "timestamp"
}
```

**TrialSubscription**
```json
{
  "id": "uuid",
  "company_email": "string",
  "company_name": "string",
  "contact_email": "string",
  "employees_count": "number",
  "trial_start": "datetime",
  "trial_end": "datetime",
  "status": "enum: active|converted|expired|cancelled",
  "stripe_customer_id": "string",
  "selected_plan": "enum: startup|professional|enterprise",
  "selected_addons": [
    {
      "addon_id": "uuid",
      "quantity": "number",
      "unit_price": "number"
    }
  ],
  "total_monthly_price": "number",
  "created_date": "timestamp"
}
```

### TIER 5: ADMIN & SECURITY

**User** (Built-in, managed by Base44)
```json
{
  "id": "uuid",
  "email": "string (unique)",
  "full_name": "string",
  "role": "enum: super_admin|company_owner|company_admin|hr_manager|manager|employee|consultant|external_consultant|labor_consultant|safety_consultant",
  "company_id": "uuid (nullable, FK: Company)",
  "status": "enum: active|inactive|suspended",
  "must_change_password": "boolean",
  "created_date": "timestamp"
}
```

**TemporaryLogin**
```json
{
  "id": "uuid",
  "company_id": "uuid (nullable)",
  "user_email": "string",
  "user_role": "enum: super_admin|company_owner|company_admin|hr_manager|manager|employee|consultant|labor_consultant|external_consultant|safety_consultant",
  "temp_password": "string (hashed)",
  "plain_password": "string (cleartext, shown once)",
  "generated_by": "string",
  "expires_at": "datetime",
  "first_login_at": "timestamp (nullable)",
  "used": "boolean",
  "status": "enum: active|used|expired|revoked",
  "created_date": "timestamp"
}
```

**UserPermissions**
```json
{
  "id": "uuid",
  "user_email": "string",
  "company_id": "uuid",
  "granted_by": "string",
  "permissions": {
    "view_employees": "boolean",
    "edit_employees": "boolean",
    "view_attendance": "boolean",
    "edit_attendance": "boolean",
    "view_documents": "boolean",
    "edit_documents": "boolean",
    "view_leave_requests": "boolean",
    "approve_leave_requests": "boolean",
    "view_overtime": "boolean",
    "approve_overtime": "boolean",
    "view_payroll": "boolean",
    "edit_payroll": "boolean",
    "view_analytics": "boolean",
    "edit_announcements": "boolean",
    "invite_employees": "boolean",
    "delete_employees": "boolean"
  },
  "created_date": "timestamp",
  "updated_date": "timestamp"
}
```

**AuditLog**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "user_email": "string",
  "action": "enum: create|update|delete|approve|reject|export|download",
  "entity_type": "string",
  "entity_id": "uuid",
  "changes": {
    "field_name": {
      "old_value": "any",
      "new_value": "any"
    }
  },
  "ip_address": "string (nullable)",
  "user_agent": "string (nullable)",
  "created_date": "timestamp"
}
```

### TIER 6: COMMUNICATION

**CompanyMessage**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "sender_email": "string",
  "subject": "string",
  "content": "text (rich text or markdown)",
  "message_type": "enum: task|announcement|document|notification|other",
  "recipient_type": "enum: individual|group|department|all",
  "recipient_employees": ["uuid array"],
  "priority": "enum: low|normal|high|urgent",
  "read_by": [
    {
      "employee_id": "uuid",
      "read_at": "timestamp"
    }
  ],
  "sent_at": "timestamp",
  "created_date": "timestamp"
}
```

### TIER 7: GEOFENCING & LOCATION

**LocationGeofence**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "location_id": "uuid (FK: CompanyLocation)",
  "location_name": "string",
  "geofence_type": "enum: polygon|circle",
  "polygon_coordinates": [
    {
      "latitude": "number",
      "longitude": "number"
    }
  ],
  "circle_center": {
    "latitude": "number",
    "longitude": "number"
  },
  "circle_radius_meters": "number",
  "is_active": "boolean",
  "created_date": "timestamp"
}
```

**AttendanceFailureLog**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "employee_id": "uuid",
  "employee_email": "string",
  "location_id": "uuid",
  "attempt_type": "enum: check_in|check_out|break_start|break_end",
  "failure_reason": "enum: outside_geofence|gps_disabled|no_location_set|gps_error",
  "employee_latitude": "number",
  "employee_longitude": "number",
  "distance_from_location_meters": "number",
  "attempted_at": "timestamp",
  "created_date": "timestamp"
}
```

---

## 🔗 Relationships (ER Diagram Text)

```
Company
├── 1:N → EmployeeProfile
├── 1:N → CompanySubscription
├── 1:N → WorkflowDefinition
├── 1:N → LocationGeofence
├── 1:N → CompanyMessage
└── 1:N → Document (company-level)

EmployeeProfile
├── 1:N → TimeEntry
├── 1:N → LeaveRequest
├── 1:N → OvertimeRequest
├── 1:1 → LeaveBalance
├── 1:N → Document (employee-level)
├── M:1 → Company
├── M:1 → User (via user_email)
└── M:1 → EmployeeProfile (via manager - self-reference)

WorkflowDefinition
└── 1:N → WorkflowApproval

WorkflowApproval
└── M:1 → (polymorphic) LeaveRequest|OvertimeRequest|Document|ExpenseReimbursement

User
├── 1:1 → Company (if company_owner|company_admin|hr_manager|manager|employee)
└── 1:N → UserPermissions

CompanySubscription
├── M:1 → Company
└── M:1 → SubscriptionPlan

LocationGeofence
├── 1:N → AttendanceFailureLog
└── M:1 → Company
```

---

## 📊 Indexes (PostgreSQL Migration)

**Essential:**
- `EmployeeProfile(company_id, email)` - Composite unique
- `TimeEntry(employee_id, timestamp DESC)` - Range queries
- `LeaveRequest(company_id, status, start_date)` - Filtering
- `User(email)` - Unique login
- `WorkflowApproval(company_id, status)` - List filtering
- `Document(company_id, expiry_date)` - Expiry alerts
- `AuditLog(company_id, created_date DESC)` - Audit trails

---

## ⚠️ Migration Notes

**Schema Changes Required for PostgreSQL:**
1. Add explicit foreign key constraints
2. Add check constraints on enums
3. Add computed columns (full_name from first_name + last_name)
4. Add triggers for updated_date auto-update
5. Add row-level security (RLS) per company_id
6. Add partitioning for TimeEntry (by month) - volume data
7. Add soft-delete triggers (is_deleted → created_date)

**Data Migration Steps:**
1. Export all entities from Base44 as JSON
2. Validate schema compliance
3. Transform enums (string → postgres enum types)
4. Load into PostgreSQL staging
5. Run integrity checks (FK, uniqueness)
6. Switch read layer to postgres (services use mappers)
7. Verify 100% data parity
8. Decommission Base44 exports
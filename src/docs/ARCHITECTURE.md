# Architecture Guide - AldevionHR

**Document**: `docs/ARCHITECTURE.md`  
**Version**: 1.0.0  
**Audience**: Senior developers, architects, new team members

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSERS                        │
│              (React 18 + Tailwind CSS + Vite)              │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    [Landing]      [Dashboard]     [PWA App]
   (Public)       (Authenticated)  (Offline)
          │              │              │
          └──────────────┼──────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐          ┌──────────▼─────────┐
│  Base44 SDK     │          │ External Services  │
│ (Frontend API)  │          │                    │
│                 │          ├─ Stripe (Payments)│
│ - Entities      │          ├─ Google (Calendar)│
│ - Functions     │          ├─ Slack (Notify)   │
│ - Auth          │          └─ GitHub (Sync)    │
│ - Analytics     │                               │
└────────┬────────┘          └────────────────────┘
         │
    ┌────▼──────────────────────────────────────────┐
    │          BASE44 BACKEND (Deno)               │
    │                                              │
    │ ┌──────────────────────────────────────────┐ │
    │ │   Functions (50+)                        │ │
    │ │   - Auth: Login, 2FA, TOTP              │ │
    │ │   - Stripe: Checkout, Webhook           │ │
    │ │   - GDPR: Export, Delete                │ │
    │ │   - Notifications: Email, Push, Slack   │ │
    │ │   - Workflows: Automation               │ │
    │ │   - Reports: PDF, CSV, Excel            │ │
    │ └──────────────────────────────────────────┘ │
    │                                              │
    │ ┌──────────────────────────────────────────┐ │
    │ │   PostgreSQL Database                    │ │
    │ │   - 20+ Entities                         │ │
    │ │   - Row-level data isolation (company_id)│ │
    │ │   - Audit logs (immutable)               │ │
    │ │   - Automated backups                    │ │
    │ └──────────────────────────────────────────┘ │
    │                                              │
    │ ┌──────────────────────────────────────────┐ │
    │ │   File Storage (Private Bucket)         │ │
    │ │   - Documents (PDF, images)             │ │
    │ │   - Signed URLs (temporary access)      │ │
    │ │   - Encryption at rest                  │ │
    │ └──────────────────────────────────────────┘ │
    └────────────────────────────────────────────┘
```

---

## 🏛️ Application Layers

### 1. **Presentation Layer** (React Components)
**Path**: `src/pages/` + `src/components/`

Responsabilità:
- Render UI based on role
- Handle user interactions
- Client-side validation
- Responsive design (desktop + mobile + PWA)

Pattern:
```jsx
// pages/{domain}/{Feature}.jsx
- useState for local form state
- useQuery for data fetching
- useAuth for user context
- Components per section (keep <500 lines)
```

### 2. **Business Logic Layer** (Services & Hooks)
**Path**: `src/services/` + `src/hooks/`

Responsabilità:
- Data fetching orchestration
- Permission checks (`lib/permissions.js`)
- Caching strategy (`useApiCache`)
- Error handling

Example:
```javascript
// services/employeeService.js
export async function fetchEmployees(companyId, filters) {
  // Fetch with company_id isolation
  // Apply filters
  // Cache result
}
```

### 3. **Integration Layer** (Base44 SDK)
**Path**: `src/api/base44Client.js` + `functions/`

Responsibilities:
- Entity CRUD operations
- Authentication
- Function invocation
- Analytics tracking

```javascript
// Frontend
import { base44 } from '@/api/base44Client';
const employees = await base44.entities.EmployeeProfile
  .filter({ company_id: userCompanyId });

// Backend Function
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  // Function logic
});
```

### 4. **Backend Service Layer** (Functions)
**Path**: `functions/`

Types:
- **Auth functions**: Login, 2FA, TOTP
- **Stripe functions**: Checkout, webhook, history
- **Notification functions**: Email, push, Slack
- **Automation functions**: Workflows, payroll, onboarding
- **Export functions**: GDPR data export

Pattern:
```javascript
// functions/someFeature.js
/**
 * Purpose: ...
 * Auth: Only company_owner
 * Input: { company_id, ... }
 * Output: { success, data }
 * Errors: 401, 403, 500
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Validate permissions
    if (user?.role !== 'company_owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Business logic
    const result = await base44.entities.{Entity}.create(data);
    
    // Audit log
    await createAuditLog(...);
    
    return Response.json(result);
  } catch (error) {
    // Log error
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### 5. **Data Layer** (Database + Cache)
**Path**: `src/entities/*.json` (schemas)

Entities:
- **Core**: User, Company, EmployeeProfile
- **HR**: LeaveRequest, AttendanceEntry, Document
- **Financial**: SubscriptionPlan, CompanySubscription
- **Config**: FeatureFlags, UsageLimits, WorkflowDefinition
- **Audit**: AuditLog, WorkflowAuditLog

Key Pattern:
```javascript
// Every query MUST include company_id filter
const data = await base44.entities.SomeEntity
  .filter({ company_id: userCompanyId }); // ✓ Secure
  
// NOT this:
const data = await base44.entities.SomeEntity.list(); // ✗ Data leak!
```

---

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────┐
│ User Login (email + password)           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Base44 Auth (JWT token issued)          │
│ - Token stored in localStorage          │
│ - Includes: user_id, company_id, role   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Every API call includes JWT             │
│ - AuthHeader: "Authorization: Bearer..." │
│ - Sent to backend functions             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Backend: createClientFromRequest()      │
│ - Verifies JWT signature                │
│ - Extracts user claims                  │
│ - Calls base44.auth.me() to get user    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ RBAC Check (lib/permissions.js)         │
│ - Verify user has required permission   │
│ - Return 403 if denied                  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Data Filter (company_id isolation)      │
│ - All queries filtered by company_id    │
│ - User only sees their company data     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Audit Log (trackable action)            │
│ - Who: user_id, email, IP               │
│ - What: entity, operation, changes      │
│ - When: timestamp                       │
│ - Result: success or error              │
└─────────────────────────────────────────┘
```

### Data Isolation (Tenant Isolation)

Every entity must have:
1. **company_id**: Primary isolation key
2. **filtering on read**: `filter({ company_id })`
3. **validation on write**: Verify company_id matches

```javascript
// ✓ Correct: User can only see their company data
const leaves = await base44.entities.LeaveRequest
  .filter({ company_id: user.company_id });

// ✗ Wrong: User could see all companies
const leaves = await base44.entities.LeaveRequest.list();

// ✗ Wrong: No validation of user's company
const leaves = await base44.entities.LeaveRequest
  .filter({ company_id: req.body.company_id }); // Could be spoofed!
```

### Permission Layers

**Layer 1**: Frontend (UX)
```javascript
// lib/permissions.js
if (can(user, PERMISSIONS.VIEW_PAYROLL)) {
  return <PayrollPage />;
}
```

**Layer 2**: Backend (API)
```javascript
// functions/someFeature.js
const user = await base44.auth.me();
if (user?.role !== 'company_owner') {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Layer 3**: Database (Future RLS)
```sql
-- Row-level security (PostgreSQL future)
CREATE POLICY company_isolation ON employees
  USING (company_id = current_setting('app.current_company_id'));
```

---

## 📊 Data Flow Examples

### Example 1: Employee Create

```
Employee fills form (page/company/EmployeeCreateNew.jsx)
           │
           ▼
Validate (client-side): Name, email, role
           │
           ▼
POST /functions/createEmployee
  {
    company_id: "comp_123",  (from auth)
    first_name: "Mario",
    email: "mario@company.it",
    role: "employee"
  }
           │
           ▼
Backend (functions/createEmployee.js)
  1. Auth: Get user
  2. Check: user.role === 'company_owner' or 'hr_manager'?
  3. Validate: Email not already exists
  4. Create: base44.entities.EmployeeProfile.create()
  5. Audit: createAuditLog("employee_created", ...)
  6. Return: { success: true, employee_id: "emp_456" }
           │
           ▼
Frontend (catch response)
           │
           ▼
Refetch: useQuery invalidates EmployeeProfile query
           │
           ▼
UI updates: Employee list shows new record
```

### Example 2: Leave Request Approval

```
Manager views /dashboard/manager/leave-requests
           │
           ▼
Query: LeaveRequest.filter({ manager_id: currentUser })
  (Only shows requests for their team)
           │
           ▼
Manager clicks "Approve"
           │
           ▼
POST /functions/approveLeaveRequest
  {
    leave_id: "leave_789",
    manager_id: "emp_123",  (from auth)
    comment: "Ok"
  }
           │
           ▼
Backend:
  1. Auth: Get user (manager)
  2. Fetch: LeaveRequest + Employee
  3. Check: Is approver the manager of employee?
  4. Check: Is status === 'pending'?
  5. Update: status = 'approved'
  6. Update: Employee.leave_used += days
  7. Notify: Email to employee
  8. Audit: Log approval
  9. Return: { success: true }
           │
           ▼
Frontend refetch + toast notification
           │
           ▼
UI: Leave disappears from pending, appears in approved
```

---

## 🎯 Routing & Navigation

### Route Convention

```
/dashboard/{role}/{feature}/{action}

Examples:
  /dashboard/employee/attendance/calendar
  /dashboard/company/employees/123
  /dashboard/manager/leave-requests
  /dashboard/admin/settings
```

### Role-Based Route Access

```javascript
// In App.jsx - Routes organized by role:

{/* Super Admin Routes */}
<Route path="/dashboard/admin/*" element={<SuperAdminDashboard />} />

{/* Company Routes (owner, admin, hr_manager) */}
<Route path="/dashboard/company/*" element={<CompanyPages />} />

{/* Employee Routes (employee, manager) */}
<Route path="/dashboard/employee/*" element={<EmployeePages />} />

{/* Consultant Routes */}
<Route path="/dashboard/consultant/*" element={<ConsultantPages />} />
```

### Navigation Menu (AppShell)

Menu changes based on `user.role`:
```javascript
// lib/roles.js -> getDashboardPath(role)
// pages/components/AppShell -> NAV constant

NAV.super_admin = [ Companies, Users, Analytics, ... ]
NAV.company_owner = [ Employees, Presences, Ferie, ... ]
NAV.manager = [ Team, Leaves, Analytics, ... ]
NAV.employee = [ Attendance, Leaves, Documents, ... ]
```

---

## 🔄 Data Fetching Strategy

### React Query Usage

```javascript
// In components/pages:
const { data: employees, isLoading } = useQuery({
  queryKey: ['employees', companyId],
  queryFn: () => base44.entities.EmployeeProfile
    .filter({ company_id: companyId }),
  staleTime: 5 * 60 * 1000, // 5 min
});

// Invalidate on mutations:
queryClient.invalidateQueries({ 
  queryKey: ['employees'] 
});
```

### Caching Strategy

```javascript
// Heavy data (departments, plans):
const { data: cachedDepts } = useApiCache(
  'departments_comp_123',
  async () => fetchDepartments(companyId),
  60 * 60 * 1000 // 1 hour TTL
);

// Real-time subscription (future):
const unsubscribe = base44.entities.EmployeeProfile
  .subscribe((event) => {
    if (event.type === 'create') {
      // Add to local state
    }
  });
```

---

## 🧪 Testing Architecture

### Manual Testing (QA_CHECKLIST.md)

For each role, test:
- What they can see
- What they can't see
- What they can modify
- Cross-company access blocked

### Automated Testing (Future)

```javascript
// tests/roles.test.js
describe('RBAC', () => {
  test('manager cannot create admin', () => {
    const result = can(MANAGER, PERMISSIONS.CREATE_ADMIN);
    expect(result).toBe(false);
  });
});

// tests/tenant-isolation.test.js
describe('Tenant Isolation', () => {
  test('company A employee cannot access company B data', () => {
    const companyA = userA.company_id;
    const companyB = userB.company_id;
    
    const result = await getEmployees(companyA);
    expect(result).toEqual(onlyCompanyAEmployees);
  });
});
```

---

## 📈 Performance Considerations

### Code Splitting

```javascript
// lib/lazyLoadConfig.jsx
// Heavy pages lazy-loaded to reduce bundle

export const HRAnalytics = lazy(() => 
  import('../pages/company/HRAnalytics')
);

// Used in routes with Suspense:
<Suspense fallback={<LazyLoadingFallback />}>
  <HRAnalytics />
</Suspense>
```

### Bundle Size

Current: ~500KB (gzipped ~150KB)

Chunks:
- `vendor.js`: React, React-DOM
- `ui.js`: Radix-UI components
- `charts.js`: Recharts
- `forms.js`: React Hook Form
- `main.js`: App logic

### Pagination

All lists use pagination (20-50 items):
```javascript
const [page, setPage] = useState(0);

const data = await base44.entities.SomeEntity
  .filter(query, { 
    skip: page * ITEMS_PER_PAGE,
    limit: ITEMS_PER_PAGE 
  });
```

---

## 🚀 Deployment Architecture

### Development
```
localhost:5173 → HMR → Hot reload
npm run dev
```

### Production Build
```
npm run build
  ↓
dist/ (optimized bundles)
  ↓
vite preview (test build)
  ↓
Deploy to Base44 (automatic)
```

### Environment Variables

```
VITE_BASE44_APP_ID=xxx        # Frontend
STRIPE_PUBLISHABLE_KEY=pk_... # Payments
STRIPE_SECRET_KEY=sk_...      # Backend (secret)
STRIPE_WEBHOOK_SECRET=...     # Webhooks
```

---

## 🔮 Future Architecture Improvements

### Phase 1: RBAC Backend
```
Move RBAC decision to backend middleware
Current: Frontend check only
Future: Backend validates every endpoint
```

### Phase 2: Real-Time
```
WebSocket for live updates
Current: Polling (React Query)
Future: Pub/Sub for presences, messages
```

### Phase 3: Microservices
```
Split monolith into services
Notifications → Separate service
Payroll → Separate service
Analytics → Separate service
```

### Phase 4: Multi-Region
```
Deploy in EU, US, APAC
Current: Single region
Future: CDN + regional databases
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `App.jsx` | Main router + layout |
| `lib/roles.js` | Role definitions (well-commented) |
| `lib/permissions.js` | RBAC matrix |
| `lib/constants.js` | Enums + labels (well-commented) |
| `pages/*/` | Feature pages |
| `components/layout/AppShell.jsx` | Nav + sidebar |
| `functions/` | Backend logic |
| `src/entities/*.json` | Data schemas |

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-01  
**Status**: Production Ready ✅
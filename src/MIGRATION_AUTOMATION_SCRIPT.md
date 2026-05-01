# 🤖 MIGRATION AUTOMATION - BULK FIND-REPLACE PATTERNS

## Execute These in Order

### Pattern 1: Fix All AuthContext Imports in Remaining Pages
```
FILE: All pages (*.jsx)
FIND: import { useAuth } from '@/lib/AuthContext';
REPLACE: import { useAuth } from '@/lib/AuthContextDecoupled';
```

### Pattern 2: Remove base44Client Imports (Phase 1)
```
FILE: All pages (*.jsx)
FIND: import { base44 } from '@/api/base44Client';
REPLACE: // Migrated to service layer
```

### Pattern 3: Fix useAuth Hook in Pages (useAuth pattern)
```
FILE: All pages (*.jsx) that have:
const { user } = useAuth();

REPLACE WITH:
const { user: authUser } = useAuth();

Then update all references from `user` to `authUser` in JSX
```

### Pattern 4: Replace base44.auth.me() calls
```
FILE: All pages (*.jsx)
FIND: base44.auth.me().then(async (me) => {
REPLACE: Already handled via useAuth() hook - remove this pattern

PATTERN:
const { user, isLoadingAuth } = useAuth();
useEffect(() => {
  if (!isLoadingAuth) {
    // your logic here using `user` instead of `me`
  }
}, [isLoadingAuth]);
```

### Pattern 5: Replace base44.entities.* calls
```
FIND PATTERNS:
- base44.entities.Company.list()        → companyService.listCompanies()
- base44.entities.Company.filter()      → companyService.listCompanies(query)
- base44.entities.EmployeeProfile.list() → employeeService.listEmployees()
- base44.entities.LeaveRequest.filter()  → leaveService.listLeaveRequests()
- base44.entities.Document.filter()      → TODO: Create documentService

FILES TO CREATE:
- src/services/documentService.js
- src/services/leaveService.js (if not complete)
```

### Pattern 6: Fix localStorage token usage
```
FILE: All pages checking for auth
FIND: localStorage.getItem('token')
REPLACE: authService.getToken()

FIND: localStorage.setItem('token', ...)
REPLACE: authService.saveToken(...)
```

---

## PAGES TO MIGRATE (Priority Order)

### Tier 1 - Dashboard Pages (10)
- [x] App.jsx (DONE)
- [x] CompanyDashboardOptimized.jsx (DONE)
- [x] SuperAdminDashboard.jsx (DONE)
- [ ] CompanyOwnerDashboard.jsx
- [ ] ManagerDashboard.jsx
- [ ] EmployeeDashboardOptimized.jsx
- [ ] AdminAnalytics.jsx
- [ ] AdminCompanies.jsx
- [ ] AdminUsers.jsx
- [ ] AdminSystem.jsx

### Tier 2 - Auth Pages (5)
- [ ] RoleRedirect.jsx
- [ ] RoleSelection.jsx
- [ ] RegisterCompany.jsx
- [ ] RegisterConsultant.jsx
- [ ] ForcePasswordChange.jsx

### Tier 3 - Employee Pages (15)
- [ ] AttendancePage.jsx
- [ ] AttendanceCalendar.jsx
- [ ] LeaveRequestPage.jsx
- [ ] EmployeeProfilePage.jsx
- [ ] MyProfile.jsx
- [ ] DocumentSignaturePage.jsx
- [ ] OvertimeRequestPage.jsx
- [ ] SkillsPage.jsx
- [ ] BenefitsPage.jsx
- [ ] NotificationPreferencesPage.jsx
- [ ] EmployeeShiftCalendarPage.jsx
- [ ] EmployeeContract.jsx
- [ ] DocumentManagement.jsx
- [ ] InboxMessages.jsx
- [ ] EmployeeExpenses.jsx

### Tier 4 - Company Pages (40+)
- [ ] EmployeeImport.jsx
- [ ] CompanyConsultants.jsx
- [ ] DocumentsPage.jsx
- [ ] ExpiryCalendar.jsx
- [ ] OvertimePage.jsx
- [ ] ShiftManagementEnhanced.jsx
- [ ] AnnouncementBoard.jsx
- [ ] SkillManagement.jsx
- [ ] AssetManagement.jsx
- [ ] AssetAssignmentPage.jsx
- [ ] AuditLogPage.jsx
- [ ] BenefitManagement.jsx
- [ ] IntegrationSettings.jsx
- [ ] JobPostings.jsx
- [ ] CandidateTracking.jsx
- [ ] TrainingManagement.jsx
- [ ] GivePerformanceReview.jsx
- [ ] HRCalendarPage.jsx
- [ ] ExpenseManagement.jsx
- [x] EmployeeListNew.jsx (DONE)
- [x] EmployeeCreateNew.jsx (DONE)
- [x] EmployeeDetailNew.jsx (DONE)
- [ ] ManagerLeaveRequests.jsx
- [ ] OnboardingTracking.jsx
- [ ] TrainingPlanManagement.jsx
- [ ] TimeOffCalendarPage.jsx
- [ ] DocumentTemplatePage.jsx
- [ ] APIManagement.jsx
- [ ] IntegrationsPage.jsx
- [ ] CertificationExpiry.jsx
- [ ] PayrollExport.jsx
- [ ] WorkflowConfiguration.jsx
- [ ] GeofenceManagement.jsx
- [ ] DocumentArchive.jsx
- [ ] SendMessage.jsx
- [ ] CompanySettings.jsx
- [ ] AdminsList.jsx
- [ ] CreateCompanyAdmin.jsx
- [ ] EmployeeCard.jsx
- [ ] PricingPageNew.jsx
- [ ] DashboardBuilder.jsx
- [ ] CompanyOnboardingWizard.jsx

### Tier 5 - Consultant Pages (5)
- [ ] LinkRequests.jsx
- [ ] DocumentReviewPage.jsx
- [ ] ConsultantSettings.jsx

---

## SERVICES TO CREATE/COMPLETE

### Required
- [ ] documentService.js
- [ ] leaveService.js (complete)
- [ ] adminService.js
- [ ] consultantService.js

### Optional (if using in pages)
- [ ] notificationService.js
- [ ] workflowService.js
- [ ] integrationService.js

---

## FINAL CLEANUP

After all migrations:
1. Delete src/lib/AuthContext.jsx
2. Delete src/api/base44Client.js
3. Delete src/api/adapters/base44Adapter.ts
4. Remove @base44/sdk from package.json
5. Run grep to verify zero base44 references
   ```bash
   grep -r "base44\|@base44" src/ --include="*.js" --include="*.jsx"
   # Should return ZERO results
   ```

---

## TESTING AFTER MIGRATION

```bash
# 1. Clear localStorage (remove old tokens)
# 2. Test login flow
# 3. Test all dashboard pages load
# 4. Test employee operations
# 5. Test company operations
# 6. Verify no console errors
``
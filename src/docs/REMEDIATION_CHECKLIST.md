# Remediation Checklist - Base44 Dependency Cleanup

**Status**: Phase A (CRITICAL) - In Progress  
**Goal**: Remove 65+ critical Base44 violations from pages/components/hooks  
**Timeline**: 2 weeks (40 hours)

---

## 🔴 CRITICAL REFACTORS (Priority Order)

### WEEK 1: Stripe Integrations (Revenue Critical)

#### ✅ Created Infrastructure
- [x] `src/services/billingService.ts` - Service layer for Stripe
- [x] `src/api/aiApi.ts` - API layer for AI integrations
- [x] Updated `src/services/index.ts` with new exports

#### ⏳ Component Refactors Needed

**[ ] pages/company/SubscriptionPage.jsx**
- Lines 35-45: Replace `base44.entities.SubscriptionPlan.list()` → `billingService.listPlans()`
- Lines 50-60: Replace `base44.entities.CompanySubscription.filter()` → `billingService.getSubscriptionStatus()`
- Effort: 30 minutes
- Blockers: None

**[ ] pages/company/CheckoutPage.jsx**
- Lines 25-35: Replace entity calls with `billingService` methods
- Effort: 30 minutes
- Blockers: None

**[ ] components/checkout/StripeCheckoutModal.jsx** (MOST CRITICAL)
- Line 95: Replace `base44.functions.invoke("stripeCheckout")` → `billingService.createCheckoutSession()`
- Lines 110-120: Remove localStorage session tracking (move to service)
- Effort: 1 hour
- Blockers: Need to verify session tracking requirement

**[ ] components/admin/StripePlansManager.jsx**
- Lines 75-95: All `base44.integrations.Stripe.*` calls → `billingApi` methods
- Effort: 1.5 hours
- Blockers: Stripe admin panel structure unclear

**[ ] pages/company/MyAccountSubscription.jsx**
- Multiple entity calls → use `billingService`
- Effort: 45 minutes
- Blockers: None

**Subtotal Week 1**: ~4.5 hours, recovers Stripe integration

---

### WEEK 1: AI Integrations (Core Feature)

#### ✅ Created Infrastructure
- [x] `src/services/aiService.ts` - LLM abstraction layer
- [x] `src/api/aiApi.ts` - AI API layer

#### ⏳ Component Refactors Needed

**[ ] components/assistant/HRAssistantWidget.jsx** (CRITICAL)
- Line 45: Replace `base44.integrations.Core.InvokeLLM()` → `aiService.askQuestion()`
- Line 60: Replace `base44.analytics.track()` → move to service
- Effort: 1 hour
- Blockers: Analytics tracking location

**[ ] pages/company/AdvancedAnalytics.jsx**
- Lines 80-100: `base44.integrations.Core.InvokeLLM()` → `aiService.askWithContext()`
- Effort: 45 minutes
- Blockers: None

**[ ] pages/company/ReportGenerator.jsx**
- Multiple LLM calls → `aiService.generateReport()`
- Effort: 1 hour
- Blockers: Report structure

**Subtotal Week 1**: ~3 hours, AI fully decoupled

---

### WEEK 1: Admin Panel (P1)

#### ✅ Created Infrastructure
- [x] `src/services/adminService.ts` - Admin logic

#### ⏳ Component Refactors Needed

**[ ] pages/dashboard/SuperAdminDashboard.jsx**
- Lines 45-80: All `base44.entities.*` calls → `adminService` methods
- Effort: 2 hours
- Blockers: API layer not ready for admin endpoints

**Subtotal Week 1**: ~2 hours

---

### WEEK 2: Pages Bulk Refactoring (45+ remaining violations)

#### Employee Pages (15 pages)
```
pages/employee/MyDashboard.jsx         [base44.entities]      → employeeService
pages/employee/AttendancePage.jsx      [base44.entities]      → attendanceService
pages/employee/LeaveRequestPage.jsx    [base44.entities]      → leaveService
pages/employee/MyProfile.jsx           [base44.auth.updateMe] → authService
pages/employee/DocumentManagement.jsx  [base44.entities]      → documentsService
pages/employee/Chat.jsx                [base44.entities]      → messageService
... (10 more)
```

**Effort per page**: 30-60 minutes  
**Total**: ~15 hours  
**Strategy**: Create utility helper to batch refactor similar patterns

#### Company Pages (20 pages)
```
pages/company/EmployeeListNew.jsx      [base44.entities]      → employeeService
pages/company/DocumentsPage.jsx        [base44.entities]      → documentsService
pages/company/AnnouncementBoard.jsx    [base44.entities]      → messageService
pages/company/OvertimePage.jsx         [base44.entities]      → overtimeService
... (16 more)
```

**Effort per page**: 45-90 minutes  
**Total**: ~20 hours  
**Priority**: Start with most-used pages first

#### Dashboard Pages (10 pages)
```
pages/dashboard/ManagerDashboard.jsx   [base44.entities]      → managerService
pages/dashboard/CompanyDashboardOptimized.jsx [multiple] → multiple services
... (8 more)
```

**Effort per page**: 60-120 minutes  
**Total**: ~12 hours

#### Consultant Pages (5 pages)
**Effort**: ~5 hours

**Subtotal Week 2**: ~52 hours (split across 2 weeks)

---

### WEEK 2-3: Hooks & Lib Cleanup

**[ ] hooks/useAuth.js** (ARCHITECTURAL)
- Remove all `base44.auth` calls
- Move auth logic to services
- Use adapter pattern for auth (base44 vs future)
- Effort: 2 hours
- Blockers: AuthContext dependency

**[ ] hooks/usePermissions.js**
- Replace with direct `permissionService.can()` calls
- Effort: 1 hour
- Blockers: None

**[ ] hooks/useCurrentCompany.js** (if exists)
- Effort: 30 minutes
- Blockers: None

**[ ] lib/AuthContext.jsx** (FOUNDATION)
- Create auth adapter (base44 implementation)
- Make context provider auth-agnostic
- Effort: 3 hours
- Blockers: Higher order component pattern

**Subtotal Week 2-3**: ~6-7 hours

---

## 📋 Refactoring Pattern Template

When refactoring a page, follow this template:

**BEFORE**:
```typescript
import { base44 } from "@/api/base44Client";

export default function Page() {
  useEffect(() => {
    const data = await base44.entities.Employee.list();
    setEmployees(data);
  }, []);
}
```

**AFTER**:
```typescript
import { employeeService } from '@/services';
import { useAuth } from '@/hooks/useAuth';

export default function Page() {
  const { user } = useAuth();
  
  useEffect(() => {
    employeeService.listEmployees(user.company_id).then(setEmployees);
  }, [user.company_id]);
}
```

**Checklist**:
- [ ] Remove `base44` import
- [ ] Add service import
- [ ] Replace all `base44.entities.*` with service calls
- [ ] Replace all `base44.auth.*` with hook/service calls
- [ ] Replace all `base44.functions.invoke()` with service calls
- [ ] Replace all `base44.integrations.*` with service calls
- [ ] Test page functionality
- [ ] Verify no new Base44 imports added

---

## 🎯 Weekly Targets

### Week 1 (May 1-7)
- **Target**: 10 files, 30-40 violations fixed
- **Focus**: Stripe, AI, Admin (revenue + core features)
- **Expected**: StripeCheckoutModal, HRAssistant, AdminDashboard fully decoupled
- **Effort**: 40 hours

### Week 2 (May 8-14)
- **Target**: 25-30 pages refactored
- **Focus**: Employee + Company pages
- **Strategy**: Parallelize work on similar patterns
- **Effort**: 40 hours

### Week 3 (May 15-21)
- **Target**: Remaining pages + hooks/lib cleanup
- **Focus**: Consultant, Dashboard, edge cases
- **Final check**: Zero Base44 imports outside API + adapters
- **Effort**: 20 hours

---

## 📊 Success Metrics

| Metric | Current | Week 1 Target | Week 2 Target | Week 3 Target |
|--------|---------|---------------|---------------|---------------|
| Base44 in pages | 112 | 50 | 20 | 0 |
| Base44 in components | 45 | 15 | 5 | 0 |
| Base44 in hooks | 8 | 4 | 0 | 0 |
| Base44 in lib | 12 | 10 | 5 | 0 |
| Total violations | 277 | 179 | 30 | 80 (api only) |

---

## 🚀 Quick Wins (Start Now)

These can be done in parallel:

1. **StripeCheckoutModal** (1h) → Immediate revenue impact
2. **HRAssistantWidget** (1h) → Core feature unlocked
3. **MyDashboard** (1h) → Most used page
4. **EmployeeListNew** (1h) → Core HR feature

**Total**: 4 hours → 4 critical components fixed

---

## 🔄 Dependencies & Blockers

| Task | Depends On | Blocker? | Solution |
|------|-----------|----------|----------|
| Stripe refactoring | billingService ✅ | ❌ No | Start now |
| AI refactoring | aiService ✅ | ❌ No | Start now |
| Admin refactoring | adminService ✅ | ⚠️ API | Create stubs first |
| Auth refactoring | AuthContext refactor | ⚠️ Yes | Do in week 2 |
| Page refactoring | Services complete | ❌ No (partial OK) | Incremental |

---

## 📝 Daily Standup Template

**Report**:
```
[Date: YYYY-MM-DD]

COMPLETED TODAY:
- [ ] Component: XXX (violations: N)
- [ ] Component: XXX (violations: N)

BLOCKERS:
- None / [describe]

TOMORROW:
- Component: XXX
- Component: XXX
```

---

## ✅ Definition of Done (Per File)

- [ ] All `base44.` imports removed (except api/adapters)
- [ ] Uses service layer exclusively
- [ ] Permission checks via `permissionService.can()`
- [ ] Uses correct hook (`useAuth`, `useCurrentCompany`)
- [ ] TypeScript types correct
- [ ] No console errors
- [ ] Tested manually
- [ ] Comment added: `// TODO MIGRATION: verify after backend ready`

---

## 🎓 Resources

**Reference Services**: 
- `src/services/employeeService.ts` - Good example
- `src/services/attendanceService.ts` - With validation
- `src/services/billingService.ts` - New (Stripe)

**Reference Pages**:
- (None yet - create first refactored page as reference)

---

**Timeline**: May 1 - May 21 (3 weeks)  
**Team**: 2-3 developers (parallelizable)  
**Success**: 100% Base44-free pages/components/hooks by May 21

---

Status: 📋 Planning Phase Complete → Ready for Execution
# Refactoring Automation Script - Template Pattern

**Purpose**: Speed up Base44 dependency removal using consistent patterns  
**Usage**: Use this as a template for bulk refactoring of remaining 50+ pages

---

## 🔄 Template Patterns

### Pattern 1: Page with Entity Fetching

**BEFORE**:
```typescript
import { base44 } from '@/api/base44Client';

export default function Page() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    base44.auth.me().then(async (user) => {
      const items = await base44.entities.SomeEntity.filter({
        company_id: user.company_id
      });
      setData(items);
    });
  }, []);
}
```

**AFTER** (Template):
```typescript
import { someService } from '@/services/someService';
import { useAuth } from '@/hooks/useAuth';

export default function Page() {
  const { user, isLoadingAuth } = useAuth();
  const [data, setData] = useState([]);
  
  useEffect(() => {
    if (!user?.company_id) return;
    
    const load = async () => {
      const items = await someService.listItems(user.company_id);
      setData(items);
    };
    
    if (!isLoadingAuth) {
      load();
    }
  }, [user?.company_id, isLoadingAuth]);
}
```

**Find & Replace Steps**:
1. Replace import: `base44.*` → appropriate service
2. Add hook: `const { user, isLoadingAuth } = useAuth();`
3. Replace `base44.auth.me()` → `user` from hook
4. Replace `base44.entities.X.filter()` → `someService.listItems()`
5. Wrap in `if (!isLoadingAuth)` check

---

### Pattern 2: Component with Function Invoke

**BEFORE**:
```typescript
import { base44 } from '@/api/base44Client';

const handleAction = async () => {
  const response = await base44.functions.invoke('myFunction', {
    param: value
  });
  setResult(response.data);
};
```

**AFTER** (Template):
```typescript
import { someService } from '@/services/someService';

const handleAction = async () => {
  const result = await someService.doSomething(value);
  setResult(result);
};
```

**Find & Replace Steps**:
1. Replace import
2. Replace `base44.functions.invoke('name', {params})` → `someService.methodName(params)`

---

### Pattern 3: Auth Updates

**BEFORE**:
```typescript
await base44.auth.updateMe({ full_name: newName });
```

**AFTER** (Template):
```typescript
// Need authService first - add to services/authService.ts
import { authService } from '@/services/authService';
await authService.updateProfile({ full_name: newName });
```

---

## 📋 Bulk Refactoring Checklist

### Employee Pages (10 pages)

**[ ] MyDashboard.jsx** ✅ DONE
- Replaced base44.auth + 4 entity calls
- Uses useAuth + 3 services

**[ ] AttendancePage.jsx**
```typescript
// Find: base44.entities.AttendanceEntry
// Replace: attendanceService.getTodayEntries()

// Find: base44.functions.invoke('checkIn')
// Replace: attendanceService.checkIn()
```

**[ ] LeaveRequestPage.jsx**
```typescript
// Find: base44.entities.LeaveRequest.create()
// Replace: leaveService.createLeaveRequest()

// Find: base44.entities.LeaveBalance.filter()
// Replace: leaveService.getLeaveBalance()
```

**[ ] DocumentSignaturePage.jsx**
```typescript
// Find: base44.entities.Document
// Replace: documentsService (create when needed)

// Find: base44.integrations.Core.SignDocument
// Replace: documentsService.requestSignature()
```

**[ ] MyProfile.jsx**
```typescript
// Find: base44.auth.updateMe()
// Replace: authService.updateProfile()

// Find: base44.entities.EmployeeProfile
// Replace: employeeService.getEmployee()
```

---

### Company Pages (15 pages)

**[ ] EmployeeListNew.jsx** ✅ DONE
- Removed base44.auth + entity calls
- Uses useAuth + employeeService

**[ ] DocumentsPage.jsx**
```typescript
// Find: base44.entities.Document
// Replace: documentsService (TODO: create)

// Find: base44.integrations.Core.UploadFile
// Replace: documentsService.uploadDocument()
```

**[ ] AnnouncementBoard.jsx**
```typescript
// Find: base44.entities.CompanyMessage
// Replace: messageService (TODO: create)
```

**[ ] OvertimePage.jsx**
```typescript
// Find: base44.entities.OvertimeRequest
// Replace: overtimeService (TODO: create)
```

**[ ] SubscriptionPage.jsx**
```typescript
// Find: base44.entities.SubscriptionPlan
// Replace: billingService.listPlans() ✅ (already created)

// Find: base44.entities.CompanySubscription
// Replace: billingService.getSubscriptionStatus()
```

---

### Component Pages (10 pages)

**[ ] StripeCheckoutModal.jsx** ✅ DONE
- Replaced base44.functions.invoke('stripeCheckoutSession')
- Uses billingService

**[ ] HRAssistantWidget.jsx** ✅ DONE
- Replaced base44.agents.*
- Uses aiService

**[ ] StripePlansManager.jsx**
```typescript
// Find: base44.integrations.Stripe.*
// Replace: stripeService (TODO: create, or use billingApi)
```

---

## 🛠️ Services to Create (On Demand)

These services don't exist yet - create when needed:

```typescript
// src/services/documentsService.ts
export const documentsService = {
  async listDocuments(companyId, filters) { }
  async uploadDocument(file, metadata) { }
  async getDocument(id) { }
  async deleteDocument(id) { }
  async requestSignature(documentId) { }
};

// src/services/messageService.ts
export const messageService = {
  async listMessages(companyId) { }
  async createMessage(data) { }
  async deleteMessage(id) { }
  async markAsRead(id) { }
};

// src/services/overtimeService.ts
export const overtimeService = {
  async createRequest(data) { }
  async listRequests(companyId) { }
  async approveRequest(id) { }
  async rejectRequest(id, reason) { }
};

// src/services/authService.ts
export const authService = {
  async updateProfile(data) { }
  async changePassword(oldPwd, newPwd) { }
  async logout() { }
};

// src/services/stripeService.ts
export const stripeService = {
  async listProducts() { }
  async createPrice(data) { }
  async updatePrice(id, data) { }
};
```

---

## 🎯 Refactoring Order (Recommended)

### Week 1 (40 hours)
- **[ ] StripeCheckoutModal** ✅ DONE
- **[ ] HRAssistantWidget** ✅ DONE
- **[ ] MyDashboard** ✅ DONE
- **[ ] EmployeeListNew** ✅ DONE
- **[ ] AttendancePage** (2h)
- **[ ] SubscriptionPage** (1h)
- **[ ] CheckoutPage** (1h)

**Total Quick Wins**: 7 files, 12-15 violations fixed (~8 hours)

### Week 2 (40 hours)
- **[ ] Employee Pages** (5 files × 1.5h = 7.5h)
  - AttendancePage, LeaveRequestPage, DocumentSignaturePage, MyProfile, Chat
- **[ ] Company Pages** (8 files × 1.5h = 12h)
  - DocumentsPage, AnnouncementBoard, OvertimePage, PayrollExport, ExpenseManagement...
- **[ ] Dashboard Pages** (5 files × 1.5h = 7.5h)
- **[ ] Create missing services** (3 new services = 6h)

### Week 3 (20 hours)
- **[ ] Consultant Pages** (5 files × 1h = 5h)
- **[ ] Remaining Components** (8 files × 1h = 8h)
- **[ ] Testing & Fixes** (7h)

---

## ✅ Verification Checklist (Per File)

After refactoring each file:

```bash
# 1. No Base44 imports
grep -n "base44" file.jsx  # Should return 0 results

# 2. Uses service layer
grep -n "Service\|useAuth\|useCurrentCompany" file.jsx  # Should have imports

# 3. No direct entity calls
grep -n "\.entities\.\|\.functions\.\|\.auth\." file.jsx  # Should return 0

# 4. Proper error handling
grep -n "try\|catch\|toast\|error" file.jsx  # Verify error handling

# 5. Types correct
# Manual review for TypeScript errors
```

---

## 🚀 Parallelization Tips

**Team with 3 developers**:
- Dev 1: Employee pages (week 1-2)
- Dev 2: Company pages (week 1-2)
- Dev 3: Admin/dashboard pages (week 2-3)

Each should follow pattern templates above for consistency.

---

## 📊 Progress Tracking

Use this table to track progress:

| File | Status | Hours | Notes | PR |
|------|--------|-------|-------|-----|
| StripeCheckoutModal.jsx | ✅ DONE | 1h | Uses billingService | #XXX |
| HRAssistantWidget.jsx | ✅ DONE | 1h | Uses aiService | #XXX |
| MyDashboard.jsx | ✅ DONE | 1.5h | Uses useAuth + services | #XXX |
| EmployeeListNew.jsx | ✅ DONE | 1.5h | Uses employeeService | #XXX |
| AttendancePage.jsx | ⏳ TODO | 2h | - | - |
| ... | - | - | - | - |

---

## 🎓 Learning Resource

**Good refactoring examples**:
- ✅ `components/checkout/StripeCheckoutModal.jsx` - Function invoke pattern
- ✅ `components/assistant/HRAssistantWidget.jsx` - Complex agent pattern
- ✅ `pages/employee/MyDashboard.jsx` - Multiple service calls
- ✅ `pages/company/EmployeeListNew.jsx` - List + filter pattern

Reference these when refactoring similar files.

---

**Last Updated**: 2026-05-01  
**Estimated Total Effort**: 100 hours  
**Team**: 2-3 developers  
**Target Completion**: May 20-25
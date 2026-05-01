# 🔒 MIGRATION BLOCKING RULES - NO BASE44 REGRESSION

**Data:** 2026-05-01 | **Status:** ACTIVE - ONE WAY ONLY

---

## ⛔ STRICT RULES - ZERO TOLERANCE

### Rule 1: NO MORE `base44Client` IMPORTS
```
❌ FORBIDDEN:
import { base44 } from '@/api/base44Client';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

✅ REQUIRED INSTEAD:
import { apiClient } from '@/api/client';
import { authService } from '@/services/authService';
import { useAuth } from '@/lib/AuthContextDecoupled';
```

### Rule 2: NO MORE `@base44/sdk` USAGE
```
❌ FORBIDDEN:
- base44.auth.me()
- base44.auth.logout()
- base44.auth.redirectToLogin()
- base44.entities.*
- createAxiosClient()

✅ REQUIRED INSTEAD:
- authService.getMe()
- authService.logout()
- employeeService.getEmployee()
- apiClient.getEmployee()
- restAdapter methods
```

### Rule 3: NO MORE OLD AuthContext
```
❌ FORBIDDEN:
import { AuthProvider, useAuth } from '@/lib/AuthContext';

✅ REQUIRED INSTEAD:
import { AuthProvider, useAuth } from '@/lib/AuthContextDecoupled';
```

### Rule 4: NO HYBRID MIXING
```
❌ FORBIDDEN:
- Using both base44 and apiClient in same file
- Using both old AuthContext and AuthContextDecoupled
- Importing from both @base44/sdk and @/api/client

✅ REQUIRED:
- One service per feature
- One auth context per app
- Pure REST stack throughout
```

---

## 🔍 FILES NEVER TO TOUCH AGAIN

These files are DEPRECATED and should NOT be imported:
- ❌ `src/api/base44Client.js` - USE `src/api/client.js`
- ❌ `src/lib/AuthContext.jsx` - USE `src/lib/AuthContextDecoupled.jsx`
- ❌ `src/api/employeesApi.ts` - USE `apiClient.listEmployees()`
- ❌ `src/api/companiesApi.ts` - USE `apiClient.listCompanies()`
- ❌ `src/api/billingApi.ts` - USE `billingService`
- ❌ `src/api/adapters/base44Adapter.ts` - USE `restAdapter`

---

## ✅ MIGRATION CHECKLIST - PAGES MIGRATED

Pages that MUST use new stack:
- [x] SubscriptionPage.jsx - Uses `useAuth` from AuthContextDecoupled
- [x] EmployeeDetailNew.jsx - Uses `authService` + `employeeService`
- [x] EmployeeCreateNew.jsx - Uses `authService` + `employeeService`
- [ ] MyDashboard.jsx - Check for base44 usage
- [ ] EmployeeListNew.jsx - Check for base44 usage
- [ ] All other pages - Verify zero base44 imports

---

## 🛑 CI/CD GATE - PRE-DEPLOYMENT CHECKS

Before any deploy, run:
```bash
# Grep for base44 usage
grep -r "base44\|@base44" src/pages src/components src/services --include="*.js" --include="*.jsx"

# Should return ZERO results
# If any results → BLOCK DEPLOYMENT
```

---

## 📝 RUNNING CHECKLIST

```
Pages Migrated:
  ✓ SubscriptionPage
  ✓ EmployeeDetailNew
  ✓ EmployeeCreateNew
  - MyDashboard (TODO)
  - EmployeeListNew (TODO)
  - All dashboard pages (TODO)
  - All consultant pages (TODO)
  - All admin pages (TODO)
  - All employee pages (TODO)

Services Migrated:
  ✓ authService
  ✓ employeeService
  ✓ attendanceService
  ✓ leaveService
  ✓ billingService
  ✓ companyService
  
API Layer Migrated:
  ✓ apiClient (unified REST client)
  ✓ restAdapter (HTTP transport)
  ✓ AuthContextDecoupled (React context)

Deprecated (DO NOT USE):
  ❌ base44Client.js
  ❌ AuthContext.jsx
  ❌ base44Adapter.ts
  ❌ @base44/sdk imports
```

---

## ⚡ MIGRATION SPEED TIPS

When migrating a page:
1. Find all `base44.*` calls
2. Replace with service methods (authService, employeeService, etc.)
3. Replace `useAuth` from old context → new context
4. Test immediately
5. Never "TODO" a base44 call - replace it NOW

---

## 🚨 IF REGRESSION DETECTED

If ANY base44 code is found after this point:
1. IMMEDIATE investigation
2. Undo the commit that added it
3. Enforce REST pattern instead
4. Document why (if legacy is truly needed)

**NO EXCEPTIONS - ZERO TOLERANCE**
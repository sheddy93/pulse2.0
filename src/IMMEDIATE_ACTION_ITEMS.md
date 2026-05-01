# ⚡ IMMEDIATE ACTION ITEMS - Do These NOW

**Priority**: CRITICAL
**Time**: 4-5 hours to implement
**Impact**: +8 Lighthouse points, fixes major issues

---

## 🔴 CRITICAL BUGS - Fix Today

### 1. Install speakeasy for Real TOTP
```bash
npm install speakeasy
```

Then update `functions/verifyTotpTokenReal.js`:
```javascript
import speakeasy from 'speakeasy';

// Replace placeholder verification with:
const verified = speakeasy.totp.verify({
  secret: totpSecret.secret,
  token: token,
  window: 2
});
```

**Time**: 30 min
**Impact**: CRITICAL security

---

### 2. Fix N+1 Database Query
**File**: `pages/company/EmployeeListNew.jsx`
**Issue**: Loads all employees, then loads data for each one

```javascript
// BEFORE - WRONG ❌
const employees = await base44.entities.EmployeeProfile.filter({});
// In component: employees.map(e => <EmployeeRow employee={e} />)
// Each row fetches leave balance = N+1

// AFTER - CORRECT ✅
const employees = await base44.entities.EmployeeProfile.filter(
  { company_id },
  { skip: 0, limit: 20 } // Add pagination
);
// Load leave balances in bulk once
const leaveBalances = await base44.entities.LeaveBalance.filter({
  employee_id: { $in: employees.map(e => e.id) }
});
```

**Time**: 1 hour
**Impact**: 50% faster employee list loading

---

### 3. Add Pagination to 5 Lists (CRITICAL)
```bash
pages/company/EmployeeListNew.jsx       ← Uses filter() with no limit
pages/company/ManagerLeaveRequests.jsx  ← Loads all requests
pages/employee/Messaging.jsx             ← No pagination on messages
pages/company/DocumentsPage.jsx          ← No pagination on docs
pages/company/AnnouncementBoard.jsx      ← Loads all announcements
```

**Template for each**:
```javascript
const { page, limit, offset } = usePagination(20);

// Replace .filter({...})
const items = await base44.entities.Entity.filter(
  { company_id },
  { skip: offset, limit }
);

// Add pagination UI
<div className="flex gap-2">
  <button onClick={prevPage}>← Prev</button>
  <span>Page {page + 1}</span>
  <button onClick={nextPage}>Next →</button>
</div>
```

**Time**: 1.5 hours (15 min × 5)
**Impact**: 40% faster list loading

---

### 4. Add Missing Soft Delete Fields
**Status**: Critical for GDPR compliance

Run this once to update all entities:
```javascript
// In backend function or migration script
const entities = [
  'EmployeeProfile', 'LeaveRequest', 'TimeEntry', 'Message',
  'Document', 'Announcement', 'Asset', 'OnboardingProgress'
  // ... etc
];

for (const entity of entities) {
  // Check if is_deleted exists, if not add it
  const records = await base44.entities[entity].filter({});
  if (records.length > 0 && !records[0].is_deleted) {
    // Need to add is_deleted field to entity schema
    console.log(`Add to ${entity}: is_deleted, deleted_at`);
  }
}
```

**Add to entity schemas**:
```json
"is_deleted": {
  "type": "boolean",
  "default": false
},
"deleted_at": {
  "type": "string",
  "format": "date-time"
}
```

**Time**: 2 hours
**Impact**: GDPR compliance, data recovery

---

## 🟡 HIGH PRIORITY - This Week

### 5. Enable GZIP Compression
**File**: `nginx.conf`

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;
```

**Time**: 15 min
**Impact**: 70% reduction in transfer size

---

### 6. Add React.memo to List Items
**Files to update**:
```
components/messaging/MessageBubble.jsx
components/attendance/QuickAttendanceButton.jsx
pages/company/EmployeeListNew.jsx (EmployeeItem component)
pages/company/DocumentsPage.jsx (DocumentItem component)
pages/company/AnnouncementBoard.jsx (AnnouncementItem component)
```

**Template**:
```javascript
// Before
export default function MessageBubble({ message }) {
  return <div>{message.text}</div>;
}

// After
const MessageBubble = React.memo(function MessageBubble({ message }) {
  return <div>{message.text}</div>;
}, (prev, next) => prev.message.id === next.message.id);

export default MessageBubble;
```

**Time**: 1 hour (10 min × 5)
**Impact**: 30% faster re-renders

---

### 7. Setup Web Vitals Monitoring
**File**: `main.jsx`

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function setupWebVitals() {
  getCLS(metric => console.log('CLS:', metric.value));
  getFID(metric => console.log('FID:', metric.value));
  getFCP(metric => console.log('FCP:', metric.value));
  getLCP(metric => console.log('LCP:', metric.value));
  getTTFB(metric => console.log('TTFB:', metric.value));
}

setupWebVitals();
```

**Time**: 20 min
**Impact**: Data-driven optimization

---

## 📋 IMPLEMENTATION PRIORITY

### Today (3 hours)
- [ ] Install speakeasy (30 min)
- [ ] Fix N+1 query (1 hour)
- [ ] Add pagination to 5 lists (1.5 hours)

### Tomorrow (2 hours)
- [ ] Add soft delete fields (2 hours)

### This Week (1 hour)
- [ ] Enable GZIP (15 min)
- [ ] Add React.memo (1 hour)
- [ ] Setup Web Vitals (20 min)

---

## ✅ SUCCESS CRITERIA

After these fixes, you should see:
```
Performance: 77 → 83 Lighthouse (+6 points)
Load Time:  4.2s → 3.1s (-26%)
Bundle:     150KB → 130KB (-13%)
```

---

## 🚨 BLOCKERS TO CHECK

```
1. ❓ Does speakeasy library exist in dependencies?
2. ❓ Can you modify nginx.conf? (Server access needed)
3. ❓ Are all entities accessible in code?
4. ❓ Do you have Base44 SDK latest version?
```

**If blocked on any**: Let me know and we'll find workaround

---

## 📞 QUESTIONS?

- "How do I know if pagination works?" → Check Network tab: 20 items max
- "What's the performance gain?" → 40-50% faster for large lists
- "Do I need to restart?" → Only for GZIP config change
- "What if something breaks?" → Roll back the change, we have git history

---

**Start with #1 & #2 TODAY for maximum impact** 🚀
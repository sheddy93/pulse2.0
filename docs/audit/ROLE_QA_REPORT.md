# PulseHR - Role QA Report

**Date:** 2026-04-30  
**Status:** COMPLETED

---

## Summary of Fixes Applied

### 1. Login Page - User Storage (CRITICAL FIX)

**Problem:** After login, token was saved but user object was NOT saved to localStorage.

**Fix Applied:**
- After login, if user is missing or has no role, fetch from `/auth/me/`
- Save user to both `localStorage.user` and `localStorage.hr_user`
- If role is unknown, show error instead of silent fallback

**File:** `frontend/app/login/page.jsx`

### 2. Navigation Config - Fallback Fix (CRITICAL FIX)

**Problem:** Unknown roles defaulted to employee menu, causing consultants/companies to see wrong menus.

**Fix Applied:**
- Unknown roles now show error menu with link to `/login`
- Console warning logs unknown role for debugging
- No automatic fallback to employee menu

**File:** `frontend/components/navigation-config.js`

### 3. AuthGuard - User Storage (FIX)

**Problem:** AuthGuard saved user only to `hr_user`, not to `user` key.

**Fix Applied:**
- Now saves to both `hr_user` (legacy) and `user` (new) keys
- Ensures consistency across all auth-related code

**File:** `frontend/components/auth-guard.tsx`

### 4. Redirect Logic - Fallback Fix

**Problem:** Unknown roles defaulted to `/dashboard` instead of `/login`.

**Fix Applied:**
- If role is unknown, throw error and show message to user
- No silent redirect to any dashboard

**File:** `frontend/app/login/page.jsx`

---

## Role Matrix

| Role | Dashboard | Navigation Key |
|------|-----------|----------------|
| super_admin | /dashboard/admin | super_admin |
| platform_owner | /dashboard/admin | super_admin |
| company_owner | /dashboard/company | company_owner |
| company_admin | /dashboard/company | company_admin |
| hr_manager | /dashboard/company | hr_manager |
| manager | /dashboard/company | manager |
| labor_consultant | /dashboard/consultant | labor_consultant |
| safety_consultant | /dashboard/consultant | safety_consultant |
| external_consultant | /dashboard/consultant | external_consultant |
| employee | /dashboard/employee | employee |
| UNKNOWN | ERROR → /login | error menu |

---

## Test Checklist

After deployment, verify for each role:

### Super Admin
- [ ] Login saves `auth_token`
- [ ] Login saves `user` with `role: "super_admin"`
- [ ] Redirects to `/dashboard/admin`
- [ ] Sidebar shows: Dashboard, Aziende, Sicurezza, Fatturazione

### Consultant (labor/external/safety)
- [ ] Login saves `auth_token`
- [ ] Login saves `user` with role starting with `_consultant`
- [ ] Redirects to `/dashboard/consultant`
- [ ] Sidebar shows: Dashboard, Aziende, Payroll, Documenti
- [ ] Does NOT see employee-only menus

### Company Owner/Admin
- [ ] Login saves `auth_token`
- [ ] Login saves `user` with role `company_owner` or `company_admin`
- [ ] Redirects to `/dashboard/company`
- [ ] Sidebar shows: Dashboard, Utenti, Presenze, Documenti

### Employee
- [ ] Login saves `auth_token`
- [ ] Login saves `user` with `role: "employee"`
- [ ] Redirects to `/dashboard/employee`
- [ ] Sidebar shows: Dashboard, Presenze, Buste paga, Richieste
- [ ] Does NOT see company management menus

### Unknown Role Test
- [ ] Create user with invalid role in DB
- [ ] Login shows error message
- [ ] Console logs warning with unknown role

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/app/login/page.jsx` | User storage, fetch /auth/me/, error handling |
| `frontend/components/navigation-config.js` | No fallback to employee menu |
| `frontend/components/auth-guard.tsx` | Save user to both storage keys |

---

## Deployment Instructions

1. **Git push** → triggers auto-deploy on Vercel
2. **After deploy** → Clear browser cache/site data
3. **Test each role** using checklist above

---

*Report generated: PulseHR M2.7 Role QA*

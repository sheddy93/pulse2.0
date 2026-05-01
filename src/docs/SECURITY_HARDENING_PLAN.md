# Security Hardening Plan

**Status:** Planning phase
**Priority:** HIGH - Must complete before production
**Deadline:** Q2 2026 end

---

## 🔒 Current Security Issues

### CRITICAL
- [ ] No rate limiting on API calls (abuse vector)
- [ ] No CORS restrictions (CSRF risk)
- [ ] Auth tokens in localStorage (XSS risk)
- [ ] No HTTPS enforcement
- [ ] No CSP headers

### HIGH
- [ ] API keys stored in frontend env vars (visible in source)
- [ ] No request signature validation
- [ ] No SQL injection protection (Base44 helps, but custom queries vulnerable)
- [ ] Permissions checked on frontend only (should be backend)
- [ ] No audit logging of sensitive operations

### MEDIUM
- [ ] No password complexity enforcement
- [ ] No 2FA support
- [ ] No session timeout
- [ ] No data encryption at rest
- [ ] No PII masking in logs

---

## ✅ Mitigations

### 1. Rate Limiting
```
Implement:
- 100 req/min per authenticated user
- 10 req/min per IP for login endpoint
- 50 req/min per company for bulk operations
- Return 429 with Retry-After header
```

### 2. CORS & Security Headers
```
Add:
- CORS: Allow only your domain
- CSP: Restrict script sources
- HSTS: Force HTTPS
- X-Frame-Options: DENY (prevent clickjacking)
- X-Content-Type-Options: nosniff
```

### 3. Token Management
```
Replace:
- localStorage → httpOnly cookies (secure, sameSite=strict)
- Add token refresh rotation
- Add token revocation on logout
- Add session timeout (15 min inactivity)
```

### 4. API Key Security
```
Required:
- Move API keys to Backend Functions (Deno)
- Use secret manager (Base44 secrets)
- Never expose keys in frontend
- Rotate keys every 90 days
- Log all API key access
```

### 5. Permission Enforcement
```
Add:
- Backend authorization checks (not frontend)
- Row-level security (company_id filtering)
- Field-level encryption for sensitive data
- Audit logging for all CRUD operations
```

### 6. Audit Logging
```
Log:
- All login attempts (success + failure)
- All permission changes
- All document access
- All approval decisions
- All exports (payroll, reports)
- IP address + user agent for all actions
```

---

## 📋 Implementation Timeline

| Task | Sprint | Effort |
|------|--------|--------|
| Rate limiting | S1 | 15h |
| CORS + headers | S1 | 8h |
| Token to httpOnly | S1 | 12h |
| API key extraction | S2 | 20h |
| Backend permission checks | S2 | 25h |
| Audit logging | S3 | 30h |
| 2FA support | S4 | 25h |
| PII masking | S4 | 15h |
| Penetration testing | S5 | 20h |

**Total:** ~170 hours
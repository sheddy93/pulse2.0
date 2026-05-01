# Security Hardening Plan - AldevionHR

## 1. RBAC Backend (Role-Based Access Control)

**Status**: Design phase  
**Priority**: CRITICAL

### Implementazione
- [ ] Middleware Express/FastAPI per validare permessi su ogni endpoint
- [ ] Policy engine per decision-making complesso (tenant, resource, action)
- [ ] Matrice RBAC nel database (role_permissions table)
- [ ] Audit log per ogni decisione di autorizzazione

### Specifiche
```
Ogni endpoint deve:
1. Verificare token JWT valido
2. Recuperare ruolo utente da database (non da token)
3. Verificare permesso specifico vs risorsa richiesta
4. Loggare l'accesso
5. Rifiutare se non autorizzato
```

---

## 2. Tenant Isolation

**Status**: In progress  
**Priority**: CRITICAL

### Implementazione
- [x] Company-based data filtering (già implementato in entity queries)
- [x] User associazione con company_id
- [ ] Database-level row-level security (PostgreSQL RLS)
- [ ] Network segregation future (VPC per azienda)

### Validazione
- [ ] Test: Utente azienda A non può accedere dati azienda B
- [ ] Test: API chiama sempre filtrano per company_id
- [ ] Test: Cross-company exploit impossibile anche con admin token

---

## 3. Audit Log Completo

**Status**: Implementato (entità AuditLog)  
**Priority**: HIGH

### Campi tracciati
- [x] Chi: user_id, email, IP
- [x] Cosa: entity, operation, old_value, new_value
- [x] Quando: timestamp
- [x] Dove: company_id, resource_id
- [x] Risultato: success/fail, error_message

### Integrazioni richieste
- [ ] Immutabilità log (append-only)
- [ ] Retention policy (7 anni per compliance)
- [ ] Sentry integration per anomalie
- [ ] Monthly export per audit esterno

---

## 4. Rate Limiting

**Status**: Parziale (implementato in backend)  
**Priority**: MEDIUM

### Implementazione
- [x] checkRateLimit backend function
- [ ] Redis per tracking globale
- [ ] Per-user limits
- [ ] Per-IP limits
- [ ] Per-endpoint limits

### Limiti consigliati
```
API Endpoint: 100 req/min per IP
Login: 5 tentativi/5 min
Export: 5 job/ora
Sensitive ops: 10/ora
```

---

## 5. GDPR Compliance

**Status**: Design phase  
**Priority**: HIGH

### Data Export (Right to Portability)
- [ ] Export full user data as JSON
- [ ] Include all personal data across entities
- [ ] Option per employee self-service
- [ ] Log export per audit

### Data Deletion (Right to be Forgotten)
- [ ] Soft-delete user records
- [ ] Anonymize in audit logs (keep hash only)
- [ ] Remove from Stripe/integrations
- [ ] Scheduled hard-delete after 30 days
- [ ] Log deletion per audit

### Data Residency
- [ ] EU data on EU servers
- [ ] Privacy notice in-app
- [ ] Consent tracking per user

---

## 6. Backup & Disaster Recovery

**Status**: Design phase  
**Priority**: HIGH

### Backup Strategy
- [ ] Daily automated backups (full + incremental)
- [ ] 30-day retention minimum
- [ ] Offsite backup (different region)
- [ ] Encryption at rest (AES-256)
- [ ] Monthly backup test/restore

### RTO/RPO
- RTO: 4 ore (max downtime)
- RPO: 1 ora (max data loss)

---

## 7. Document Security

**Status**: Implementato (signed URLs)  
**Priority**: HIGH

### Signed URLs
- [x] Temporary, time-limited access
- [x] Single-use recommended
- [ ] Custom expiration per document type
- [ ] Audit log per download

### File Validation
- [x] Whitelist MIME types (PDF, DOCX, XLS, images)
- [x] File size limits (50MB max)
- [x] Virus scanning future (ClamAV)
- [ ] OCR/DLP scanning per sensibilità

### Storage Security
- [x] Private bucket (no public access)
- [x] Encryption in transit (TLS)
- [ ] Encryption at rest
- [ ] Access logs per file

---

## 8. CORS & CSRF

**Status**: Design phase  
**Priority**: MEDIUM

### CORS
- [ ] Whitelist origin domains
- [ ] No wildcard `*` in production
- [ ] Credentials only from same-site
- [ ] Preflight validation

### CSRF
- [ ] Double-submit cookie tokens
- [ ] SameSite=Strict per cookie
- [ ] Validate Origin header
- [ ] POST for state changes only

---

## 9. Secure Cookies

**Status**: Design phase  
**Priority**: MEDIUM

### JWT/Session Cookies
- [ ] HttpOnly flag (no JS access)
- [ ] Secure flag (HTTPS only)
- [ ] SameSite=Strict
- [ ] Max-Age = 24h (short expiry)
- [ ] Rotate on each login

---

## 10. Logging & Monitoring

**Status**: Parziale  
**Priority**: HIGH

### Sentry Integration
- [ ] Error tracking con stack traces
- [ ] Performance monitoring
- [ ] Release tracking
- [ ] Alert su critical errors

### Logging Strategy
- [ ] Console logs in dev
- [ ] Sentry in production
- [ ] Structured logging (JSON)
- [ ] Sensitive data masking (pwd, tokens)
- [ ] Log retention: 90 giorni

### Metriche monitorate
- [ ] Failed login attempts
- [ ] Permission denied errors
- [ ] Data export requests
- [ ] Large file uploads
- [ ] API rate limit violations

---

## 11. Third-Party Security

**Status**: In review  
**Priority**: MEDIUM

### OAuth Integrations
- [x] GitHub: repo, workflow
- [ ] Google: calendar, drive (coming)
- [ ] Slack: (coming)
- Security checklist: revoca token, scope minimization, refresh strategy

### Stripe Integration
- [x] Webhooks con signature validation
- [x] No sensitive data in logs
- [ ] PCI compliance (non-storage di card data)
- [ ] Monthly reconciliation

---

## 12. Security Testing

**Status**: Design phase  
**Priority**: MEDIUM

### Test coverage
- [ ] Unit tests per permission check
- [ ] Integration tests per endpoint
- [ ] OWASP Top 10 penetration testing
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF prevention

### Frequency
- [ ] Per-sprint security review
- [ ] Quarterly penetration test
- [ ] Annual third-party audit

---

## Security Checklist Pre-Go-Live

- [ ] RBAC backend implementato
- [ ] Tenant isolation testato
- [ ] Audit log completato
- [ ] GDPR export/delete funzionante
- [ ] Rate limiting attivo
- [ ] Sentry integrato
- [ ] CORS/CSRF implementati
- [ ] Backup & restore testato
- [ ] Signed URLs per documenti
- [ ] All endpoints secured

---

## Timeline

| Fase | Features | Timeline |
|------|----------|----------|
| **Phase 1** | RBAC backend, Tenant isolation, Rate limiting | Sprint 1-2 |
| **Phase 2** | GDPR (export/delete), Backup/RDR, Sentry | Sprint 3-4 |
| **Phase 3** | CORS/CSRF, Logging advanced, Security testing | Sprint 5-6 |
| **Phase 4** | Penetration test, Audit esterno | Pre-launch |

---

## Compliance Standards

- [ ] GDPR (EU)
- [ ] ISO 27001 (future)
- [ ] SOC 2 (future)
- [ ] HIPAA (future, se healthcare)

---

**Last Updated**: 2026-05-01  
**Owner**: Security Team
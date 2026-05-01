# 🗺️ ROADMAP & REMAINING FEATURES

**Priority Level**: Features ranked by impact on revenue + user experience

---

## 🔴 CRITICAL (Do Before Launch)

### 1. Fix TOTP Implementation
```
Current: Placeholder (token = "000000")
Needed: Real TOTP verification using speakeasy library

[ ] Install speakeasy: npm install speakeasy qrcode
[ ] Implement real HMAC-SHA1 token verification
[ ] Generate actual QR codes (replace placeholder div)
[ ] Test with Google Authenticator

Effort: 4 hours
Impact: Security feature (must work)
Business: Enable 2FA marketing angle
```

### 2. Add 2FA to Login Flow
```
Current: 2FA page exists but not integrated into auth
Needed: Prompt for TOTP after password entry

Location: Base44 auth middleware (after password verified)
Logic:
  if (user.totp_enabled) {
    redirect to "/auth/2fa-verify?session=xyz"
  }

Effort: 6 hours
Impact: High (security compliance)
Business: Enterprise customers expect 2FA
```

### 3. Implement Soft Deletes
```
Current: Hard delete (permanent)
Needed: Soft delete (can restore)

Strategy:
  - Add "is_deleted" field to all entities
  - Add "deleted_at" timestamp
  - Filter deleted in all queries
  - Create restore endpoint

Entities affected: 30+
Effort: 12 hours
Impact: Data recovery, compliance
Business: Customer trust, GDPR compliance
```

### 4. Rate Limiting on Login
```
Current: Rate limiting exists but not on login endpoint
Issue: Brute force attacks possible

Needed:
  - Integrate checkRateLimit in auth flow
  - Max 5 attempts per 15 minutes
  - Block IP + email simultaneously

Effort: 2 hours
Impact: Security critical
Business: Prevent account takeovers
```

### 5. Mobile App (PWA Proper)
```
Current: PWA banner + offline support (partial)
Needed: Full PWA with:
  - Service worker offline sync
  - App installation (iPhone + Android)
  - Push notifications
  - Homescreen icon

Files needed:
  - manifest.json (update)
  - service-worker.js (enhance)
  - Icons (192x192, 512x512)

Effort: 8 hours
Impact: Mobile-first era requires this
Business: Employee app for check-ins (key feature)
```

---

## 🟡 HIGH PRIORITY (First 3 months post-launch)

### 6. Email Notification System
```
Current: Code exists, not integrated everywhere
Missing notifications:
  [ ] Welcome email (on account creation)
  [ ] New message notification (implemented)
  [ ] Payroll available (implemented)
  [ ] Leave request update (implemented)
  [ ] Document expiring (implemented)
  [ ] Training completion (missing)
  [ ] Performance review due (missing)
  [ ] Shift schedule change (missing)

Effort: 6 hours (add 3 missing)
Impact: Engagement + retention
Business: Keep users informed = stickiness
```

### 7. Payroll Integration
```
Current: Generate CSV/PDF, but no real payroll
Needed:
  - Integration with Italian payroll system (Perseo, Consulenza?)
  - Net salary calculation
  - Tax withholding
  - Social contributions
  - Export to Conto Corrente format

Effort: 20 hours
Impact: High (payroll = core HR need)
Business: €100-€500/month upsell per customer
```

### 8. White-Label Option
```
Current: None
Needed: Consultants/resellers can rebrand

Requirements:
  - Custom domain: pulseHR → customer.domain
  - Logo replacement
  - Color customization
  - Custom email branding
  - Reseller dashboard (see customer health)

Effort: 16 hours
Impact: Channel revenue (reseller program)
Business: 20-30% commission per referred customer
```

### 9. Advanced Reporting (Excel/PDF Templates)
```
Current: Basic exports exist
Missing:
  [ ] Attendance report (per department, per month)
  [ ] Leave summary (forecast vs actual)
  [ ] Performance report (360° summaries)
  [ ] Turnover report (predictions)
  [ ] Compensation report (salary by role)

Effort: 12 hours (create 5 templates)
Impact: Medium (nice-to-have, but HR loves reports)
Business: +€50/month premium add-on
```

### 10. Google Calendar Sync
```
Current: Code exists (syncLeaveToGoogleCalendar)
Status: Not fully tested/integrated

[ ] Sync leave requests to Google Calendar
[ ] Sync shifts to Google Calendar
[ ] Two-way sync (Google → PulseHR?)
[ ] Test with 10 users

Effort: 4 hours
Impact: Integration = switching cost
Business: Integrations are key differentiator
```

### 11. Slack Integration
```
Current: Code exists (slackNotification)
Status: Partial (sends notifications)

Missing:
  [ ] Slash commands (/leave request, /check-in)
  [ ] Interactive buttons (approve/reject from Slack)
  [ ] Daily digest (who's out today?)
  [ ] Shift reminders
  [ ] Performance review reminders

Effort: 10 hours
Impact: Deep Slack integration = competitive advantage
Business: Slack-first teams will love this
```

---

## 🟢 MEDIUM PRIORITY (Months 4-6)

### 12. Mobile App (Native React Native)
```
Current: PWA only
Needed: Native iOS + Android apps

Why: PWA not as good for geolocation + push notifications
Cost: High (separate codebase)
Timeline: 12 weeks with developer
Budget: €15K-€30K

Benefit:
  - 30-40% more mobile engagement
  - Better geofence (native GPS)
  - Better offline support
  - App store presence = marketing

Decision: Do IF growth justifies it (100+ customers)
```

### 13. Analytics Dashboard 2.0
```
Current: Basic analytics exist
Upgrade needed:
  [ ] Custom date ranges
  [ ] Export to PDF/Excel
  [ ] Dashboards (customize which KPIs shown)
  [ ] Alerts (if X happens, email me)
  [ ] Trend predictions (ML-based)
  [ ] Department comparison
  [ ] Turnover predictions
  [ ] Salary analytics (if available)

Effort: 16 hours
Impact: High (analytics = differentiation)
Business: €100-€300/month premium feature
```

### 14. Learning Management System (LMS)
```
Current: Training courses exist, but basic
Upgrade:
  [ ] Course creation wizard
  [ ] Video upload + playback
  [ ] Quiz system + scoring
  [ ] Certificate generation
  [ ] Completion tracking
  [ ] Learning paths (courses → certification)
  [ ] Integration with LinkedIn Learning

Effort: 24 hours
Impact: Medium (nice add-on)
Business: €50/month add-on
```

### 15. Performance Review Improvements
```
Current: 360° reviews exist
Enhancements:
  [ ] Goal tracking (OKRs, SMART)
  [ ] Competency mapping
  [ ] Calibration workshops (compare ratings across teams)
  [ ] Anonymous feedback
  [ ] Review templates (customize per role)
  [ ] Historical comparison

Effort: 10 hours
Impact: Medium (enterprises want this)
Business: €100-€200/month premium
```

### 16. Document E-Signature (Proper)
```
Current: signDocument function exists, basic
Needed:
  [ ] DocuSign integration (or Notarize.io)
  [ ] Italian legal compliance (qualified signature)
  [ ] Audit trail (who signed when)
  [ ] Reminder for unsigned docs
  [ ] Batch signature requests
  [ ] GDPR-compliant archiving

Effort: 8 hours (if using DocuSign API)
Impact: High (contracts = legal requirement)
Business: €200-€500/month premium
```

---

## 🔵 NICE TO HAVE (If Time/Revenue Allows)

### 17. Wellness Features
```
Needs:
  - Mental health check-ins
  - Wellness challenges
  - Benefit enrollment (gym, insurance)
  - Sick leave tracking
  - Burnout risk alerts

Effort: 12 hours
Impact: Growing market (wellness + HR)
Business: €30-€50/month add-on
```

### 18. Exit Interview System
```
Needs:
  - Departing employee form
  - Interview scheduling
  - Feedback collection
  - Insights (why people leave?)
  - Retention recommendations

Effort: 4 hours
Impact: Low (few departures)
Business: €20/month add-on
```

### 19. Org Chart Visual
```
Current: Text-based employees list
Needs:
  - Drag-drop org chart editor
  - Reporting lines (who reports to whom)
  - Department visualization
  - Succession planning
  - Headcount by level

Effort: 6 hours
Impact: Medium (looks good in demos)
Business: Part of enterprise package
```

### 20. API Rate Limiting UI
```
Current: Rate limiting works (backend)
Needs:
  - Developer dashboard (see rate limits)
  - Upgrade options
  - Usage analytics
  - Webhook logs

Effort: 6 hours
Impact: Low (developers don't need UI, just docs)
Business: No direct revenue (support cost reduction)
```

---

## 📋 LAUNCH CHECKLIST

Before going live:
```
CRITICAL (must have):
[ ] Fix TOTP real implementation
[ ] Add 2FA to login flow
[ ] Rate limiting on login
[ ] Test on mobile (all pages)
[ ] Legal docs (ToS, Privacy, GDPR)
[ ] Pricing page (clear, no hidden fees)
[ ] Support email + chat
[ ] Refund policy
[ ] GDPR cookie consent
[ ] Analytics setup (track sign-ups, conversions)

HIGH (should have):
[ ] 5-10 case studies/testimonials
[ ] Landing page A/B tested
[ ] Onboarding wizard (first-time users)
[ ] FAQ page
[ ] Video tutorials (top 5 features)
[ ] Email drip campaign (new signups)
[ ] Partner program docs (if launching)
[ ] Pricing comparison page vs competitors

NICE (could have):
[ ] Blog posts (SEO)
[ ] LinkedIn company page
[ ] Twitter handle
[ ] Crunchbase profile
[ ] G2/Capterra profile
```

---

## 🎯 EFFORT SUMMARY

| Effort Level | Hours | Cost (€100/hr) | Impact | Timeline |
|--------------|-------|----------------|--------|----------|
| Critical (5 features) | 32 | €3,200 | 9/10 | 1-2 weeks |
| High (6 features) | 54 | €5,400 | 8/10 | 3-4 weeks |
| Medium (5 features) | 62 | €6,200 | 7/10 | 6-8 weeks |
| Nice (5 features) | 46 | €4,600 | 5/10 | 2-3 months |
| **TOTAL** | **194** | **€19,400** | - | **3 months** |

**Recommendation**: Do Critical + High (32+54=86 hours, €8,600) before launch.
Remaining (Medium + Nice) can be added over next 3-6 months based on customer feedback.

---

## 🚀 PHASED ROLLOUT

### MVP Launch (Week 1)
- Core HR: attendance, leave, documents, shifts, expense
- Pre-configured templates
- Basic analytics
- Support via email

### v1.1 (Week 2-3)
- [ ] Real TOTP 2FA
- [ ] 2FA login integration
- [ ] Soft deletes
- [ ] Rate limiting complete

### v1.2 (Week 4-6)
- [ ] Proper PWA (offline, push notifications)
- [ ] Payroll CSV export (full)
- [ ] Google Calendar sync
- [ ] Slack integration (basic)

### v1.3 (Week 7-12)
- [ ] White-label option
- [ ] Advanced reporting
- [ ] Performance review enhancements
- [ ] Email signature integration

### v2.0 (Month 4+)
- [ ] Native mobile apps
- [ ] Advanced analytics 2.0
- [ ] LMS features
- [ ] Wellness module

---

**Total time to "launch" (Critical + High): 2-3 weeks**
**Total time to "fully featured" (all but mobile): 3 months**
**Total time to "enterprise-ready" (incl. mobile): 6 months**

---

**Next Step**: Pick the top 3 critical items and start this week.
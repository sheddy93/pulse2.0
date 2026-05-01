# PULSEH - MASTER SPRINT PLAN (2026)
**Status:** Active development
**Team:** 4 devs full-time
**Timeline:** 6 months (Q2-Q3 2026)
**Total Effort:** 1,500 hours

---

## 🎯 SPRINTS BREAKDOWN

### **SPRINT 1: Foundation (Weeks 1-3) - ACTIVE NOW**
**Focus:** Stabilize core, add critical features
**Team:** 4 devs

- [x] Data mapper layer (done ✅)
- [x] Service layer framework (done ✅)
- [x] API contracts documented (done ✅)
- [x] Security audit (done ✅)
- [ ] **Mobile web responsive** (15h)
- [ ] **Real-time notifications** (Firebase FCM) (20h)
- [ ] **Bulk employee editor** (15h)
- [ ] **Rate limiting** (10h)
- [ ] **Audit logging complete** (10h)

**Deliverable:** MVP web stable + mobile responsive + bulk ops
**Tests:** 50% coverage minimum

---

### **SPRINT 2: API & Integrations (Weeks 4-6)**
- [ ] **REST API v1** (auth, employees, leave, attendance) (25h)
- [ ] **API documentation** (Swagger/OpenAPI) (10h)
- [ ] **Slack integration** (approvals → Slack) (30h)
- [ ] **Google Calendar sync** (leave → calendar) (20h)
- [ ] **Webhook events** (for third-party devs) (15h)
- [ ] **Rate limiting + API keys** (10h)

**Deliverable:** Public API, Slack + Google Calendar working
**Tests:** 70% coverage

---

### **SPRINT 3: Notifications & Push (Weeks 7-9)**
- [ ] **Firebase Cloud Messaging** (setup) (10h)
- [ ] **Push notification service** (backend) (20h)
- [ ] **Notification preferences UI** (15h)
- [ ] **Real-time approval alerts** (15h)
- [ ] **Mobile app PWA** (better offline) (15h)

**Deliverable:** Push notifications live for all events
**Tests:** 70% coverage

---

### **SPRINT 4: Mobile Native Start (Weeks 10-15)**
- [ ] **React Native project** (setup, shared logic) (20h)
- [ ] **Auth + login** (20h)
- [ ] **Tab navigation** (10h)
- [ ] **Time clock feature** (25h)
- [ ] **Attendance calendar** (20h)
- [ ] **Offline sync** (15h)
- [ ] **Push notifications** (15h)

**Deliverable:** MVP mobile app (timbratura + presence)
**Tests:** 60% coverage

---

### **SPRINT 5: Payroll Basics (Weeks 16-21)**
- [ ] **Payroll calculator engine** (50h)
- [ ] **Tax rules** (multi-country: IT, DE, UK, FR) (40h)
- [ ] **Salary processing batch** (20h)
- [ ] **Compliance reporting** (20h)
- [ ] **Batch export** (20h)

**Deliverable:** Payroll auto-calculation + export
**Tests:** 80% coverage

---

### **SPRINT 6: Custom Dashboards (Weeks 22-25)**
- [ ] **Dashboard widget system** (25h)
- [ ] **Drag-drop editor** (20h)
- [ ] **Custom charts** (20h)
- [ ] **Real-time KPI refresh** (15h)
- [ ] **Chart templates** (10h)

**Deliverable:** Configurable dashboards
**Tests:** 70% coverage

---

### **SPRINT 7: Predictive Analytics (Weeks 26-32)**
- [ ] **Data science setup** (ML pipeline) (20h)
- [ ] **Absenteeism prediction model** (30h)
- [ ] **Retention risk scoring** (25h)
- [ ] **Talent recommendations** (20h)
- [ ] **Dashboard integration** (15h)

**Deliverable:** ML insights live
**Tests:** Unit tests for models

---

### **SPRINT 8: GDPR Compliance (Weeks 33-38)**
- [ ] **Data export feature** (20h)
- [ ] **Right to be forgotten** (deletion cascade) (20h)
- [ ] **Data retention policies** (15h)
- [ ] **Backup & restore** (15h)
- [ ] **SOC2 prep** (20h)
- [ ] **Compliance reports** (15h)

**Deliverable:** GDPR compliant + backups automated
**Tests:** Integration tests

---

### **SPRINT 9: Advanced Geolocation (Weeks 39-44)**
- [ ] **Route tracking** (30h)
- [ ] **Check-in photos** (15h)
- [ ] **Break detection** (from GPS movement) (20h)
- [ ] **Heatmaps** (employee distribution) (20h)
- [ ] **Field worker mobile** (optimization) (15h)

**Deliverable:** Advanced location tracking live
**Tests:** 70% coverage

---

### **SPRINT 10: Multi-Language (Weeks 45-50)**
- [ ] **i18next setup** (10h)
- [ ] **Translation strings** (EN, IT, DE, FR, ES) (40h)
- [ ] **RTL support** (Arabic) (10h)
- [ ] **Language switching UI** (10h)
- [ ] **Date/currency localization** (10h)

**Deliverable:** App fully multi-language
**Tests:** 60% coverage

---

### **SPRINT 11: Mobile App Store (Weeks 51-56)**
- [ ] **iOS app refinements** (30h)
- [ ] **Android app refinements** (30h)
- [ ] **Push notifications mobile** (15h)
- [ ] **Biometric login** (15h)
- [ ] **App Store submission** (10h)
- [ ] **Play Store submission** (10h)

**Deliverable:** Native apps on App Store + Play Store
**Tests:** Device testing (10+ devices)

---

### **SPRINT 12: Enterprise Features (Weeks 57-60)**
- [ ] **Multi-location support** (25h)
- [ ] **Multi-currency** (20h)
- [ ] **White-label setup** (30h)
- [ ] **Custom fields** (20h)
- [ ] **Permission matrix** (granular) (20h)

**Deliverable:** Enterprise-ready features
**Tests:** 80% coverage

---

## 📊 RESOURCE ALLOCATION

```
WEEK  S1  S2  S3  S4  S5  S6  S7  S8  S9  S10 S11 S12
────────────────────────────────────────────────────
Dev1  🔴  🔴  🟠  🟠  🟡  🟢  🟢  🟢  🟡  🟡  🔴  🔴
Dev2  🔴  🔴  🔴  🟠  🔴  🔴  🔴  🟠  🟡  🟡  🟠  🟡
Dev3  🔴  🟠  🟠  🔴  🟠  🟠  🟠  🔴  🔴  🔴  🔴  🟠
Dev4  🟠  🟡  🟠  🔴  🔴  🟡  🟡  🟠  🟠  🟡  🟡  🟡

🔴 = Primary (100%)
🟠 = Secondary (50%)
🟡 = Support (25%)
```

---

## 🎯 VELOCITY TARGETS

| Sprint | Est. Hours | Actual | % Complete |
|--------|-----------|--------|-----------|
| S1 | 100 | - | Pending |
| S2 | 110 | - | Pending |
| S3 | 80 | - | Pending |
| S4 | 135 | - | Pending |
| S5 | 150 | - | Pending |
| S6 | 90 | - | Pending |
| S7 | 110 | - | Pending |
| S8 | 105 | - | Pending |
| S9 | 100 | - | Pending |
| S10 | 80 | - | Pending |
| S11 | 110 | - | Pending |
| S12 | 115 | - | Pending |
| **TOTAL** | **1,285h** | | |

---

## 🚀 RELEASE SCHEDULE

| Release | Target | Features |
|---------|--------|----------|
| **v1.0** | Week 6 | MVP web + mobile responsive |
| **v1.1** | Week 12 | API + Slack + Google Calendar |
| **v1.2** | Week 18 | Push notifications |
| **v2.0** | Week 24 | Mobile native (iOS/Android) |
| **v2.1** | Week 30 | Payroll calculator |
| **v2.2** | Week 36 | Predictive analytics |
| **v2.3** | Week 42 | GDPR compliance |
| **v3.0** | Week 56 | Enterprise (multi-location, white-label) |

---

## ✅ SUCCESS CRITERIA

### Per Sprint:
- [ ] Zero critical bugs
- [ ] Test coverage ≥ 70%
- [ ] Performance: Page load < 2s
- [ ] Mobile Lighthouse score ≥ 90
- [ ] Zero security vulnerabilities

### Overall (End Q3):
- [ ] Mobile app on stores (100K downloads target)
- [ ] API adoption > 30% customers
- [ ] Notifications open rate > 40%
- [ ] NPS improvement from 30 → 50
- [ ] Churn reduction < 5% monthly

---

## 📋 DEPENDENCIES & BLOCKERS

### Critical Path:
1. Data mapper layer ✅ (DONE)
2. Service layer refactor → depends on (1)
3. API implementation → depends on (2)
4. All subsequent work → depends on (2-3)

### Known Risks:
- **Payroll tax rules:** Different per country, needs compliance review
- **ML models:** Need historical data, may require 3 months to warm up
- **Mobile app:** React Native reuse needs careful architecture
- **GDPR:** Legal review required before launch

---

## 🔄 WEEKLY CADENCE

```
Monday:     Sprint planning (1h)
Tuesday:    Development sprint
Wednesday:  Development sprint
Thursday:   Code review + testing (2h)
Friday:     Demo + retrospective (1h)
```

---

## 📞 OWNER & REVIEWERS

- **Product Owner:** [TBD]
- **Tech Lead:** [TBD]
- **QA Lead:** [TBD]
- **DevOps:** [TBD]

---

## 🔗 Related Docs

- [BASE44_LOCKIN_AUDIT.md](./BASE44_LOCKIN_AUDIT.md)
- [API_CONTRACT.md](./API_CONTRACT.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [SECURITY_HARDENING_PLAN.md](./SECURITY_HARDENING_PLAN.md)
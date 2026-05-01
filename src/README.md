# PulseHR - Enterprise HR Management System

Modern, mobile-first HR management platform built with React, Base44, and Stripe.

## 🚀 Features

### Core HR
- ✅ Attendance tracking (GPS + Geofence)
- ✅ Leave & time-off management
- ✅ Overtime request handling
- ✅ Employee contracts & profiles
- ✅ Digital document signing
- ✅ Expense reimbursement

### Collaboration
- ✅ In-app chat with request integration
- ✅ Internal announcements
- ✅ Message notifications
- ✅ Real-time updates

### Mobile & Offline
- ✅ PWA (Progressive Web App)
- ✅ Offline-first with IndexedDB
- ✅ Biometric authentication
- ✅ Push notifications
- ✅ Auto-sync when online

### Advanced
- ✅ Dark mode
- ✅ Dashboard customization
- ✅ Admin analytics
- ✅ Stripe payments
- ✅ Role-based access control

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Base44 SDK (Deno)
- **Database:** Base44 Entities (Document DB)
- **Auth:** Base44 Auth + WebAuthn
- **Payments:** Stripe
- **Notifications:** Firebase
- **Charts:** Recharts
- **UI:** shadcn/ui

## 📦 Installation

```bash
git clone https://github.com/your-org/pulsehr.git
cd pulsehr
npm install
npm run dev
```

## 🔧 Configuration

1. Copy `.env.example` to `.env.local`
2. Fill in your API keys and secrets
3. Configure Base44 entities
4. Set up Stripe webhooks

```bash
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

## 📖 Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Security Hardening](./docs/SECURITY_HARDENING.md)
- [Features Roadmap](./docs/FEATURES_ROADMAP.md)
- [GoLive Checklist](./docs/GOLIVE_CHECKLIST.md)

## 🧪 Testing

```bash
# Unit & integration tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI dashboard
npm run test:ui
```

## 📊 Project Status

| Area | Status | Notes |
|------|--------|-------|
| Core Features | ✅ Complete | All Tier 1-2 done |
| Mobile/PWA | ✅ Complete | Offline sync working |
| Collaboration | ✅ Complete | Chat + requests |
| UI/UX | ✅ Complete | Dark mode included |
| Testing | 🔄 In Progress | Unit tests added |
| Docs | ✅ Complete | Full documentation |
| Performance | 🔄 Optimizing | Bundle optimization |
| Security | 🔄 Hardening | Pen testing todo |

## 🚀 Deployment

### Development
```bash
npm run dev
# http://localhost:5173
```

### Production
```bash
npm run build
npm run preview
# Production build ready in dist/
```

### With Docker
```bash
docker build -t pulsehr .
docker run -p 80:5173 pulsehr
```

## 🔐 Security

- Biometric authentication (Face ID/Touch ID)
- End-to-end encryption ready
- GDPR compliant
- Regular security audits
- Rate limiting & DDoS protection

See [SECURITY_HARDENING.md](./docs/SECURITY_HARDENING.md) for details.

## 📞 Support

- **Docs:** [Full Documentation](./docs)
- **Issues:** [GitHub Issues](https://github.com/your-org/pulsehr/issues)
- **Email:** support@pulsehr.app

## 📄 License

Proprietary - All rights reserved

## 👥 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

**Built with ❤️ by the PulseHR Team**
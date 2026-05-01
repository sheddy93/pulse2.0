# AldevionHR Migration Guide

## Da Base44 a Sistema Indipendente

Questa guida mostra come testare il nuovo stack backend NestJS + PostgreSQL.

### Prerequisiti

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (o via Docker)

### Setup Rapido (con Docker)

```bash
# 1. Clona il repo e naviga nella directory
cd aldevion-hr

# 2. Setup environment
cp backend/.env.example backend/.env
cp .env.example .env

# 3. Avvia PostgreSQL + Backend con Docker
docker-compose up -d

# 4. Inizializza il database
cd backend
npm install
npx prisma db push
npx prisma db seed  # optional: seed database

# 5. Avvia il frontend (in un altro terminale)
npm install
npm run dev
```

### Frontend API Configuration

Nel browser, apri il devtools e verifica che le API siano raggiungibili:

```javascript
// In browser console
fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
```

### Struttura Backend

```
backend/
├── src/
│   ├── auth/              # JWT authentication
│   ├── companies/         # Company management
│   ├── employees/         # Employee CRUD
│   ├── attendance/        # Clock in/out, attendance tracking
│   ├── leave/             # Leave requests & balance
│   ├── expense/           # Expense reimbursements
│   ├── document/          # Documents & signatures
│   ├── billing/           # Stripe integration (WIP)
│   ├── prisma/            # Database service
│   └── main.ts
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data
└── package.json
```

### API Endpoints

**Auth:**
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

**Employees:**
- `GET /api/employees` - List all
- `POST /api/employees` - Create
- `GET /api/employees/:id` - Get by ID
- `PUT /api/employees/:id` - Update
- `GET /api/employees/search?q=` - Search

**Attendance:**
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/today/:employeeId` - Today's attendance
- `GET /api/attendance/employee/:id` - History

**Leave:**
- `POST /api/leave/request` - Create request
- `GET /api/leave/pending` - Pending requests
- `PUT /api/leave/:id/approve` - Approve
- `PUT /api/leave/:id/reject` - Reject
- `GET /api/leave/balance/:employeeId` - Leave balance

**Expenses:**
- `POST /api/expenses` - Create
- `GET /api/expenses/pending/:status` - By status
- `PUT /api/expenses/:id/approve` - Approve
- `PUT /api/expenses/:id/reject` - Reject

**Documents:**
- `POST /api/documents` - Upload
- `GET /api/documents/company` - List
- `GET /api/documents/expiring` - Expiring soon
- `PUT /api/documents/:id/sign` - Sign document

### Frontend Services

Usa gli import dai service layer TypeScript:

```typescript
import { employeesService } from '@/services/employees.service';
import { attendanceService } from '@/services/attendance.service';
import { leaveService } from '@/services/leave.service';
import { expenseService } from '@/services/expense.service';

// Esempio
const employees = await employeesService.getAll();
const { data } = await attendanceService.clockIn({
  employeeId: '123',
  latitude: 45.1234,
  longitude: 12.5678,
});
```

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name "add_field"

# Push schema changes
npx prisma db push

# View database GUI
npx prisma studio
```

### Stripe Integration (TODO)

- Checkout sessions
- Webhook handling
- Invoice creation
- Subscription management

### Deployment

**Backend (Render.com / Railway):**
1. Connetti GitHub repo
2. Setta DATABASE_URL, JWT_SECRET, STRIPE_*
3. Deploy

**Frontend (Vercel):**
1. Connetti GitHub repo
2. Setta VITE_API_URL, VITE_STRIPE_PUBLIC_KEY
3. Deploy

### Troubleshooting

**Backend won't start:**
```bash
# Check logs
docker-compose logs backend

# Reset database
docker-compose down -v
docker-compose up -d
npx prisma db push
```

**CORS errors:**
- Verifica `FRONTEND_URL` in backend .env
- Controlla che il frontend usi la corretta `VITE_API_URL`

**Database connection refused:**
- PostgreSQL running? `docker-compose ps`
- Connection string corretta? Check `DATABASE_URL`

### Next Steps

1. ✅ Backend structure setup
2. ✅ Database schema (Prisma)
3. ✅ Auth (JWT)
4. ✅ Core CRUD endpoints
5. ⏳ Stripe billing integration
6. ⏳ File uploads (R2/S3)
7. ⏳ Email sending (Resend)
8. ⏳ Background jobs (Bull/BullMQ)
9. ⏳ Real-time updates (WebSockets)

---

**Status:** Backend skeleton complete. Ready for testing locally.
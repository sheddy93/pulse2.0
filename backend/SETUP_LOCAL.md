# PulseHR - Guida Setup Locale

## 🚀 Quick Start (3 passi)

### 1. Esegui setup automatico
```bash
cd C:\Users\shedd\Desktop\webApp\hr-app\backend
setup-local.bat
```

### 2. Apri il browser
Vai a: http://127.0.0.1:8000/admin

### 3. Login con credenziali test

---

## 📋 Credenziali Test

| Ruolo | Email | Password |
|-------|-------|----------|
| **Super Admin** | admin@pulsehr.test | admin123 |
| **Company Owner** | owner@test.pulsehr.test | owner123 |
| **Company Admin** | admin@company.pulsehr.test | admin123 |
| **Employee** | employee@test.pulsehr.test | employee123 |
| **Consultant** | consultant@pulsehr.test | consultant123 |

---

## 🔧 Setup Manuale (se setup-local.bat non funziona)

### 1. Installa dipendenze Python
```bash
python -m pip install django djangorestframework python-dateutil python-dotenv django-cors-headers reportlab openpyxl pillow
```

### 2. Crea migrations
```bash
cd C:\Users\shedd\Desktop\webApp\hr-app\backend
python manage.py makemigrations users
python manage.py migrate
```

### 3. Crea utenti test (in Python shell)
```bash
python manage.py shell
```

```python
from users.models import User, Company, EmployeeProfile, PricingPlan
from users.services import ensure_company_roles
from django.utils import timezone

# Crea piano default
PricingPlan.objects.get_or_create(
    name="professional",
    defaults={
        "display_name": "Professional",
        "monthly_price": 49,
        "max_employees": 50,
        "max_storage_gb": 100,
    }
)

# Crea azienda test
company = Company.objects.create(
    name="Azienda Test SRL",
    slug="test-company",
    plan="professional",
    status=Company.StatusChoices.ACTIVE,
)

# Crea ruoli aziendali
roles = ensure_company_roles(company)

# Super Admin
admin = User.objects.create_superuser(
    email="admin@pulsehr.test",
    password="admin123",
    role=User.RoleChoices.SUPER_ADMIN,
)

# Company Owner
owner = User.objects.create_user(
    email="owner@test.pulsehr.test",
    password="owner123",
    role=User.RoleChoices.COMPANY_OWNER,
    company=company,
    company_role=roles[User.RoleChoices.COMPANY_OWNER],
)

# Employee
emp = User.objects.create_user(
    email="employee@test.pulsehr.test",
    password="employee123",
    role=User.RoleChoices.EMPLOYEE,
    company=company,
    company_role=roles[User.RoleChoices.EMPLOYEE],
)
EmployeeProfile.objects.create(
    user=emp,
    company=company,
    employee_code="EMP-001",
    first_name="Mario",
    last_name="Rossi",
)

print("Utenti creati!")
exit()
```

### 4. Avvia server
```bash
python manage.py runserver 0.0.0.0:8000
```

---

## 🌐 URL Utili

| Servizio | URL |
|----------|-----|
| **Admin Panel** | http://127.0.0.1:8000/admin |
| **API Root** | http://127.0.0.1:8000/api |
| **Login API** | http://127.0.0.1:8000/api/auth/login/ |
| **Employees** | http://127.0.0.1:8000/api/employees/ |
| **Attendance** | http://127.0.0.1:8000/api/time/check-in/ |

---

## 📱 Test Mobile App

Per testare la mobile app:
```bash
cd C:\Users\shedd\Desktop\webApp\hr-app-mobile
npx expo start
```

Scanizza il QR code con Expo Go (Android/iOS)

---

## ⚠️ Risoluzione Problemi

### "pip non riconosciuto"
```bash
python -m pip install django
```

### "Django not found"
```bash
python -m pip install django djangorestframework
```

### "Porta gia in uso"
```bash
python manage.py runserver 0.0.0.0:8001
```
Poi usa http://127.0.0.1:8001 invece di 8000

---

## 🧹 Reset Database

Per ricreare il database da zero:
```bash
cd C:\Users\shedd\Desktop\webApp\hr-app\backend
del db.sqlite3
python manage.py migrate --no-input
python manage.py setup-local  # se esiste
# oppure ricrea gli utenti manualmente
```

---

*Documento creato: 20 Aprile 2026*
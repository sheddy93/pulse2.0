@echo off
REM ============================================
REM PulseHR - Setup Locale Completo
REM ============================================
REM Esegui questo file come Amministratore per
REM configurare tutto per il testing locale
REM ============================================

echo.
echo ========================================
echo  PulseHR - Local Setup Script
echo ========================================
echo.

REM Check Python
python --version
if errorlevel 1 (
    echo Python non trovato! Installa Python 3.10+ da python.org
    pause
    exit /b 1
)

REM Navigate to backend
cd /d "%~dp0"

REM Install dependencies
echo.
echo [1/6] Installing Python dependencies...
echo.
python -m pip install django djangorestframework python-dateutil python-dotenv django-cors-headers reportlab openpyxl pillow --quiet

REM Create migrations
echo.
echo [2/6] Creating database migrations...
echo.
python manage.py makemigrations users --no-input

REM Apply migrations
echo.
echo [3/6] Applying migrations...
echo.
python manage.py migrate --no-input

REM Create test data
echo.
echo [4/6] Creating test users and data...
echo.
python manage.py shell << 'ENDPYTHON'
from users.models import User, Company, EmployeeProfile, PricingPlan
from users.services import ensure_company_roles
from django.utils import timezone
import hashlib

# Create default pricing plans
plans_data = [
    {"name": "starter", "display_name": "Starter", "monthly_price": 0, "max_employees": 5, "max_storage_gb": 1, "modules": "attendance,documents"},
    {"name": "professional", "display_name": "Professional", "monthly_price": 49, "max_employees": 50, "max_storage_gb": 100, "modules": "attendance,documents,payroll,reports,leave"},
    {"name": "enterprise", "display_name": "Enterprise", "monthly_price": 199, "max_employees": 500, "max_storage_gb": 1000, "modules": "attendance,documents,payroll,reports,leave,safety,api_access"},
]

for plan_data in plans_data:
    PricingPlan.objects.get_or_create(
        name=plan_data["name"],
        defaults=plan_data
    )
print("Pricing plans created")

# Create test company
company, _ = Company.objects.get_or_create(
    slug="test-company",
    defaults={
        "name": "Azienda Test SRL",
        "plan": "professional",
        "status": Company.StatusChoices.ACTIVE,
        "trial_ends_at": timezone.now() + timezone.timedelta(days=14),
    }
)
print(f"Company: {company.name}")

# Ensure roles exist
roles = ensure_company_roles(company)

# Create Super Admin
super_admin, created = User.objects.get_or_create(
    email="admin@pulsehr.test",
    defaults={
        "role": User.RoleChoices.SUPER_ADMIN,
        "is_staff": True,
        "is_superuser": True,
    }
)
if created:
    super_admin.set_password("admin123")
    super_admin.save()
    print("Super Admin: admin@pulsehr.test / admin123")
else:
    print(f"Super Admin exists")

# Create Company Owner
owner, created = User.objects.get_or_create(
    email="owner@test.pulsehr.test",
    defaults={
        "role": User.RoleChoices.COMPANY_OWNER,
        "company": company,
        "company_role": roles.get(User.RoleChoices.COMPANY_OWNER),
    }
)
if created:
    owner.set_password("owner123")
    owner.save()
    print("Company Owner: owner@test.pulsehr.test / owner123")
else:
    print(f"Company Owner exists")

# Create Company Admin
admin, created = User.objects.get_or_create(
    email="admin@company.pulsehr.test",
    defaults={
        "role": User.RoleChoices.COMPANY_ADMIN,
        "company": company,
        "company_role": roles.get(User.RoleChoices.COMPANY_ADMIN),
    }
)
if created:
    admin.set_password("admin123")
    admin.save()
    print("Company Admin: admin@company.pulsehr.test / admin123")
else:
    print(f"Company Admin exists")

# Create Employee
emp_user, created = User.objects.get_or_create(
    email="employee@test.pulsehr.test",
    defaults={
        "role": User.RoleChoices.EMPLOYEE,
        "company": company,
        "company_role": roles.get(User.RoleChoices.EMPLOYEE),
    }
)
if created:
    emp_user.set_password("employee123")
    emp_user.save()
    
    EmployeeProfile.objects.create(
        user=emp_user,
        company=company,
        employee_code="EMP-001",
        first_name="Mario",
        last_name="Rossi",
        status=EmployeeProfile.StatusChoices.ACTIVE,
    )
    print("Employee: employee@test.pulsehr.test / employee123")
else:
    print(f"Employee exists")

# Create Consultant
consultant, created = User.objects.get_or_create(
    email="consultant@pulsehr.test",
    defaults={
        "role": User.RoleChoices.EXTERNAL_CONSULTANT,
        "company": company,
        "company_role": roles.get(User.RoleChoices.EXTERNAL_CONSULTANT),
    }
)
if created:
    consultant.set_password("consultant123")
    consultant.save()
    
    from users.models import ConsultantCompanyLink, UserCompanyAccess
    ConsultantCompanyLink.objects.get_or_create(
        consultant=consultant,
        company=company,
        defaults={
            "status": ConsultantCompanyLink.StatusChoices.APPROVED,
            "requested_by": ConsultantCompanyLink.RequestedByChoices.COMPANY,
            "active": True,
            "approved_at": timezone.now(),
        }
    )
    UserCompanyAccess.objects.get_or_create(
        user=consultant,
        company=company,
        defaults={
            "company_role": roles.get(User.RoleChoices.EXTERNAL_CONSULTANT),
            "access_scope": UserCompanyAccess.AccessScopeChoices.READ_ONLY,
            "is_primary": True,
            "is_active": True,
        }
    )
    print("Consultant: consultant@pulsehr.test / consultant123")
else:
    print(f"Consultant exists")

print("")
print "========================================"
print " Test data created successfully!"
print "========================================"
ENDPYTHON

REM Create frontend .env.local
echo.
echo [5/6] Creating frontend config...
echo.
cd ..\app
if not exist .env.local (
    echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
    echo NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_placeholder >> .env.local
    echo Next.js frontend configured!
)

cd ..\backend

REM Start server
echo.
echo [6/6] Starting Django server...
echo.
echo ========================================
echo  Server: http://127.0.0.1:8000
echo  Admin:  http://127.0.0.1:8000/admin
echo  API:    http://127.0.0.1:8000/api
echo ========================================
echo.
echo TEST CREDENTIALS:
echo ----------------------------------------
echo Super Admin:   admin@pulsehr.test / admin123
echo Company Owner: owner@test.pulsehr.test / owner123
echo Company Admin: admin@company.pulsehr.test / admin123
echo Employee:      employee@test.pulsehr.test / employee123
echo Consultant:    consultant@pulsehr.test / consultant123
echo ----------------------------------------
echo.
echo Press Ctrl+C to stop server
echo.

python manage.py runserver 0.0.0.0:8000
# PulseHR Local Setup Script
# ============================
# Run this to setup and start the backend for testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PulseHR - Local Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location "C:\Users\shedd\Desktop\webApp\hr-app\backend"

# Check Python
Write-Host "[1/6] Checking Python..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python not found! Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
Write-Host "[2/6] Installing dependencies..." -ForegroundColor Yellow
pip install django djangorestframework python-dateutil python-dotenv
pip install reportlab openpyxl pillow
pip install django-cors-headers
Write-Host "Dependencies installed!" -ForegroundColor Green

# Create migrations
Write-Host "[3/6] Creating database migrations..." -ForegroundColor Yellow
python manage.py makemigrations users --no-input

# Apply migrations
Write-Host "[4/6] Applying migrations..." -ForegroundColor Yellow
python manage.py migrate --no-input

# Create test superuser
Write-Host "[5/6] Creating test users..." -ForegroundColor Yellow

python manage.py shell << 'PYTHON'
from users.models import User, Company, EmployeeProfile
from users.services import ensure_company_roles

# Create test company
company, _ = Company.objects.get_or_create(
    slug="test-company",
    defaults={
        "name": "Azienda Test SRL",
        "plan": "professional",
        "status": Company.StatusChoices.ACTIVE,
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
    print("Super Admin created: admin@pulsehr.test / admin123")
else:
    print(f"Super Admin exists: {super_admin.email}")

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
    print("Company Owner created: owner@test.pulsehr.test / owner123")
else:
    print(f"Company Owner exists: {owner.email}")

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
    
    # Create employee profile
    EmployeeProfile.objects.create(
        user=emp_user,
        company=company,
        employee_code="EMP-001",
        first_name="Mario",
        last_name="Rossi",
        status=EmployeeProfile.StatusChoices.ACTIVE,
    )
    print("Employee created: employee@test.pulsehr.test / employee123")
else:
    print(f"Employee exists: {emp_user.email}")

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
    
    # Link consultant to company
    from users.models import ConsultantCompanyLink, UserCompanyAccess
    ConsultantCompanyLink.objects.get_or_create(
        consultant=consultant,
        company=company,
        defaults={
            "status": ConsultantCompanyLink.StatusChoices.APPROVED,
            "requested_by": ConsultantCompanyLink.RequestedByChoices.COMPANY,
            "active": True,
            "approved_at": __import__('django.utils.timezone').timezone.now(),
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
    print("Consultant created: consultant@pulsehr.test / consultant123")
else:
    print(f"Consultant exists: {consultant.email}")

print("\n=== All test users ready! ===")
PYTHON

# Start server
Write-Host ""
Write-Host "[6/6] Starting Django server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Server will run at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host ""
Write-Host " Test Credentials:" -ForegroundColor Cyan
Write-Host " ----------------------------------------" -ForegroundColor Gray
Write-Host " Super Admin: admin@pulsehr.test / admin123" -ForegroundColor White
Write-Host " Company Owner: owner@test.pulsehr.test / owner123" -ForegroundColor White
Write-Host " Employee: employee@test.pulsehr.test / employee123" -ForegroundColor White
Write-Host " Consultant: consultant@pulsehr.test / consultant123" -ForegroundColor White
Write-Host " ----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host " Admin Panel: http://127.0.0.1:8000/admin" -ForegroundColor Cyan
Write-Host " API: http://127.0.0.1:8000/api" -ForegroundColor Cyan
Write-Host ""

python manage.py runserver 0.0.0.0:8000
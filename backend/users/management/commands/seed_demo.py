"""
Seed Demo Command
================
Crea dati demo realistici per testing.
Run: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from users.models import (
    Company, User, EmployeeProfile, Department, OfficeLocation,
    TimeEntry, LeaveRequest, LeaveBalance, LeaveType, Document,
    Notification, OnboardingProgress
)


class Command(BaseCommand):
    help = 'Creates realistic demo data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear demo data before creating new',
        )
        parser.add_argument(
            '--demo-mode',
            action='store_true',
            help='Mark created data as demo mode',
        )

    def handle(self, *args, **options):
        clear = options.get('clear', False)
        demo_mode = options.get('demo_mode', False)

        if clear:
            self.stdout.write('Clearing demo data...')
            self.clear_demo_data()

        self.stdout.write('Creating demo data...')

        # Crea azienda demo
        company = self.create_company(demo_mode)

        # Crea admin
        admin = self.create_admin(company)

        # Crea dipartimenti e sedi
        dept = self.create_department(company)
        location = self.create_location(company)

        # Crea dipendenti
        employees = self.create_employees(company, dept, location, admin, count=5)

        # Crea tipi ferie (company-specific)
        leave_types = self.create_leave_types(company)

        # Crea saldi ferie
        self.create_leave_balances(employees, leave_types)

        # Crea presenze demo
        self.create_attendance(employees)

        # Crea richieste ferie
        self.create_leave_requests(employees, leave_types)

        # Crea documenti
        self.create_documents(company, employees)

        # Crea notifiche
        self.create_notifications(admin, employees)

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Demo data created successfully!\n'
            f'  Company: {company.name}\n'
            f'  Admin: {admin.email} / password: Demo123!\n'
            f'  Employees: {len(employees)} created\n'
            f'  Demo mode: {"Yes" if demo_mode else "No"}\n'
        ))

    def clear_demo_data(self):
        """Rimuove dati demo."""
        Notification.objects.all().delete()
        Document.objects.all().delete()
        LeaveRequest.objects.all().delete()
        LeaveBalance.objects.all().delete()
        TimeEntry.objects.filter(company__name__startswith='Demo ').delete()
        LeaveType.objects.filter(company__name__startswith='Demo ').delete()
        EmployeeProfile.objects.filter(company__name__startswith='Demo ').delete()
        User.objects.filter(email__contains='demo').delete()
        Company.objects.filter(name__startswith='Demo ').delete()
        self.stdout.write('Demo data cleared.')

    def create_company(self, demo_mode):
        """Crea azienda demo."""
        company, _ = Company.objects.get_or_create(
            name='Demo Azienda SRL',
            defaults={
                'legal_name': 'Demo Azienda Società a Responsabilità Limitata',
                'vat_number': 'IT12345678901',
                'contact_email': 'info@demoazienda.it',
                'contact_phone': '+390123456789',
                'country_code': 'IT',
                'city': 'Roma',
                'postal_code': '00100',
                'address_line_1': 'Via Demo 123',
                'status': 'trial' if demo_mode else 'active',
            }
        )
        return company

    def create_admin(self, company):
        """Crea admin demo."""
        user, created = User.objects.get_or_create(
            email='admin@demoazienda.it',
            defaults={
                'first_name': 'Mario',
                'last_name': 'Rossi',
                'role': 'company_admin',
                'is_active': True,
            }
        )
        if created:
            user.set_password('Demo123!')
            user.save()
            user.company = company
            user.save()

        # Crea onboarding progress
        OnboardingProgress.objects.get_or_create(
            user=user,
            role='company',
            defaults={'company': company, 'is_completed': True}
        )

        return user

    def create_department(self, company):
        """Crea dipartimento."""
        dept, _ = Department.objects.get_or_create(
            company=company,
            name='Amministrazione',
            defaults={'code': 'amministrazione'}
        )
        return dept

    def create_location(self, company):
        """Crea sede."""
        location, _ = OfficeLocation.objects.get_or_create(
            company=company,
            name='Sede Principale',
            defaults={
                'address_line_1': 'Via Roma 100',
                'city': 'Roma',
                'postal_code': '00100',
            }
        )
        return location

    def create_employees(self, company, dept, location, admin, count=5):
        """Crea dipendenti demo."""
        employees = []
        names = [
            ('Luigi', 'Bianchi'),
            ('Anna', 'Verdi'),
            ('Marco', 'Neri'),
            ('Giulia', 'Gialli'),
            ('Paolo', 'Rossi'),
        ]

        for i, (first, last) in enumerate(names[:count]):
            email = f'{first.lower()}.{last.lower()}@demoazienda.it'

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'role': 'employee',
                    'is_active': True,
                }
            )

            if created:
                user.set_password('Demo123!')
                user.save()
                user.company = company
                user.save()

            # Crea profile
            profile, _ = EmployeeProfile.objects.get_or_create(
                user=user,
                defaults={
                    'company': company,
                    'employee_code': f'EMP{i+1:03d}',
                    'first_name': first,
                    'last_name': last,
                    'department': dept,
                    'office_location': location,
                    'manager': None,
                }
            )

            employees.append(user)

        return employees

    def create_leave_types(self, company):
        """Crea tipi ferie (company-specific)."""
        types = [
            ('ferie', 'Ferie annuali', 'vacation', 20),
            ('permesso', 'Permesso retribuito', 'personal', 3),
            ('malattia', 'Malattia', 'sick', 0),
        ]

        created_types = []
        for code, name, leave_type, max_days in types:
            lt, _ = LeaveType.objects.get_or_create(
                company=company,
                code=code,
                defaults={
                    'name': name,
                    'leave_type': leave_type,
                    'max_days_per_year': max_days,
                    'requires_document': code == 'malattia',
                }
            )
            created_types.append(lt)

        return created_types

    def create_leave_balances(self, employees, leave_types):
        """Crea saldi ferie."""
        year = timezone.now().year
        for emp in employees:
            try:
                profile = emp.employee_profile
            except EmployeeProfile.DoesNotExist:
                continue

            for lt in leave_types:
                if lt.max_days_per_year > 0:
                    LeaveBalance.objects.get_or_create(
                        employee=profile,
                        leave_type=lt,
                        year=year,
                        defaults={
                            'entitled_days': lt.max_days_per_year,
                            'used_days': random.randint(0, min(5, lt.max_days_per_year)),
                        }
                    )

    def create_attendance(self, employees):
        """Crea timbrature demo."""
        today = timezone.now()

        for emp in employees:
            # Solo 80% dei dipendenti timbra
            if random.random() < 0.8:
                # Check-in tra le 8 e le 10
                hour = random.randint(8, 10)
                minute = random.randint(0, 59)

                entry = TimeEntry.objects.create(
                    user=emp,
                    company=emp.company,
                    timestamp=today.replace(hour=hour, minute=minute, second=0),
                    entry_type='check_in',
                )

                # 70% fa check-out
                if random.random() < 0.7:
                    out_hour = hour + random.randint(7, 10)
                    TimeEntry.objects.create(
                        user=emp,
                        company=emp.company,
                        timestamp=today.replace(hour=out_hour, minute=minute, second=0),
                        entry_type='check_out',
                    )

    def create_leave_requests(self, employees, leave_types):
        """Crea richieste ferie."""
        statuses = ['submitted', 'approved', 'rejected']
        ferie_type = next((lt for lt in leave_types if lt.code == 'ferie'), leave_types[0])

        for i, emp in enumerate(employees[:3]):
            if random.random() < 0.6:  # 60% fa richiesta
                try:
                    profile = emp.employee_profile
                except EmployeeProfile.DoesNotExist:
                    continue

                start = timezone.now().date() + timedelta(days=random.randint(7, 30))
                end = start + timedelta(days=random.randint(1, 5))
                total_days = (end - start).days + 1

                status = 'submitted' if i == 0 else random.choice(statuses)

                LeaveRequest.objects.create(
                    employee=profile,
                    leave_type=ferie_type,
                    start_date=start,
                    end_date=end,
                    total_days=total_days,
                    status=status,
                    company=emp.company,
                )

    def create_documents(self, company, employees):
        """Crea documenti demo."""
        categories = ['company_document', 'safety_document']

        for cat in categories:
            Document.objects.create(
                title=f'Documento {cat.replace("_", " ").title()} Demo',
                category=cat,
                company=company,
                uploaded_by=employees[0] if employees else None,
                visibility='company_and_consultant',
                status='active',
            )

    def create_notifications(self, admin, employees):
        """Crea notifiche demo."""
        # Notifica per admin
        Notification.objects.create(
            user=admin,
            title='Benvenuto in PulseHR Demo',
            message='Questa è una notifica di esempio. Puoi eliminarla quando vuoi.',
            notification_type='info',
            priority='low',
        )

        # Notifica per dipendenti
        for emp in employees[:2]:
            Notification.objects.create(
                user=emp,
                title='Nuovo documento da leggere',
                message='Leggi il documento Policy Aziendale per rimanere aggiornato.',
                notification_type='info',
                priority='medium',
                action_url='/company/documents',
            )
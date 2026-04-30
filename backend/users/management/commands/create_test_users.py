from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Company, CompanyRole

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates test users and company for PulseHR testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data...')

        # Create test company
        company, created = Company.objects.get_or_create(
            name='Demo Company',
            defaults={
                'slug': 'demo-company',
                'is_active': True,
                'registration_date': '2024-01-01',
                'subscription_tier': 'professional',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created company: {company.name}'))
        else:
            self.stdout.write(f'Company exists: {company.name}')

        # Create Super Admin
        super_admin, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'superadmin@pulsehr.local',
                'role': 'super_admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            super_admin.set_password('SuperAdmin123!')
            super_admin.save()
            self.stdout.write(self.style.SUCCESS('Created super_admin / SuperAdmin123!'))
        else:
            self.stdout.write('super_admin already exists')

        # Create Company Owner
        owner, created = User.objects.get_or_create(
            username='owner',
            defaults={
                'email': 'owner@democompany.local',
                'role': 'company_owner',
                'is_active': True,
            }
        )
        if created:
            owner.set_password('Owner123!')
            owner.save()
            # Assign to company
            owner.assigned_companies.add(company)
            self.stdout.write(self.style.SUCCESS('Created owner / Owner123!'))
        else:
            self.stdout.write('owner already exists')

        # Create Company Admin
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@democompany.local',
                'role': 'company_admin',
                'is_active': True,
            }
        )
        if created:
            admin.set_password('Admin123!')
            admin.save()
            admin.assigned_companies.add(company)
            self.stdout.write(self.style.SUCCESS('Created admin / Admin123!'))
        else:
            self.stdout.write('admin already exists')

        # Create HR Manager
        hr_manager, created = User.objects.get_or_create(
            username='hr_manager',
            defaults={
                'email': 'hr@democompany.local',
                'role': 'hr_manager',
                'is_active': True,
            }
        )
        if created:
            hr_manager.set_password('HRManager123!')
            hr_manager.save()
            hr_manager.assigned_companies.add(company)
            self.stdout.write(self.style.SUCCESS('Created hr_manager / HRManager123!'))
        else:
            self.stdout.write('hr_manager already exists')

        # Create Employee
        employee, created = User.objects.get_or_create(
            username='employee',
            defaults={
                'email': 'employee@democompany.local',
                'role': 'employee',
                'is_active': True,
            }
        )
        if created:
            employee.set_password('Employee123!')
            employee.save()
            employee.assigned_companies.add(company)
            self.stdout.write(self.style.SUCCESS('Created employee / Employee123!'))
        else:
            self.stdout.write('employee already exists')

        self.stdout.write(self.style.SUCCESS('\n=== Test Users Created ==='))
        self.stdout.write('| Username      | Password        | Role            |')
        self.stdout.write('|---------------|-----------------|-----------------|')
        self.stdout.write('| superadmin     | SuperAdmin123!  | Super Admin     |')
        self.stdout.write('| owner          | Owner123!       | Company Owner   |')
        self.stdout.write('| admin          | Admin123!       | Company Admin   |')
        self.stdout.write('| hr_manager     | HRManager123!   | HR Manager      |')
        self.stdout.write('| employee       | Employee123!    | Employee        |')
        self.stdout.write('| company: Demo Company (slug: demo-company)')
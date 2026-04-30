"""
API Dashboard Avanzata Consulente
KPI, alert smart, statistiche aziende clienti
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from datetime import timedelta
from .models import (
    Company, EmployeeProfile, PayrollRun, TimeEntry,
    LeaveRequest, Document, ConsultantCompanyLink, UserCompanyAccess,
    SafetyCourse, EmployeeTraining,
)


class ConsultantDashboardView(APIView):
    """Dashboard principale consulente"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_consultant:
            return Response({"detail": "Accesso riservato ai consulenti"}, status=403)

        # Aziende del consulente
        companies = self.get_consultant_companies(user)

        return Response({
            "overview": self.get_overview(companies),
            "urgency_alerts": self.get_urgency_alerts(companies),
            "recent_activity": self.get_recent_activity(companies),
            "upcoming_deadlines": self.get_upcoming_deadlines(companies),
            "performance_metrics": self.get_performance_metrics(companies),
        })

    def get_consultant_companies(self, user):
        """Ottieni aziende accessibili dal consulente"""
        access_links = UserCompanyAccess.objects.filter(
            user=user,
            is_active=True
        ).select_related('company')
        return [link.company for link in access_links]

    def get_overview(self, companies):
        """Panoramica rapida"""
        company_ids = [c.id for c in companies]

        total_employees = EmployeeProfile.objects.filter(
            company_id__in=company_ids
        ).exclude(status='suspended').count()

        pending_payroll = PayrollRun.objects.filter(
            company_id__in=company_ids,
            status__in=['draft', 'in_progress']
        ).count()

        pending_leaves = LeaveRequest.objects.filter(
            company_id__in=company_ids,
            status='pending'
        ).count()

        # Documenti in attesa di revisione (status draft)
        pending_documents = Document.objects.filter(
            company_id__in=company_ids,
            status='draft'
        ).count()

        return {
            "companies_count": len(companies),
            "total_employees": total_employees,
            "pending_payroll": pending_payroll,
            "pending_leaves": pending_leaves,
            "pending_documents": pending_documents,
        }

    def get_urgency_alerts(self, companies):
        """Alert con priorita"""
        alerts = []
        now = timezone.now()
        company_ids = [c.id for c in companies]

        # Aziende senza payroll da > 2 mesi
        for company in companies:
            last_payroll = PayrollRun.objects.filter(
                company=company,
                status='approved_by_company'
            ).order_by('-year', '-month').first()

            if last_payroll:
                months_ago = (now.year - last_payroll.year) * 12 + (now.month - last_payroll.month)
                if months_ago >= 2:
                    alerts.append({
                        "type": "critical",
                        "priority": 1,
                        "company_id": str(company.id),
                        "company_name": company.name,
                        "title": "Payroll in ritardo",
                        "message": f"Ultimo payroll approvato: {last_payroll.month}/{last_payroll.year}",
                        "action_url": f"/consultant/companies/{company.id}/payroll/"
                    })

        # Dipendenti senza formazione sicurezza in scadenza
        expiring_training = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids,
            status='pending',
            due_date__lte=now.date() + timedelta(days=30)
        ).select_related('employee', 'course')[:10]

        for training in expiring_training:
            days_left = (training.due_date - now.date()).days
            alerts.append({
                "type": "warning" if days_left > 7 else "critical",
                "priority": 2 if days_left > 7 else 1,
                "company_id": str(training.employee.company.id),
                "company_name": training.employee.company.name,
                "title": "Corso in scadenza",
                "message": f"{training.employee.full_name}: {training.course.title} (scade tra {days_left} gg)",
                "action_url": f"/consultant/companies/{training.employee.company.id}/safety/"
            })

        # Ordina per priorita
        alerts.sort(key=lambda x: x['priority'])
        return alerts[:20]

    def get_recent_activity(self, companies):
        """Attivita recente"""
        company_ids = [c.id for c in companies]
        since = timezone.now() - timedelta(days=7)

        activities = []

        # Payroll recenti
        for payroll in PayrollRun.objects.filter(
            company_id__in=company_ids,
            updated_at__gte=since
        ).select_related('employee', 'company').order_by('-updated_at')[:5]:
            activities.append({
                "type": "payroll",
                "company_id": str(payroll.company.id),
                "company_name": payroll.company.name,
                "description": f"Payroll {payroll.month}/{payroll.year} - {payroll.status}",
                "timestamp": payroll.updated_at.isoformat(),
            })

        # Richieste ferie recenti
        for leave in LeaveRequest.objects.filter(
            company_id__in=company_ids,
            updated_at__gte=since
        ).select_related('employee', 'company').order_by('-updated_at')[:5]:
            activities.append({
                "type": "leave",
                "company_id": str(leave.company.id),
                "company_name": leave.company.name,
                "description": f"Richiesta ferie: {leave.employee.full_name} ({leave.status})",
                "timestamp": leave.updated_at.isoformat(),
            })

        return sorted(activities, key=lambda x: x['timestamp'], reverse=True)[:10]

    def get_upcoming_deadlines(self, companies):
        """Scadenze imminenti"""
        deadlines = []
        now = timezone.now()
        company_ids = [c.id for c in companies]

        # Scadenze corsi sicurezza (prossimi 30 gg)
        for training in EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids,
            due_date__gte=now.date(),
            due_date__lte=now.date() + timedelta(days=30)
        ).select_related('employee', 'course'):
            deadlines.append({
                "type": "training",
                "due_date": training.due_date.isoformat(),
                "company_name": training.employee.company.name,
                "employee_name": training.employee.full_name,
                "description": training.course.title,
            })

        return sorted(deadlines, key=lambda x: x['due_date'])[:10]

    def get_performance_metrics(self, companies):
        """Metriche performance aziende"""
        company_ids = [c.id for c in companies]

        # Media ore lavorate per azienda
        this_month = timezone.now()
        entries = TimeEntry.objects.filter(
            company_id__in=company_ids,
            timestamp__month=this_month.month,
            timestamp__year=this_month.year
        )

        total_hours = entries.filter(entry_type='check_in').count() * 8  # Stima

        # Compliance sicurezza
        total_required = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids
        ).count()
        completed = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids,
            status='completed'
        ).count()

        compliance_rate = (completed / total_required * 100) if total_required > 0 else 100

        return {
            "estimated_hours_this_month": total_hours,
            "safety_compliance_rate": round(compliance_rate, 1),
            "avg_employees_per_company": round(
                EmployeeProfile.objects.filter(company_id__in=company_ids).count() / len(companies)
                if companies else 0, 1
            ),
        }


class ConsultantCompanyDetailView(APIView):
    """Dettaglio azienda specifica"""
    permission_classes = [IsAuthenticated]

    def get(self, request, company_id):
        user = request.user

        # Verifica accesso
        has_access = UserCompanyAccess.objects.filter(
            user=user,
            company_id=company_id,
            is_active=True
        ).exists()

        if not has_access and not user.is_platform_admin:
            return Response({"detail": "Accesso negato"}, status=403)

        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response({"detail": "Azienda non trovata"}, status=404)

        # Statistiche complete
        employees = EmployeeProfile.objects.filter(company=company).exclude(status='suspended')

        # Payroll
        payroll_stats = PayrollRun.objects.filter(company=company).aggregate(
            total=Count('id'),
            draft=Count('id', filter=Q(status='draft')),
            approved=Count('id', filter=Q(status='approved_by_company')),
        )

        # Ferie
        leave_stats = LeaveRequest.objects.filter(company=company).aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            approved=Count('id', filter=Q(status='approved')),
        )

        # Sicurezza
        training_stats = EmployeeTraining.objects.filter(
            employee__company=company
        ).aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            pending=Count('id', filter=Q(status='pending')),
            expired=Count('id', filter=Q(status='expired')),
        )

        return Response({
            "company": {
                "id": str(company.id),
                "name": company.name,
                "status": company.status,
                "plan": company.plan,
                "employee_count": employees.count(),
            },
            "payroll": payroll_stats,
            "leaves": leave_stats,
            "safety": training_stats,
            "compliance_rate": self.calculate_compliance_rate(company),
        })

    def calculate_compliance_rate(self, company):
        """Calcola indice compliance sicurezza"""
        total = EmployeeTraining.objects.filter(employee__company=company).count()
        if total == 0:
            return 100

        completed = EmployeeTraining.objects.filter(
            employee__company=company,
            status='completed'
        ).exclude(
            expiry_date__lt=timezone.now()
        ).count()

        return round((completed / total) * 100, 1)


class ConsultantPayrollOverviewView(APIView):
    """Panoramica payroll per tutte le aziende"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        company_ids = UserCompanyAccess.objects.filter(
            user=user, is_active=True
        ).values_list('company_id', flat=True)

        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))

        payrolls = PayrollRun.objects.filter(
            company_id__in=company_ids,
            month=month,
            year=year
        ).select_related('company', 'employee')

        by_company = {}
        for payroll in payrolls:
            cid = str(payroll.company.id)
            if cid not in by_company:
                by_company[cid] = {
                    "company_name": payroll.company.name,
                    "status": payroll.status,
                    "count": 0
                }
            by_company[cid]["count"] += 1

        return Response({
            "month": month,
            "year": year,
            "by_company": list(by_company.values()),
            "total": payrolls.count(),
        })


class ConsultantCompaniesListView(APIView):
    """Lista aziende del consulente con statistiche"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_consultant:
            return Response({"detail": "Accesso riservato ai consulenti"}, status=403)

        companies = UserCompanyAccess.objects.filter(
            user=user,
            is_active=True
        ).select_related('company')

        result = []
        for access in companies:
            company = access.company
            employee_count = EmployeeProfile.objects.filter(
                company=company
            ).exclude(status='suspended').count()

            pending_payroll = PayrollRun.objects.filter(
                company=company,
                status__in=['draft', 'in_progress']
            ).count()

            pending_leaves = LeaveRequest.objects.filter(
                company=company,
                status='pending'
            ).count()

            # Calcola compliance sicurezza
            total_training = EmployeeTraining.objects.filter(
                employee__company=company
            ).count()
            completed_training = EmployeeTraining.objects.filter(
                employee__company=company,
                status='completed'
            ).count()
            compliance = round((completed_training / total_training * 100), 1) if total_training > 0 else 100

            result.append({
                "company_id": str(company.id),
                "company_name": company.name,
                "company_status": company.status,
                "access_scope": access.access_scope,
                "employee_count": employee_count,
                "pending_payroll": pending_payroll,
                "pending_leaves": pending_leaves,
                "safety_compliance": compliance,
            })

        return Response({
            "companies": result,
            "total_companies": len(result),
        })


class ConsultantCompanyEmployeesView(APIView):
    """Lista dipendenti di un'azienda specifica"""
    permission_classes = [IsAuthenticated]

    def get(self, request, company_id):
        user = request.user

        # Verifica accesso
        has_access = UserCompanyAccess.objects.filter(
            user=user,
            company_id=company_id,
            is_active=True
        ).exists()

        if not has_access and not user.is_platform_admin:
            return Response({"detail": "Accesso negato"}, status=403)

        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response({"detail": "Azienda non trovata"}, status=404)

        employees = EmployeeProfile.objects.filter(
            company=company
        ).exclude(status='suspended').select_related('department', 'office_location')

        result = []
        for emp in employees:
            # Calcola statistiche formazione
            trainings = EmployeeTraining.objects.filter(employee=emp)
            total_trainings = trainings.count()
            completed_trainings = trainings.filter(status='completed').count()
            pending_trainings = trainings.filter(status='pending').count()

            result.append({
                "employee_id": str(emp.id),
                "employee_code": emp.employee_code,
                "full_name": emp.full_name,
                "email": emp.email,
                "job_title": emp.job_title,
                "department": emp.department.name if emp.department else None,
                "hire_date": emp.hire_date.isoformat() if emp.hire_date else None,
                "trainings": {
                    "total": total_trainings,
                    "completed": completed_trainings,
                    "pending": pending_trainings,
                }
            })

        return Response({
            "company": {
                "id": str(company.id),
                "name": company.name,
            },
            "employees": result,
            "total_employees": len(result),
        })


class ConsultantSafetyOverviewView(APIView):
    """Panoramica sicurezza per tutte le aziende del consulente"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_consultant:
            return Response({"detail": "Accesso riservato ai consulenti"}, status=403)

        company_ids = UserCompanyAccess.objects.filter(
            user=user,
            is_active=True
        ).values_list('company_id', flat=True)

        # Statistiche globali
        total_trainings = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids
        ).count()
        completed_trainings = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids,
            status='completed'
        ).count()
        pending_trainings = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids,
            status='pending'
        ).count()
        expired_trainings = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids,
            status='expired'
        ).count()

        # Corsi in scadenza nei prossimi 30 gg
        now = timezone.now()
        expiring_soon = EmployeeTraining.objects.filter(
            employee__company_id__in=company_ids,
            status='pending',
            due_date__gte=now.date(),
            due_date__lte=now.date() + timedelta(days=30)
        ).select_related('employee', 'employee__company', 'course')

        expiring_list = []
        for training in expiring_soon:
            expiring_list.append({
                "company_name": training.employee.company.name,
                "employee_name": training.employee.full_name,
                "course_title": training.course.title,
                "due_date": training.due_date.isoformat(),
                "days_left": (training.due_date - now.date()).days,
            })

        return Response({
            "summary": {
                "total_assignments": total_trainings,
                "completed": completed_trainings,
                "pending": pending_trainings,
                "expired": expired_trainings,
                "compliance_rate": round((completed_trainings / total_trainings * 100), 1) if total_trainings > 0 else 100,
            },
            "expiring_soon": sorted(expiring_list, key=lambda x: x['days_left'])[:15],
        })

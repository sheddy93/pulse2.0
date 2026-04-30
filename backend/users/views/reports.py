"""
API Views per generazione report PDF e Excel - PulseHR
"""
from datetime import datetime, timedelta
from typing import Optional

from django.db.models import Count, Sum, Avg, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import (
    Company, EmployeeProfile, PayrollRun, TimeEntry,
    LeaveRequest, LeaveBalance, LeaveType, User
)
from users.permissions import IsSuperAdmin, IsCompanyOperator
from users.report_generators import (
    ReportGenerator, AttendanceReportGenerator,
    PayrollReportGenerator, LeaveReportGenerator,
    CompaniesReportGenerator
)


class ReportAPIView(APIView):
    """API base per generazione report"""
    permission_classes = [IsAuthenticated]

    def get_company(self, request) -> Optional[Company]:
        """Ottiene l'azienda associata all'utente"""
        if request.user.is_platform_admin:
            return None
        return request.user.company

    def get_month_year(self, request):
        """Estrae month e year dai query params"""
        now = timezone.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        return month, year

    def build_response(self, content: bytes, filename: str, format: str) -> HttpResponse:
        """Costruisce response HTTP per download file"""
        if format == 'pdf':
            response = HttpResponse(content, content_type='application/pdf')
        else:
            response = HttpResponse(content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


# ============================================================
# REPORT ATTENDANCE
# ============================================================

class AttendanceReportView(ReportAPIView):
    """Report presenze mensile"""

    def get(self, request):
        company = self.get_company(request)
        month, year = self.get_month_year(request)
        output_format = request.query_params.get('format', 'excel')

        # Recupera dati presenze
        entries = TimeEntry.objects.filter(
            company=company,
            timestamp__month=month,
            timestamp__year=year
        ).select_related('user', 'employee_profile').order_by('timestamp')

        # Costruisci dati tabella
        headers = ['Dipendente', 'Data', 'Check-in', 'Check-out', 'Tipo', 'Stato']
        rows = []

        # Process entries per costruire righe complete
        entry_dict = {}
        for entry in entries:
            emp_name = entry.employee_profile.full_name if entry.employee_profile else entry.user.email
            date_key = entry.timestamp.date()

            if date_key not in entry_dict:
                entry_dict[date_key] = {'employee': emp_name, 'check_in': None, 'check_out': None, 'break_start': None, 'break_end': None}

            if entry.entry_type == 'check_in':
                entry_dict[date_key]['check_in'] = entry.timestamp.strftime('%H:%M')
            elif entry.entry_type == 'check_out':
                entry_dict[date_key]['check_out'] = entry.timestamp.strftime('%H:%M')
            elif entry.entry_type == 'break_start':
                entry_dict[date_key]['break_start'] = entry.timestamp.strftime('%H:%M')
            elif entry.entry_type == 'break_end':
                entry_dict[date_key]['break_end'] = entry.timestamp.strftime('%H:%M')

        # Calcola ore lavorate
        for date_key, data in sorted(entry_dict.items()):
            if data['check_in'] and data['check_out']:
                try:
                    check_in_dt = datetime.strptime(f"{date_key} {data['check_in']}", '%Y-%m-%d %H:%M')
                    check_out_dt = datetime.strptime(f"{date_key} {data['check_out']}", '%Y-%m-%d %H:%M')
                    hours = (check_out_dt - check_in_dt).seconds / 3600
                    hours_str = f"{hours:.1f}"
                except:
                    hours_str = '-'

                status_val = 'OK' if float(hours_str.replace(',', '.'), 0) >= 7.5 else 'Incompleto'
            else:
                hours_str = '-'
                status_val = 'Incompleto'

            # Determina tipo giornata
            if data['break_start']:
                day_type = 'Interrotta'
            else:
                day_type = 'Continua'

            rows.append([
                data['employee'],
                date_key.strftime('%d/%m/%Y'),
                data['check_in'] or '-',
                data['check_out'] or '-',
                day_type,
                status_val
            ])

        # Summary
        summary = {
            'total_checkins': entries.filter(entry_type='check_in').count(),
            'total_checkouts': entries.filter(entry_type='check_out').count(),
            'total_breaks': entries.filter(entry_type='break_start').count(),
            'total_complete': sum(1 for r in rows if r[5] == 'OK')
        }

        data = {
            'headers': headers,
            'rows': rows,
            'summary': summary
        }

        # Genera file
        generator = AttendanceReportGenerator()
        filename = f'Report_Presenze_{month:02d}_{year}'

        if output_format == 'pdf':
            content = generator.generate_pdf(
                data,
                'Report Presenze Mensile',
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
        else:
            content = generator.generate_excel(
                data,
                filename,
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
            filename += '.xlsx'

        if output_format == 'pdf':
            filename += '.pdf'

        return self.build_response(content, filename, output_format)


class AttendanceSummaryReportView(ReportAPIView):
    """Report riepilogo presenze con statistiche mensili"""

    def get(self, request):
        company = self.get_company(request)
        month, year = self.get_month_year(request)
        output_format = request.query_params.get('format', 'excel')

        # Statistiche aggregati
        entries = TimeEntry.objects.filter(
            company=company,
            timestamp__month=month,
            timestamp__year=year
        )

        # Dipendenti con almeno un check-in nel mese
        active_employees = entries.values('employee_profile__full_name').distinct().count()

        # Media ore lavorate
        total_hours = entries.filter(entry_type='check_out').count() * 8  # Stima

        headers = ['Metrica', 'Valore']
        rows = [
            ['Dipendenti attivi nel mese', active_employees],
            ['Totale check-in', entries.filter(entry_type='check_in').count()],
            ['Totale check-out', entries.filter(entry_type='check_out').count()],
            ['Pause effettuate', entries.filter(entry_type='break_start').count()],
            ['Giornate stimate', entries.filter(entry_type='check_in').count()],
        ]

        data = {
            'headers': headers,
            'rows': rows
        }

        generator = ReportGenerator()

        if output_format == 'pdf':
            content = generator.generate_pdf(
                data,
                'Riepilogo Presenze',
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Riepilogo_Presenze_{month:02d}_{year}.pdf'
        else:
            content = generator.generate_excel(
                data,
                f'Report_Presenze_{month:02d}_{year}',
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Riepilogo_Presenze_{month:02d}_{year}.xlsx'

        return self.build_response(content, filename, output_format)


# ============================================================
# REPORT PAYROLL
# ============================================================

class PayrollReportView(ReportAPIView):
    """Report payroll mensile"""

    def get(self, request):
        company = self.get_company(request)
        month, year = self.get_month_year(request)
        output_format = request.query_params.get('format', 'excel')

        runs = PayrollRun.objects.filter(
            company=company,
            month=month,
            year=year
        ).select_related('employee').order_by('employee__full_name')

        headers = ['Dipendente', 'Codice', 'Stato', 'Creato il', 'Note']
        rows = []

        for run in runs:
            status_display = {
                'draft': 'Bozza',
                'waiting_documents': 'In attesa documenti',
                'in_progress': 'In corso',
                'ready_for_review': 'Pronto per revisione',
                'approved_by_company': 'Approvato',
                'delivered_to_employee': 'Consegnato',
                'correction_requested': 'Correzione richiesta',
                'archived': 'Archiviato'
            }.get(run.status, run.status)

            rows.append([
                run.employee.full_name if run.employee else '-',
                run.employee.employee_code if run.employee else '-',
                status_display,
                run.created_at.strftime('%d/%m/%Y'),
                run.notes_company[:50] if run.notes_company else ''
            ])

        # Summary
        summary = {
            'total_employees': runs.count(),
            'in_review': runs.filter(status='ready_for_review').count(),
            'approved': runs.filter(status='approved_by_company').count(),
            'archived': runs.filter(status='archived').count()
        }

        data = {
            'headers': headers,
            'rows': rows,
            'summary': summary
        }

        generator = PayrollReportGenerator()

        if output_format == 'pdf':
            content = generator.generate_pdf(
                data,
                'Report Payroll Mensile',
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Report_Payroll_{month:02d}_{year}.pdf'
        else:
            content = generator.generate_excel(
                data,
                f'Report_Payroll_{month:02d}_{year}',
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Report_Payroll_{month:02d}_{year}.xlsx'

        return self.build_response(content, filename, output_format)


# ============================================================
# REPORT COMPANIES (super_admin)
# ============================================================

class CompaniesReportView(ReportAPIView):
    """Report tutte le aziende - Solo super_admin"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))
        output_format = request.query_params.get('format', 'excel')

        companies = Company.objects.annotate(
            employee_count=Count('employee_profiles', filter=Q(employee_profiles__status='active')),
            user_count=Count('users', filter=Q(users__is_active=True))
        ).order_by('-created_at')

        headers = ['Azienda', 'Status', 'Piano', 'Dipendenti', 'Utenti', 'Creato il']
        rows = []

        for c in companies:
            status_display = {
                'active': 'Attiva',
                'suspended': 'Sospesa',
                'inactive': 'Inattiva',
                'trial': 'Trial',
                'cancelled': 'Cancellata'
            }.get(c.status, c.status)

            rows.append([
                c.name,
                status_display,
                c.plan or 'Trial',
                c.employee_count,
                c.user_count,
                c.created_at.strftime('%d/%m/%Y')
            ])

        # Summary
        summary = {
            'total': companies.count(),
            'active': companies.filter(status='active').count(),
            'trial': companies.filter(status='trial').count(),
            'suspended': companies.filter(status='suspended').count()
        }

        data = {
            'headers': headers,
            'rows': rows,
            'summary': summary
        }

        generator = CompaniesReportGenerator()

        if output_format == 'pdf':
            content = generator.generate_pdf(
                data,
                'Report Aziende',
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Report_Aziende_{month:02d}_{year}.pdf'
        else:
            content = generator.generate_excel(
                data,
                f'Report_Aziende_{month:02d}_{year}',
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Report_Aziende_{month:02d}_{year}.xlsx'

        return self.build_response(content, filename, output_format)


# ============================================================
# REPORT LEAVES
# ============================================================

class LeavesReportView(ReportAPIView):
    """Report ferie/permessi"""

    def get(self, request):
        company = self.get_company(request)
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))
        output_format = request.query_params.get('format', 'excel')

        # Recupera richieste ferie
        requests_qs = LeaveRequest.objects.filter(
            company=company,
            start_date__year=year,
            start_date__month=month
        ).select_related('employee', 'leave_type').order_by('start_date')

        headers = ['Dipendente', 'Tipo', 'Dal', 'Al', 'Giorni', 'Stato']
        rows = []

        by_type = {}

        for req in requests_qs:
            leave_type_name = req.leave_type.name if req.leave_type else 'Altro'

            status_display = {
                'pending': 'In attesa',
                'approved': 'Approvato',
                'rejected': 'Rifiutato',
                'cancelled': 'Annullato'
            }.get(req.status, req.status)

            rows.append([
                req.employee.full_name if req.employee else '-',
                leave_type_name,
                req.start_date.strftime('%d/%m/%Y'),
                req.end_date.strftime('%d/%m/%Y'),
                float(req.total_days),
                status_display
            ])

            # Aggrega per tipo
            if leave_type_name not in by_type:
                by_type[leave_type_name] = {'pending': 0, 'approved': 0, 'rejected': 0, 'total': 0}
            by_type[leave_type_name][req.status] = by_type[leave_type_name].get(req.status, 0) + 1
            by_type[leave_type_name]['total'] += 1

        data = {
            'headers': headers,
            'rows': rows,
            'by_type': by_type
        }

        generator = LeaveReportGenerator()

        if output_format == 'pdf':
            content = generator.generate_pdf(
                data,
                'Report Ferie e Permessi',
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Report_Ferie_{month:02d}_{year}.pdf'
        else:
            content = generator.generate_excel(
                data,
                f'Report_Ferie_{month:02d}_{year}',
                company_name=company.name if company else None,
                date_range=f"{month:02d}/{year}"
            )
            filename = f'Report_Ferie_{month:02d}_{year}.xlsx'

        return self.build_response(content, filename, output_format)


class LeaveBalancesReportView(ReportAPIView):
    """Report saldi ferie per tutti i dipendenti"""

    def get(self, request):
        company = self.get_company(request)
        year = int(request.query_params.get('year', timezone.now().year))
        output_format = request.query_params.get('format', 'excel')

        balances = LeaveBalance.objects.filter(
            employee__company=company,
            year=year
        ).select_related('employee', 'leave_type').order_by('employee__full_name', 'leave_type__name')

        headers = ['Dipendente', 'Tipo Ferie', 'Accantonati', 'Usati', 'In Attesa', 'Disponibili']
        rows = []

        for bal in balances:
            rows.append([
                bal.employee.full_name if bal.employee else '-',
                bal.leave_type.name if bal.leave_type else '-',
                float(bal.entitled_days),
                float(bal.used_days),
                float(bal.pending_days),
                float(bal.available_days)
            ])

        data = {
            'headers': headers,
            'rows': rows
        }

        generator = ReportGenerator()

        if output_format == 'pdf':
            content = generator.generate_pdf(
                data,
                'Report Saldi Ferie',
                company_name=company.name if company else None,
                date_range=f"Anno {year}"
            )
            filename = f'Report_Saldi_Ferie_{year}.pdf'
        else:
            content = generator.generate_excel(
                data,
                f'Report_Saldi_Ferie_{year}',
                company_name=company.name if company else None,
                date_range=f"Anno {year}"
            )
            filename = f'Report_Saldi_Ferie_{year}.xlsx'

        return self.build_response(content, filename, output_format)


# ============================================================
# REPORT EMPLOYEES
# ============================================================

class EmployeesReportView(ReportAPIView):
    """Report anagrafica dipendenti"""

    def get(self, request):
        company = self.get_company(request)
        output_format = request.query_params.get('format', 'excel')

        employees = EmployeeProfile.objects.filter(
            company=company
        ).select_related('department', 'office_location', 'manager').order_by('full_name')

        headers = ['Codice', 'Nome', 'Cognome', 'Email', 'Reparto', 'Sede', 'Manager', 'Ruolo', 'Stato']
        rows = []

        for emp in employees:
            rows.append([
                emp.employee_code,
                emp.first_name,
                emp.last_name,
                emp.email,
                emp.department.name if emp.department else '-',
                emp.office_location.name if emp.office_location else '-',
                emp.manager.full_name if emp.manager else '-',
                emp.job_title or '-',
                emp.status
            ])

        data = {
            'headers': headers,
            'rows': rows
        }

        generator = ReportGenerator()

        if output_format == 'pdf':
            content = generator.generate_pdf(
                data,
                'Report Anagrafica Dipendenti',
                company_name=company.name if company else None
            )
            filename = 'Report_Dipendenti.pdf'
        else:
            content = generator.generate_excel(
                data,
                'Report_Dipendenti',
                company_name=company.name if company else None
            )
            filename = 'Report_Dipendenti.xlsx'

        return self.build_response(content, filename, output_format)


# ============================================================
# DASHBOARD REPORTS (per frontend JSON)
# ============================================================

class ReportsDashboardView(ReportAPIView):
    """Endpoint JSON per dashboard frontend"""

    def get(self, request):
        report_type = request.query_params.get('type', 'attendance')
        company = self.get_company(request)

        if report_type == 'attendance':
            data = self._get_attendance_summary(company)
        elif report_type == 'payroll':
            data = self._get_payroll_summary(company)
        elif report_type == 'leaves':
            data = self._get_leaves_summary(company)
        elif report_type == 'employees':
            data = self._get_employees_summary(company)
        else:
            data = {'error': 'Tipo report non valido'}

        return Response(data)

    def _get_attendance_summary(self, company):
        today = timezone.now().date()
        month_start = today.replace(day=1)

        today_entries = TimeEntry.objects.filter(company=company, timestamp__date=today)
        month_entries = TimeEntry.objects.filter(
            company=company,
            timestamp__date__gte=month_start,
            timestamp__date__lte=today
        )

        return {
            'type': 'attendance',
            'today': {
                'checkins': today_entries.filter(entry_type='check_in').count(),
                'checkouts': today_entries.filter(entry_type='check_out').count(),
                'on_break': today_entries.filter(entry_type='break_start').count()
            },
            'month': {
                'total_entries': month_entries.count(),
                'checkins': month_entries.filter(entry_type='check_in').count(),
                'active_employees': month_entries.values('employee_profile').distinct().count()
            },
            'period': {
                'start': month_start.isoformat(),
                'end': today.isoformat()
            }
        }

    def _get_payroll_summary(self, company):
        now = timezone.now()

        runs = PayrollRun.objects.filter(company=company, year=now.year, month=now.month)

        status_counts = {}
        for status_choice in PayrollRun.StatusChoices:
            status_counts[status_choice[0]] = runs.filter(status=status_choice[0]).count()

        return {
            'type': 'payroll',
            'current_period': {
                'month': now.month,
                'year': now.year
            },
            'status_breakdown': status_counts,
            'total_runs': runs.count()
        }

    def _get_leaves_summary(self, company):
        now = timezone.now()
        year_start = now.replace(month=1, day=1)

        requests_qs = LeaveRequest.objects.filter(
            company=company,
            start_date__gte=year_start
        )

        type_counts = {}
        for req in requests_qs:
            type_name = req.leave_type.name if req.leave_type else 'Altro'
            if type_name not in type_counts:
                type_counts[type_name] = {'pending': 0, 'approved': 0, 'rejected': 0}
            type_counts[type_name][req.status] = type_counts[type_name].get(req.status, 0) + 1

        return {
            'type': 'leaves',
            'year': now.year,
            'by_type': type_counts,
            'total_requests': requests_qs.count(),
            'pending': requests_qs.filter(status='pending').count(),
            'approved': requests_qs.filter(status='approved').count()
        }

    def _get_employees_summary(self, company):
        employees = EmployeeProfile.objects.filter(company=company)

        return {
            'type': 'employees',
            'total': employees.count(),
            'by_status': {
                'active': employees.filter(status='active').count(),
                'suspended': employees.filter(status='suspended').count(),
                'inactive': employees.filter(status='inactive').count()
            },
            'by_department': list(
                employees.values('department__name')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            )
        }


class ReportsListView(ReportAPIView):
    """Lista report disponibili con metadata"""

    def get(self, request):
        company = self.get_company(request)

        reports = [
            {
                'id': 'attendance',
                'name': 'Report Presenze',
                'description': 'Report mensile delle presenze con check-in e check-out',
                'formats': ['excel', 'pdf'],
                'requires_params': ['month', 'year']
            },
            {
                'id': 'attendance_summary',
                'name': 'Riepilogo Presenze',
                'description': 'Statistiche riepilogative presenze mensili',
                'formats': ['excel', 'pdf'],
                'requires_params': ['month', 'year']
            },
            {
                'id': 'payroll',
                'name': 'Report Payroll',
                'description': 'Report mensile dei payroll runs',
                'formats': ['excel', 'pdf'],
                'requires_params': ['month', 'year']
            },
            {
                'id': 'leaves',
                'name': 'Report Ferie',
                'description': 'Reportmensile ferie e permessi',
                'formats': ['excel', 'pdf'],
                'requires_params': ['month', 'year']
            },
            {
                'id': 'leave_balances',
                'name': 'Report Saldi Ferie',
                'description': 'Saldi ferie per tutti i dipendenti',
                'formats': ['excel', 'pdf'],
                'requires_params': ['year']
            },
            {
                'id': 'employees',
                'name': 'Report Dipendenti',
                'description': 'Anagrafica completa dipendenti',
                'formats': ['excel', 'pdf'],
                'requires_params': []
            }
        ]

        # Aggiungi report aziende per super_admin
        if request.user.is_platform_admin:
            reports.append({
                'id': 'companies',
                'name': 'Report Aziende',
                'description': 'Report di tutte le aziende sulla piattaforma',
                'formats': ['excel', 'pdf'],
                'requires_params': ['month', 'year'],
                'admin_only': True
            })

        return Response({
            'reports': reports,
            'company': company.name if company else 'Platform'
        })

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta


def get_user_employee_profile(user):
    """Helper to get employee profile for a user."""
    from users.models import EmployeeProfile
    return EmployeeProfile.objects.filter(user=user).first()


class CompanyDashboardSummaryView(APIView):
    """Summary per dashboard azienda."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)
        
        now = timezone.now()
        today = now.date()
        
        from users.models import EmployeeProfile, TimeEntry, LeaveRequest, Document
        
        # Dipendenti attivi
        active_employees = EmployeeProfile.objects.filter(
            company=company, 
            user__is_active=True
        ).count()
        
        # Presenze oggi (utenti che hanno fatto check-in)
        checked_in_today = TimeEntry.objects.filter(
            company=company,
            timestamp__date=today,
            entry_type='check_in'
        ).values('user').distinct().count()
        
        # Richieste ferie pending
        pending_leaves = LeaveRequest.objects.filter(
            company=company,
            status__in=['submitted', 'pending']
        ).count()
        
        # Documenti non letti
        unread_documents = Document.objects.filter(
            company=company,
            acknowledged_at__isnull=True
        ).count()
        
        # Anomalie (dipendenti senza check-out oggi)
        # Conta dipendenti con check_in ma senza check_out oggi
        checked_in_users = TimeEntry.objects.filter(
            company=company,
            timestamp__date=today,
            entry_type='check_in'
        ).values_list('user_id', flat=True)
        
        checked_out_users = TimeEntry.objects.filter(
            company=company,
            timestamp__date=today,
            entry_type='check_out'
        ).values_list('user_id', flat=True)
        
        missing_checkout = len(set(checked_in_users)) - len(set(checked_out_users) & set(checked_in_users))
        
        return Response({
            'kpis': {
                'active_employees': active_employees,
                'checked_in_today': checked_in_today,
                'absent_today': active_employees - checked_in_today,
                'pending_leaves': pending_leaves,
                'unread_documents': unread_documents,
            },
            'alerts': {
                'missing_checkout': missing_checkout,
                'pending_approvals': pending_leaves,
            },
            'next_actions': [
                {'label': 'Approvazione ferie', 'count': pending_leaves, 'url': '/company/leave'},
                {'label': 'Documenti da leggere', 'count': unread_documents, 'url': '/company/documents'},
            ],
            'recent_activity': [],
        })


class ConsultantDashboardSummaryView(APIView):
    """Summary per dashboard consulente."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Aziende collegate
        from users.models import ConsultantCompanyLink, EmployeeProfile
        
        links = ConsultantCompanyLink.objects.filter(consultant=user)
        linked_companies = links.count()
        
        # Se non ci sono aziende collegate, ritorna risposta vuota (non 500)
        if linked_companies == 0:
            return Response({
                'kpis': {
                    'linked_companies': 0,
                    'total_employees': 0,
                    'pending_leaves': 0,
                    'anomalies_today': 0,
                },
                'alerts': {
                    'anomalies': 0,
                    'pending_leaves': 0,
                },
                'next_actions': [],
                'info': 'Nessuna azienda collegata',
            })
        
        # Totale dipendenti monitorati
        linked_company_ids = list(links.values_list('company_id', flat=True))
        
        total_employees = EmployeeProfile.objects.filter(
            company_id__in=linked_company_ids,
            user__is_active=True
        ).count()
        
        # Tasks pending (anomalie presenze, ferie pending)
        from users.models import TimeEntry, LeaveRequest
        
        now = timezone.now()
        today = now.date()
        
        # Anomalie: dipendenti con check_in ma senza check_out oggi nelle aziende collegate
        checked_in_users = TimeEntry.objects.filter(
            company_id__in=linked_company_ids,
            timestamp__date=today,
            entry_type='check_in'
        ).values_list('user_id', flat=True)
        
        checked_out_users = TimeEntry.objects.filter(
            company_id__in=linked_company_ids,
            timestamp__date=today,
            entry_type='check_out'
        ).values_list('user_id', flat=True)
        
        anomalies = len(set(checked_in_users)) - len(set(checked_out_users) & set(checked_in_users))
        
        pending_leaves = LeaveRequest.objects.filter(
            company_id__in=linked_company_ids,
            status__in=['submitted', 'pending']
        ).count()
        
        return Response({
            'kpis': {
                'linked_companies': linked_companies,
                'total_employees': total_employees,
                'pending_leaves': pending_leaves,
                'anomalies_today': anomalies,
            },
            'alerts': {
                'anomalies': anomalies,
                'pending_leaves': pending_leaves,
            },
            'next_actions': [
                {'label': 'Ferie da approvare', 'count': pending_leaves, 'url': '/consultant/leave'},
                {'label': 'Anomalie presenze', 'count': anomalies, 'url': '/consultant/attendance'},
            ],
        })


class EmployeeDashboardSummaryView(APIView):
    """Summary per dashboard dipendente."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        now = timezone.now()
        today = now.date()
        
        from users.models import TimeEntry, LeaveBalance, LeaveRequest, EmployeeProfile
        
        # Ottieni profile dipendente
        employee_profile = get_user_employee_profile(user)
        
        # Ultimo TimeEntry
        last_entry = TimeEntry.objects.filter(user=user).order_by('-timestamp').first()
        
        # TimeEntry oggi
        today_entry = TimeEntry.objects.filter(
            user=user,
            timestamp__date=today
        ).first()
        
        # Calcola stato attuale
        current_status = 'not_checked_in'
        last_check_in = None
        last_check_out = None
        
        if last_entry:
            # Cerca l'ultimo check_in senza check_out corrispondente
            last_check_in_entry = TimeEntry.objects.filter(
                user=user,
                entry_type='check_in'
            ).order_by('-timestamp').first()
            
            # Verifica se c'è un check_out dopo l'ultimo check_in
            if last_check_in_entry:
                last_check_in = last_check_in_entry.timestamp
                has_checkout_after = TimeEntry.objects.filter(
                    user=user,
                    entry_type='check_out',
                    timestamp__gt=last_check_in_entry.timestamp
                ).exists()
                
                if has_checkout_after:
                    current_status = 'checked_out'
                    last_check_out_entry = TimeEntry.objects.filter(
                        user=user,
                        entry_type='check_out',
                        timestamp__gt=last_check_in_entry.timestamp
                    ).order_by('timestamp').first()
                    if last_check_out_entry:
                        last_check_out = last_check_out_entry.timestamp
                else:
                    current_status = 'checked_in'
        
        # Ferie residue (usa employee FK, non user)
        leave_balances = []
        if employee_profile:
            balances = LeaveBalance.objects.filter(employee=employee_profile)
            for lb in balances:
                leave_balances.append({
                    'type': lb.leave_type.name if lb.leave_type else 'Unknown',
                    'total': float(lb.entitled_days + lb.carry_over_days),
                    'used': float(lb.used_days),
                    'remaining': float(lb.entitled_days + lb.carry_over_days - lb.used_days - lb.pending_days),
                })
        
        # Richieste ferie pending (usa employee FK)
        pending_requests = 0
        if employee_profile:
            pending_requests = LeaveRequest.objects.filter(
                employee=employee_profile,
                status__in=['submitted', 'pending']
            ).count()
        
        # Calcola ore oggi
        today_hours = 0
        if today_entry:
            # Cerca coppie check_in/check_out per calcolare ore
            check_ins = TimeEntry.objects.filter(
                user=user,
                timestamp__date=today,
                entry_type='check_in'
            ).order_by('timestamp')
            
            for check_in in check_ins:
                check_out = TimeEntry.objects.filter(
                    user=user,
                    timestamp__date=today,
                    entry_type='check_out',
                    timestamp__gt=check_in.timestamp
                ).order_by('timestamp').first()
                
                if check_out:
                    delta = check_out.timestamp - check_in.timestamp
                    today_hours += delta.total_seconds() / 3600
        
        return Response({
            'status': {
                'current': current_status,
                'last_check_in': last_check_in.isoformat() if last_check_in else None,
                'last_check_out': last_check_out.isoformat() if last_check_out else None,
            },
            'today_hours': round(today_hours, 2),
            'leave_balances': leave_balances,
            'pending_leave_requests': pending_requests,
            'next_actions': [
                {'label': 'Richiedi ferie', 'url': '/attendance/leave'},
                {'label': 'Vedi documenti', 'url': '/employee/documents'},
            ],
        })


class AdminDashboardSummaryView(APIView):
    """Summary per dashboard admin."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from users.models import Company, User
        from users.models.users import UserRoleChoices
        
        # Verifica ruolo admin
        if request.user.role not in {UserRoleChoices.SUPER_ADMIN, UserRoleChoices.PLATFORM_OWNER}:
            return Response({'error': 'Permission denied', 'detail': 'Admin access required'}, status=403)
        
        # Statistiche globali
        total_companies = Company.objects.count()
        active_companies = Company.objects.filter(is_active=True).count()
        total_users = User.objects.filter(is_active=True).count()
        
        return Response({
            'kpis': {
                'total_companies': total_companies,
                'active_companies': active_companies,
                'total_users': total_users,
            },
            'system_health': {
                'status': 'ok',
                'uptime': None,
                'uptime_label': 'Monitoraggio operativo',
            },
        })
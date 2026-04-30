"""
API Views per la gestione admin delle Aziende
Solo super_admin può accedere a questi endpoint.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from .models import Company, EmployeeProfile, User, AuditLog, PricingPlan
from .serializers import CompanySerializer, CompanySummarySerializer, AdminCompanySerializer, AdminCompanyListSerializer
from .permissions import IsSuperAdmin


class CompanyPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CompaniesAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la gestione admin delle aziende.
    Solo super_admin può accedere.
    """
    queryset = Company.objects.filter(is_deleted=False)
    serializer_class = AdminCompanyListSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    pagination_class = CompanyPagination
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdminCompanySerializer
        return AdminCompanyListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related()
        
        # Filtro per status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtro per piano
        plan_filter = self.request.query_params.get('plan')
        if plan_filter:
            queryset = queryset.filter(plan=plan_filter)
        
        # Filtro per data (created_after, created_before)
        created_after = self.request.query_params.get('created_after')
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)
        
        created_before = self.request.query_params.get('created_before')
        if created_before:
            queryset = queryset.filter(created_at__lte=created_before)
        
        # Search per nome o email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(contact_email__icontains=search) |
                Q(public_id__icontains=search)
            )
        
        # Ordinamento
        ordering = self.request.query_params.get('ordering', '-created_at')
        allowed_orderings = ['name', '-name', 'created_at', '-created_at', 'status', '-status', 'plan', '-plan']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/admin/companies/
        Lista tutte le aziende con filtri e statistiche
        """
        queryset = self.get_queryset()
        
        # Paginazione
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            return Response({
                'companies': paginated.data['results'],
                'pagination': {
                    'count': paginated.data['count'],
                    'next': paginated.data['next'],
                    'previous': paginated.data['previous'],
                    'total_pages': (paginated.data['count'] + self.pagination_class.page_size - 1) // self.pagination_class.page_size
                }
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'companies': serializer.data})
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/admin/companies/{id}/
        Dettaglio azienda con storico
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Aggiungi storico azioni recenti
        recent_logs = AuditLog.objects.filter(
            company=instance
        ).select_related('actor').order_by('-created_at')[:20]
        
        data['recent_history'] = [
            {
                'id': str(log.id),
                'action': log.action,
                'description': log.description,
                'actor_email': log.actor.email if log.actor else None,
                'metadata': log.metadata,
                'created_at': log.created_at.isoformat()
            }
            for log in recent_logs
        ]
        
        # Statistiche azienda
        data['stats'] = {
            'total_employees': EmployeeProfile.objects.filter(company=instance).count(),
            'active_employees': EmployeeProfile.objects.filter(company=instance, status='active').count(),
            'total_users': User.objects.filter(company=instance).count(),
            'active_users': User.objects.filter(company=instance, is_active=True).count(),
            'subscription_end_date': instance.subscription_end_date,
            'days_since_creation': (timezone.now() - instance.created_at).days
        }
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """
        POST /api/admin/companies/{id}/suspend/
        Sospendi azienda
        """
        company = self.get_object()
        reason = request.data.get('reason', 'Sospensione da admin')
        notify = request.data.get('notify', True)
        
        if company.status == Company.StatusChoices.SUSPENDED:
            return Response(
                {'error': 'L\'azienda è già sospesa.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = company.status
        company.status = Company.StatusChoices.SUSPENDED
        company.save()
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            company=company,
            action=AuditLog.ActionChoices.COMPANY_SUSPENDED,
            description=f'Azienda sospesa: {company.name}',
            metadata={
                'reason': reason,
                'old_status': old_status,
                'notified': notify
            }
        )
        
        # Invia email notifica se richiesto
        if notify:
            self._send_suspension_notification(company, reason)
        
        return Response({
            'id': str(company.id),
            'status': company.status,
            'message': f'Azienda "{company.name}" è stata sospesa.'
        })
    
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """
        POST /api/admin/companies/{id}/reactivate/
        Riattiva azienda sospesa
        """
        company = self.get_object()
        notify = request.data.get('notify', True)
        
        if company.status != Company.StatusChoices.SUSPENDED:
            return Response(
                {'error': 'L\'azienda non è sospesa.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = company.status
        # Ripristina lo stato precedente o imposta active
        company.status = Company.StatusChoices.ACTIVE
        company.save()
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            company=company,
            action=AuditLog.ActionChoices.COMPANY_REACTIVATED,
            description=f'Azienda riattivata: {company.name}',
            metadata={
                'old_status': old_status,
                'notified': notify
            }
        )
        
        # Invia email notifica se richiesto
        if notify:
            self._send_reactivation_notification(company)
        
        return Response({
            'id': str(company.id),
            'status': company.status,
            'message': f'Azienda "{company.name}" è stata riattivata.'
        })
    
    @action(detail=True, methods=['post'])
    def force_plan(self, request, pk=None):
        """
        POST /api/admin/companies/{id}/force-plan/
        Forza cambio piano (anche downgrade)
        """
        company = self.get_object()
        new_plan = request.data.get('plan')
        reason = request.data.get('reason', 'Cambio piano da admin')
        notify = request.data.get('notify', True)
        
        if not new_plan:
            return Response(
                {'error': 'Il campo "plan" è obbligatorio.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verifica che il piano esista
        try:
            plan = PricingPlan.objects.get(code=new_plan, is_active=True)
        except PricingPlan.DoesNotExist:
            return Response(
                {'error': f'Piano "{new_plan}" non trovato o non attivo.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_plan = company.plan
        company.plan = plan.code
        company.max_employees = plan.max_employees
        company.save()
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            company=company,
            action=AuditLog.ActionChoices.COMPANY_UPDATED,
            description=f'Piano azienda cambiato: {company.name}',
metadata={
                'old_plan': old_plan,
                'new_plan': new_plan,
                'new_plan_name': plan.name,
                'reason': reason,
                'notified': notify
            }
        )
        
        # Invia email notifica se richiesto
        if notify:
            self._send_plan_change_notification(company, old_plan, plan, reason)
        
        return Response({
            'id': str(company.id),
            'plan': company.plan,
            'max_employees': company.max_employees,
            'message': f'Piano dell\'azienda "{company.name}" cambiato in "{plan.name}".'
        })
    
    @action(detail=True, methods=['post'])
    def reset_trial(self, request, pk=None):
        """
        POST /api/admin/companies/{id}/reset-trial/
        Resetta trial per azienda
        """
        company = self.get_object()
        days = request.data.get('days', 14)
        notify = request.data.get('notify', True)
        
        if company.status not in [Company.StatusChoices.TRIAL, Company.StatusChoices.ACTIVE]:
            return Response(
                {'error': 'Impossibile resettare il trial per un\'azienda sospesa o cancellata.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcola nuova data di fine trial
        from datetime import timedelta
        new_trial_end = timezone.now().date() + timedelta(days=days)
        
        old_status = company.status
        old_trial_end = company.subscription_end_date
        
        company.status = Company.StatusChoices.TRIAL
        company.subscription_end_date = new_trial_end
        company.save()
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            company=company,
            action=AuditLog.ActionChoices.COMPANY_ACCESS_RESET,
            description=f'Trial resettato per: {company.name}',
            metadata={
                'old_status': old_status,
                'new_status': Company.StatusChoices.TRIAL,
                'old_trial_end': str(old_trial_end) if old_trial_end else None,
                'new_trial_end': str(new_trial_end),
                'days': days,
                'notified': notify
            }
        )
        
        # Invia email notifica se richiesto
        if notify:
            self._send_trial_reset_notification(company, days)
        
        return Response({
            'id': str(company.id),
            'status': company.status,
            'subscription_end_date': company.subscription_end_date,
            'message': f'Trial dell\'azienda "{company.name}" resettato per {days} giorni.'
        })
    
    def _send_suspension_notification(self, company, reason):
        """Invia email notifica di sospensione"""
        try:
            # Trova gli admin dell'azienda
            admin_users = User.objects.filter(
                company=company,
                role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN]
            )
            
            for user in admin_users:
                send_mail(
                    subject=f'Account sospeso - {company.name}',
                    message=f'''La tua azienda {company.name} è stata sospesa.

Motivo: {reason}

Per ulteriori informazioni contatta il supporto.''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True
                )
        except Exception:
            pass  # Non fallire l'operazione se l'email non va
    
    def _send_reactivation_notification(self, company):
        """Invia email notifica di riattivazione"""
        try:
            admin_users = User.objects.filter(
                company=company,
                role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN]
            )
            
            for user in admin_users:
                send_mail(
                    subject=f'Account riattivato - {company.name}',
                    message=f'''La tua azienda {company.name} è stata riattivata.

Ora puoi nuovamente accedere alla piattaforma.''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True
                )
        except Exception:
            pass
    
    def _send_plan_change_notification(self, company, old_plan, new_plan, reason):
        """Invia email notifica di cambio piano"""
        try:
            admin_users = User.objects.filter(
                company=company,
                role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN]
            )
            
            for user in admin_users:
                send_mail(
                    subject=f'Piano modificato - {company.name}',
                    message=f'''Il piano della tua azienda {company.name} è stato modificato.

Piano precedente: {old_plan}
Nuovo piano: {new_plan.name}

Motivo: {reason}

Per ulteriori informazioni contatta il supporto.''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True
                )
        except Exception:
            pass
    
    def _send_trial_reset_notification(self, company, days):
        """Invia email notifica di reset trial"""
        try:
            admin_users = User.objects.filter(
                company=company,
                role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN]
            )
            
            for user in admin_users:
                send_mail(
                    subject=f'Periodo trial esteso - {company.name}',
                    message=f'''Il periodo di trial per {company.name} è stato esteso.

Nuovo periodo di prova: {days} giorni dalla data odierna.

Per attivare il tuo account, visita la piattaforma.''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True
                )
        except Exception:
            pass
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/admin/companies/stats/
        Statistiche generali sulle aziende
        """
        total = Company.objects.filter(is_deleted=False).count()
        active = Company.objects.filter(is_deleted=False, status=Company.StatusChoices.ACTIVE).count()
        trial = Company.objects.filter(is_deleted=False, status=Company.StatusChoices.TRIAL).count()
        suspended = Company.objects.filter(is_deleted=False, status=Company.StatusChoices.SUSPENDED).count()
        inactive = Company.objects.filter(is_deleted=False, status=Company.StatusChoices.INACTIVE).count()
        
        # Statistiche per piano
        plans_stats = []
        for plan_code in Company.objects.filter(is_deleted=False).values_list('plan', flat=True).distinct():
            if plan_code:
                count = Company.objects.filter(is_deleted=False, plan=plan_code).count()
                employees = EmployeeProfile.objects.filter(
                    company__is_deleted=False,
                    company__plan=plan_code
                ).count()
                plans_stats.append({
                    'plan': plan_code,
                    'companies_count': count,
                    'employees_count': employees
                })
        
        # Ultime aziende registrate
        recent_companies = Company.objects.filter(
            is_deleted=False
        ).order_by('-created_at')[:5]
        
        return Response({
            'total': total,
            'active': active,
            'trial': trial,
            'suspended': suspended,
            'inactive': inactive,
            'plans_stats': plans_stats,
            'recent_companies': CompanySummarySerializer(recent_companies, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def list_plans(self, request):
        """
        GET /api/admin/companies/list-plans/
        Lista piani disponibili per force_plan
        """
        plans = PricingPlan.objects.filter(is_active=True).values('code', 'name', 'max_employees')
        return Response({'plans': list(plans)})

"""
API Views per la gestione admin dei Pricing Plans
Solo super_admin può accedere a questi endpoint.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from django.utils import timezone

from users.models import PricingPlan, Company, EmployeeProfile, AuditLog
from users.serializers import PricingPlanSerializer
from users.permissions import IsSuperAdmin


class PricingAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la gestione admin dei piani tariffari.
    Solo super_admin può accedere.
    """
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtra per piano attivo
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(is_active=True)
        
        # Filtra per tipo di piano
        plan_type = self.request.query_params.get('plan_type')
        if plan_type:
            queryset = queryset.filter(plan_type=plan_type)
        
        # Filtra per ciclo di fatturazione
        billing_cycle = self.request.query_params.get('billing_cycle')
        if billing_cycle:
            queryset = queryset.filter(billing_cycle=billing_cycle)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/admin/pricing/plans/
        Lista tutti i piani con statistiche (super_admin only)
        """
        queryset = self.get_queryset()
        
        # Aggiungi statistiche per ogni piano
        plans_data = []
        for plan in queryset:
            plan_dict = PricingPlanSerializer(plan).data
            
            # Conta aziende con questo piano
            companies_with_plan = Company.objects.filter(plan=plan.code, is_deleted=False)
            employee_count = companies_with_plan.count()
            
            # Conta total dipendenti nelle aziende con questo piano
            total_employees = EmployeeProfile.objects.filter(
                company__in=companies_with_plan
            ).count()
            
            plan_dict['employee_count'] = employee_count
            plan_dict['total_employees'] = total_employees
            plans_data.append(plan_dict)
        
        return Response({
            'plans': plans_data,
            'total': len(plans_data),
            'active_count': len([p for p in plans_data if p['is_active']]),
            'highlighted_count': len([p for p in plans_data if p['is_highlighted']])
        })
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/admin/pricing/plans/
        Crea nuovo piano
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Verifica che il codice sia unico
        code = serializer.validated_data.get('code')
        if PricingPlan.objects.filter(code=code).exists():
            return Response(
                {'error': f'Un piano con codice "{code}" esiste già.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        plan = serializer.save()
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ActionChoices.COMPANY_CREATED,
            description=f'Creato nuovo piano tariffario: {plan.name} ({plan.code})',
            metadata={
                'plan_id': str(plan.id),
                'plan_code': plan.code,
                'plan_type': plan.plan_type,
                'price_cents': plan.price_cents
            }
        )
        
        return Response(
            PricingPlanSerializer(plan).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """
        PUT /api/admin/pricing/plans/{id}/
        Aggiorna piano esistente
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Verifica che il codice sia unico (se modificato)
        new_code = serializer.validated_data.get('code')
        if new_code and new_code != instance.code:
            if PricingPlan.objects.filter(code=new_code).exclude(id=instance.id).exists():
                return Response(
                    {'error': f'Un piano con codice "{new_code}" esiste già.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        plan = serializer.save()
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ActionChoices.COMPANY_UPDATED,
            description=f'Aggiornato piano tariffario: {plan.name} ({plan.code})',
            metadata={
                'plan_id': str(plan.id),
                'plan_code': plan.code,
                'changes': request.data
            }
        )
        
        return Response(PricingPlanSerializer(plan).data)
    
    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/admin/pricing/plans/{id}/
        Aggiornamento parziale piano
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/admin/pricing/plans/{id}/
        Disattiva piano (soft delete - is_active=False)
        """
        instance = self.get_object()
        
        # Soft delete: disattiva il piano invece di eliminarlo
        instance.is_active = False
        instance.save()
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ActionChoices.COMPANY_DEACTIVATED,
            description=f'Disattivato piano tariffario: {instance.name} ({instance.code})',
            metadata={
                'plan_id': str(instance.id),
                'plan_code': instance.code
            }
        )
        
        return Response(
            {'message': f'Piano "{instance.name}" è stato disattivato.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        POST /api/admin/prricing/plans/{id}/duplicate/
        Duplica piano esistente
        """
        original = self.get_object()
        
        # Genera un nuovo codice unico
        base_code = f"{original.code}_copy"
        new_code = base_code
        counter = 1
        while PricingPlan.objects.filter(code=new_code).exists():
            new_code = f"{base_code}_{counter}"
            counter += 1
        
        # Crea la copia
        new_plan = PricingPlan.objects.create(
            name=f"{original.name} (Copia)",
            code=new_code,
            plan_type=original.plan_type,
            billing_cycle=original.billing_cycle,
            price_cents=original.price_cents,
            setup_fee_cents=original.setup_fee_cents,
            max_employees=original.max_employees,
            max_companies=original.max_companies,
            max_storage_mb=original.max_storage_mb,
            max_file_size_mb=original.max_file_size_mb,
            include_payroll=original.include_payroll,
            include_attendance=original.include_attendance,
            include_documents=original.include_documents,
            include_safety=original.include_safety,
            include_reports=original.include_reports,
            include_api_access=original.include_api_access,
            include_priority_support=original.include_priority_support,
            include_white_label=original.include_white_label,
            extra_employee_price_cents=original.extra_employee_price_cents,
            description=original.description,
            features_list=original.features_list,
            limitations=original.limitations,
            is_active=False,  # Duplicato disattivato di default
            is_highlighted=False,
            display_order=original.display_order + 1,
        )
        
        # Log dell'azione
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ActionChoices.COMPANY_CREATED,
            description=f'Duplicato piano tariffario: {original.name} -> {new_plan.name}',
            metadata={
                'original_plan_id': str(original.id),
                'new_plan_id': str(new_plan.id),
                'new_plan_code': new_plan.code
            }
        )
        
        return Response(
            PricingPlanSerializer(new_plan).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def toggle_highlight(self, request, pk=None):
        """
        POST /api/admin/pricing/plans/{id}/toggle-highlight/
        Attiva/disattiva "piano consigliato"
        """
        plan = self.get_object()
        old_state = plan.is_highlighted
        plan.is_highlighted = not plan.is_highlighted
        plan.save()
        
        # Log dell'azione
        action_type = 'highlighted' if plan.is_highlighted else 'unhighlighted'
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ActionChoices.COMPANY_UPDATED,
            description=f'Piano {action_type}: {plan.name}',
            metadata={
                'plan_id': str(plan.id),
                'plan_code': plan.code,
                'new_state': plan.is_highlighted
            }
        )
        
        return Response({
            'id': str(plan.id),
            'is_highlighted': plan.is_highlighted,
            'message': f'Piano impostato come {"consigliato" if plan.is_highlighted else "non consigliato"}'
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/admin/pricing/plans/stats/
        Statistiche generali sui piani
        """
        total_plans = PricingPlan.objects.count()
        active_plans = PricingPlan.objects.filter(is_active=True).count()
        highlighted_plans = PricingPlan.objects.filter(is_active=True, is_highlighted=True).count()
        
        # Statistiche per tipo di piano
        plan_types_stats = []
        for plan_type in PricingPlan.PlanType.values:
            type_plans = PricingPlan.objects.filter(plan_type=plan_type)
            active_type_plans = type_plans.filter(is_active=True)
            
            companies_count = Company.objects.filter(
                plan__in=type_plans.values_list('code', flat=True),
                is_deleted=False
            ).count()
            
            plan_types_stats.append({
                'plan_type': plan_type,
                'total_plans': type_plans.count(),
                'active_plans': active_type_plans.count(),
                'companies_count': companies_count
            })
        
        # Aziende per piano
        companies_by_plan = []
        for plan in PricingPlan.objects.filter(is_active=True):
            companies_count = Company.objects.filter(plan=plan.code, is_deleted=False).count()
            employees_count = EmployeeProfile.objects.filter(
                company__plan=plan.code,
                company__is_deleted=False
            ).count()
            
            companies_by_plan.append({
                'plan_id': str(plan.id),
                'plan_name': plan.name,
                'plan_code': plan.code,
                'companies_count': companies_count,
                'employees_count': employees_count
            })
        
        return Response({
            'total_plans': total_plans,
            'active_plans': active_plans,
            'highlighted_plans': highlighted_plans,
            'plan_types_stats': plan_types_stats,
            'companies_by_plan': companies_by_plan
        })

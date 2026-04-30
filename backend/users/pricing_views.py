"""
API Views per la gestione dei Pricing Plans
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import PricingPlan, PricingConfig, Company
from .serializers import PricingPlanSerializer, PricingConfigSerializer
from .pricing_utils import get_plan_limits, get_company_usage, get_trial_info, check_employee_limit


class PricingPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet per gestire i piani tariffari.
    Solo super_admin può modificare i piani.
    """
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Chiunque può vedere i piani (per la pagina pricing pubblica)
            return [AllowAny()]
        # Solo super_admin può modificare
        return [IsAuthenticated()]
    
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
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Endpoint pubblico per la pagina pricing"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def highlighted(self, request):
        """Piano consigliato"""
        queryset = self.get_queryset().filter(is_active=True, is_highlighted=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplica un piano esistente"""
        original = self.get_object()
        new_plan = PricingPlan.objects.create(
            name=f"{original.name} (Copia)",
            code=f"{original.code}_copy",
            plan_type=original.plan_type,
            billing_cycle=original.billing_cycle,
            price_cents=original.price_cents,
            setup_fee_cents=original.setup_fee_cents,
            max_employees=original.max_employees,
            max_companies=original.max_companies,
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
            is_active=False,
            is_highlighted=False,
        )
        serializer = self.get_serializer(new_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PricingConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la configurazione globale del pricing.
    """
    queryset = PricingConfig.objects.all()
    serializer_class = PricingConfigSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Ritorna l'unica istanza di configurazione (o la crea)
        obj, _ = PricingConfig.objects.get_or_create(pk=1)
        return obj
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Configurazione pubblica (senza dati sensibili)"""
        obj = self.get_object()
        return Response({
            'currency': obj.currency,
            'currency_symbol': obj.currency_symbol,
            'yearly_discount_percent': obj.yearly_discount_percent,
            'trial_days': obj.trial_days,
        })


@api_view(['GET'])
def company_limits(request):
    """
    Endpoint per ottenere i limiti e l'utilizzo dell'azienda corrente.
    Usato dal frontend per mostrare messaggi e bloccare azioni.
    """
    if not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    company = request.user.company
    
    if not company:
        return Response({
            'company': None,
            'limits': None,
            'usage': None,
            'trial': None,
        })
    
    # Ottieni usage completo
    usage = get_company_usage(company)
    
    # Informazioni trial
    trial = get_trial_info(company)
    
    # Limiti immediati
    can_add_employee, current_emp, max_emp, extra_cost = check_employee_limit(company)
    
    return Response({
        'company': {
            'id': str(company.id),
            'name': company.name,
            'status': company.status,
            'plan': company.plan,
            'billing_cycle': company.billing_cycle,
        },
        'limits': usage['limits'],
        'usage': {
            'employees': usage['usage']['employees'],
            'module_access': usage['usage']['module_access'],
            'storage': usage['usage']['storage'],
            'can_add_employee': can_add_employee,
            'employee_limit_info': {
                'current': current_emp,
                'max': max_emp,
                'percentage': (current_emp / max_emp * 100) if max_emp > 0 else 0,
                'extra_cost_per_employee': extra_cost,
            }
        },
        'trial': trial,
        'pricing': {
            'plan_name': company.plan or 'Starter',
            'billing_cycle': company.billing_cycle or 'monthly',
        }
    })

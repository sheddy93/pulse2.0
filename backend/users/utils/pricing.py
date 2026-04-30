"""
Utility per la gestione dei limiti e feature basate sul piano
"""
from django.conf import settings
from .models import PricingPlan, Company


def get_company_plan(company):
    """
    Ritorna il piano attivo dell'azienda.
    Se non ha un piano assegnato, ritorna il piano di default (trial).
    """
    if not company:
        return None
    
    if company.plan:
        try:
            return PricingPlan.objects.get(code=company.plan, is_active=True)
        except PricingPlan.DoesNotExist:
            pass
    
    # Piano di default per aziende senza piano specifico
    return None


def get_plan_limits(company):
    """
    Ritorna i limiti del piano per l'azienda.
    """
    plan = get_company_plan(company)
    
    if plan:
        return {
            'max_employees': plan.max_employees,
            'max_companies': plan.max_companies,
            'max_storage_mb': plan.max_storage_mb,
            'max_file_size_mb': plan.max_file_size_mb,
            'include_payroll': plan.include_payroll,
            'include_attendance': plan.include_attendance,
            'include_documents': plan.include_documents,
            'include_safety': plan.include_safety,
            'include_reports': plan.include_reports,
            'include_api_access': plan.include_api_access,
            'include_priority_support': plan.include_priority_support,
            'include_white_label': plan.include_white_label,
            'extra_employee_price': plan.extra_employee_price_eur,
        }
    
    # Limiti default per aziende senza piano
    return {
        'max_employees': 5,  # Starter default
        'max_companies': 1,
        'max_storage_mb': 1000,
        'max_file_size_mb': 50,
        'include_payroll': True,
        'include_attendance': True,
        'include_documents': True,
        'include_safety': False,
        'include_reports': False,
        'include_api_access': False,
        'include_priority_support': False,
        'include_white_label': False,
        'extra_employee_price': 1.00,
    }


def check_employee_limit(company):
    """
    Verifica se l'azienda può ancora aggiungere dipendenti.
    Ritorna (can_add, current, max, extra_cost)
    """
    limits = get_plan_limits(company)
    max_employees = limits['max_employees']
    
    if not company:
        return True, 0, max_employees, 0
    
    # Conta solo profili attivi (non sospesi)
    current_count = company.employee_profiles.exclude(status='suspended').count()
    
    if current_count >= max_employees:
        extra_cost = limits['extra_employee_price']
        return False, current_count, max_employees, extra_cost
    
    return True, current_count, max_employees, 0


def check_module_access(company, module):
    """
    Verifica se l'azienda ha accesso a un modulo specifico.
    
    Module options:
    - 'payroll'
    - 'attendance'
    - 'documents'
    - 'safety'
    - 'reports'
    - 'api_access'
    """
    limits = get_plan_limits(company)
    
    module_map = {
        'payroll': 'include_payroll',
        'attendance': 'include_attendance',
        'documents': 'include_documents',
        'safety': 'include_safety',
        'reports': 'include_reports',
        'api_access': 'include_api_access',
    }
    
    key = module_map.get(module)
    if not key:
        return False
    
    return limits.get(key, False)


def get_trial_info(company):
    """
    Ritorna informazioni sul trial dell'azienda.
    """
    from django.utils import timezone
    
    if not company:
        return {'is_trial': False, 'days_left': 0, 'is_expired': True}
    
    # Azienda attiva non è in trial
    if company.status == 'active':
        return {'is_trial': False, 'days_left': None, 'is_expired': False}
    
    # Se è trial
    if company.status == 'trial' and company.subscription_end_date:
        days_left = (company.subscription_end_date - timezone.now().date()).days
        return {
            'is_trial': True,
            'days_left': max(0, days_left),
            'is_expired': days_left <= 0,
            'end_date': company.subscription_end_date,
        }
    
    return {'is_trial': False, 'days_left': 0, 'is_expired': True}


def can_perform_action(company, action):
    """
    Verifica se l'azienda può eseguire una determinata azione.
    Ritorna (allowed, reason)
    """
    # Check trial status
    trial_info = get_trial_info(company)
    
    if trial_info['is_expired']:
        return False, "Il periodo di trial è scaduto. Aggiorna il piano per continuare."
    
    if action == 'add_employee':
        can_add, current, max_emp, extra = check_employee_limit(company)
        if not can_add:
            return False, f"Hai raggiunto il limite di {max_emp} dipendenti. Aggiorna il piano per aggiungerne altri."
        return True, None
    
    if action == 'access_module':
        # Richiede specifica del modulo
        return True, None
    
    if action == 'export_report':
        limits = get_plan_limits(company)
        if not limits['include_reports']:
            return False, "I report avanzati non sono inclusi nel tuo piano."
        return True, None
    
    if action == 'api_access':
        limits = get_plan_limits(company)
        if not limits['include_api_access']:
            return False, "L'accesso API non è incluso nel tuo piano."
        return True, None
    
    return True, None


def get_company_usage(company):
    """
    Ritorna un report completo dell'utilizzo dell'azienda.
    """
    if not company:
        return None
    
    limits = get_plan_limits(company)
    trial_info = get_trial_info(company)
    
    employee_count = company.employee_profiles.exclude(status='suspended').count()
    
    return {
        'company': {
            'id': str(company.id),
            'name': company.name,
            'status': company.status,
            'plan': company.plan,
        },
        'limits': limits,
        'trial': trial_info,
        'usage': {
            'employees': {
                'current': employee_count,
                'max': limits['max_employees'],
                'percentage': (employee_count / limits['max_employees'] * 100) if limits['max_employees'] > 0 else 0,
                'can_add': employee_count < limits['max_employees'],
            },
            'module_access': {
                'payroll': limits['include_payroll'],
                'attendance': limits['include_attendance'],
                'documents': limits['include_documents'],
                'safety': limits['include_safety'],
                'reports': limits['include_reports'],
                'api': limits['include_api_access'],
            },
            'storage': get_company_storage_usage(company),
        }
    }


def check_storage_limit(company, file_size_mb):
    """
    Verifica se l'azienda può ancora caricare un file delle dimensioni specificate.
    Ritorna (can_upload, current_mb, max_mb)
    
    Args:
        company: istanza Company
        file_size_mb: dimensione del file in MB
    """
    limits = get_plan_limits(company)
    max_storage = limits['max_storage_mb']
    max_file_size = limits['max_file_size_mb']
    
    if not company:
        return True, 0, max_storage
    
    # Verifica dimensione file singolo
    if file_size_mb > max_file_size:
        return False, float(company.current_storage_mb or 0), max_storage
    
    # Verifica spazio totale disponibile
    current_storage = float(company.current_storage_mb or 0)
    available_storage = max_storage - current_storage
    
    if file_size_mb > available_storage:
        return False, current_storage, max_storage
    
    return True, current_storage, max_storage


def get_company_storage_usage(company):
    """
    Ritorna un dict con i dettagli dell'utilizzo storage per l'azienda.
    
    Returns:
        dict con:
            - current_mb: spazio attualmente utilizzato
            - max_mb: spazio massimo consentito
            - percentage: percentuale di utilizzo
            - can_upload: se può ancora caricare file
            - file_count: numero di file caricati
    """
    if not company:
        return None
    
    limits = get_plan_limits(company)
    max_storage = limits['max_storage_mb']
    max_file_size = limits['max_file_size_mb']
    current_storage = float(company.current_storage_mb or 0)
    
    # Conta i documenti attivi (non archivati)
    from .models import Document
    file_count = Document.objects.filter(
        company=company,
        status__in=[Document.StatusChoices.DRAFT, Document.StatusChoices.ACTIVE]
    ).count()
    
    percentage = (current_storage / max_storage * 100) if max_storage > 0 else 0
    
    return {
        'current_mb': round(current_storage, 2),
        'max_mb': max_storage,
        'max_file_size_mb': max_file_size,
        'percentage': round(percentage, 1),
        'can_upload': current_storage < max_storage,
        'file_count': file_count,
    }

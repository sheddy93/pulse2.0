"""
API per ricerca globale trasversale
Cerca in: dipendenti, aziende, documenti, payroll
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import (
    Company, EmployeeProfile, User, Document,
    PayrollRun, TimeEntry, LeaveRequest, Notification
)
# Serializers non necessari per questa view - usiamo solo dizionari


class GlobalSearchView(APIView):
    """
    Ricerca globale trasversale
    GET /api/search/?q=keyword&types=employees,documents

    Risposta:
    {
        "query": "mario",
        "results": {
            "employees": [...],
            "companies": [...],
            "documents": [...],
            "payroll": [...]
        },
        "total_count": 15
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        types = request.query_params.get('types', 'employees,documents').split(',')
        limit = int(request.query_params.get('limit', 10))

        if len(query) < 2:
            return Response(
                {"detail": "Query troppo corta (min 2 caratteri)"},
                status=400
            )

        company = request.user.company
        is_admin = request.user.is_platform_admin or request.user.role in [
            'company_owner', 'company_admin', 'hr_manager'
        ]

        results = {}

        # Cerca dipendenti
        if 'employees' in types:
            employees = self.search_employees(query, company, is_admin, limit)
            results['employees'] = employees

        # Cerca aziende (solo super_admin)
        if 'companies' in types and is_admin:
            companies = self.search_companies(query, limit)
            results['companies'] = companies

        # Cerca documenti
        if 'documents' in types:
            documents = self.search_documents(query, company, limit)
            results['documents'] = documents

        # Cerca payroll
        if 'payroll' in types:
            payroll = self.search_payroll(query, company, limit)
            results['payroll'] = payroll

        # Cerca notifiche
        if 'notifications' in types:
            notifications = self.search_notifications(query, request.user, limit)
            results['notifications'] = notifications

        total_count = sum(len(v) for v in results.values())

        return Response({
            "query": query,
            "results": results,
            "total_count": total_count,
            "searched_types": types
        })

    def search_employees(self, query, company, is_admin, limit):
        """Cerca nei profili dipendenti"""
        q = Q(first_name__icontains=query) | \
            Q(last_name__icontains=query) | \
            Q(employee_code__icontains=query) | \
            Q(tax_id__icontains=query)

        if not is_admin:
            # Dipendenti normali vedono solo il proprio profilo
            return []

        employees = EmployeeProfile.objects.filter(
            company=company
        ).filter(q).select_related('user')[:limit]

        return [{
            "id": str(e.id),
            "type": "employee",
            "title": e.full_name,
            "subtitle": f"{e.employee_code} - {e.get_status_display()}",
            "url": f"/company/employees/{e.id}/"
        } for e in employees]

    def search_companies(self, query, limit):
        """Cerca nelle aziende (solo admin)"""
        companies = Company.objects.filter(
            Q(name__icontains=query) | \
            Q(legal_name__icontains=query) | \
            Q(vat_number__icontains=query) | \
            Q(slug__icontains=query)
        )[:limit]

        return [{
            "id": str(c.id),
            "type": "company",
            "title": c.name,
            "subtitle": f"{c.status} - {c.plan or 'Trial'}",
            "url": f"/admin/companies/{c.id}/"
        } for c in companies]

    def search_documents(self, query, company, limit):
        """Cerca nei documenti"""
        documents = Document.objects.filter(
            company=company
        ).filter(
            Q(title__icontains=query) | \
            Q(description__icontains=query) | \
            Q(original_filename__icontains=query)
        )[:limit]

        return [{
            "id": str(d.id),
            "type": "document",
            "title": d.title,
            "subtitle": f"{d.get_category_display()} - {d.created_at.strftime('%d/%m/%Y')}",
            "url": f"/documents/{d.id}/"
        } for d in documents]

    def search_payroll(self, query, company, limit):
        """Cerca nei payroll"""
        payroll = PayrollRun.objects.filter(
            company=company,
            employee__first_name__icontains=query
        ).select_related('employee')[:limit]

        return [{
            "id": str(p.id),
            "type": "payroll",
            "title": f"Payroll {p.month}/{p.year}",
            "subtitle": f"{p.employee.full_name} - {p.get_status_display()}",
            "url": f"/payslips/{p.id}/"
        } for p in payroll]

    def search_notifications(self, query, user, limit):
        """Cerca nelle notifiche personali"""
        notifications = Notification.objects.filter(
            user=user,
            title__icontains=query
        )[:limit]

        return [{
            "id": str(n.id),
            "type": "notification",
            "title": n.title,
            "subtitle": n.message[:50] + "..." if len(n.message) > 50 else n.message,
            "url": n.action_url or "/notifications/"
        } for n in notifications]


class QuickSearchView(APIView):
    """
    Ricerca rapida per autocomplete
    GET /api/search/quick/?q=ma

    Risposta ottimizzata per autocomplete:
    {
        "suggestions": [
            {"type": "employee", "text": "Mario Rossi", "id": "uuid"},
            {"type": "document", "text": "Contratto Mario", "id": "uuid"}
        ]
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if len(query) < 1:
            return Response({"suggestions": []})

        company = request.user.company
        suggestions = []

        # Cerca dipendenti (max 5)
        employees = EmployeeProfile.objects.filter(
            company=company
        ).filter(
            Q(first_name__istartswith=query) | \
            Q(last_name__istartswith=query)
        )[:5]

        for e in employees:
            suggestions.append({
                "type": "employee",
                "text": e.full_name,
                "id": str(e.id)
            })

        return Response({"suggestions": suggestions})
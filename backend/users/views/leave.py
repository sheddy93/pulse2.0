from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime, timedelta

from .models import (
    Company, EmployeeProfile, LeaveBalance, LeaveRequest, LeaveType, 
    Notification, User, AuditLog
)
from .permissions import IsAuthenticatedAndTenantActive


def user_can_view_leave_requests(user):
    """Verifica permessi visualizzazione richieste"""
    if user.is_platform_admin:
        return True
    if user.role == User.RoleChoices.EMPLOYEE:
        return True
    if user.role in [User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN, 
                     User.RoleChoices.HR_MANAGER, User.RoleChoices.MANAGER]:
        return True
    if user.role == User.RoleChoices.LABOR_CONSULTANT:
        return True
    return False


def user_can_approve_leave(user, company):
    """Verifica permessi approvazione"""
    if user.is_platform_admin:
        return True
    if user.role in [User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN, 
                     User.RoleChoices.HR_MANAGER]:
        return True
    if user.role == User.RoleChoices.MANAGER:
        # Solo per il proprio team
        return True
    return False


def user_can_access_employee_leave(user, employee):
    """Verifica se l'utente puo' accedere alle ferie del dipendente"""
    if user.is_platform_admin:
        return True
    if user.role in [User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN, 
                     User.RoleChoices.HR_MANAGER]:
        return True
    if employee.user_id == user.id:
        return True
    if user.role == User.RoleChoices.MANAGER and employee.manager_id:
        manager = EmployeeProfile.objects.filter(id=employee.manager_id).first()
        if manager and manager.user_id == user.id:
            return True
    return False


def calculate_working_days(start_date, end_date, half_day_start=False, half_day_end=False):
    """Calcola i giorni lavorativi tra due date"""
    current = start_date
    total = 0
    while current <= end_date:
        # Sabato e domenica non contano
        if current.weekday() < 5:
            if current == start_date and half_day_start:
                total += 0.5
            elif current == end_date and half_day_end:
                total += 0.5
            else:
                total += 1
        current += timedelta(days=1)
    return total


class LeaveTypeListView(APIView):
    """Lista e creazione tipologie ferie"""
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        company = request.user.company
        if request.user.is_platform_admin:
            company_id = request.query_params.get("company_id")
            if company_id:
                company = Company.objects.filter(id=company_id).first()
        
        if not company:
            return Response({"detail": "Azienda non trovata"}, status=status.HTTP_404_NOT_FOUND)
        
        leave_types = LeaveType.objects.filter(company=company, is_active=True)
        data = []
        for lt in leave_types:
            data.append({
                "id": str(lt.id),
                "name": lt.name,
                "code": lt.code,
                "leave_type": lt.leave_type,
                "requires_approval": lt.requires_approval,
                "requires_document": lt.requires_document,
                "max_days_per_year": lt.max_days_per_year,
                "max_consecutive_days": lt.max_consecutive_days,
                "allow_negative_balance": lt.allow_negative_balance,
                "color": lt.color,
                "icon": lt.icon,
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user.is_platform_admin and request.user.role not in [
            User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN
        ]:
            return Response({"detail": "Permessi insufficienti"}, status=status.HTTP_403_FORBIDDEN)
        
        company = request.user.company
        if request.user.is_platform_admin:
            company_id = request.data.get("company_id")
            if company_id:
                company = Company.objects.filter(id=company_id).first()
        
        if not company:
            return Response({"detail": "Azienda non trovata"}, status=status.HTTP_404_NOT_FOUND)
        
        lt = LeaveType.objects.create(
            company=company,
            name=request.data.get("name"),
            code=request.data.get("code"),
            leave_type=request.data.get("leave_type", LeaveType.TypeChoices.VACATION),
            requires_approval=request.data.get("requires_approval", True),
            requires_document=request.data.get("requires_document", False),
            max_days_per_year=request.data.get("max_days_per_year", 0),
            max_consecutive_days=request.data.get("max_consecutive_days", 0),
            allow_negative_balance=request.data.get("allow_negative_balance", False),
            color=request.data.get("color", "#3b82f6"),
        )
        return Response({
            "id": str(lt.id),
            "name": lt.name,
            "code": lt.code,
        }, status=status.HTTP_201_CREATED)


class LeaveBalanceListView(APIView):
    """Lista saldi ferie per dipendente"""
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        year = int(request.query_params.get("year", timezone.now().year))
        
        if request.user.role == User.RoleChoices.EMPLOYEE:
            employee = EmployeeProfile.objects.filter(user=request.user).first()
        else:
            employee_id = request.query_params.get("employee_id")
            if not employee_id:
                return Response({"detail": "employee_id richiesto"}, status=status.HTTP_400_BAD_REQUEST)
            employee = EmployeeProfile.objects.filter(id=employee_id).first()
        
        if not employee:
            return Response({"detail": "Dipendente non trovato"}, status=status.HTTP_404_NOT_FOUND)
        
        if not user_can_access_employee_leave(request.user, employee):
            return Response({"detail": "Non hai accesso a questi dati"}, status=status.HTTP_403_FORBIDDEN)
        
        balances = LeaveBalance.objects.filter(employee=employee, year=year)
        data = []
        for bal in balances:
            data.append({
                "id": str(bal.id),
                "leave_type": {
                    "id": str(bal.leave_type.id),
                    "name": bal.leave_type.name,
                    "code": bal.leave_type.code,
                    "color": bal.leave_type.color,
                },
                "year": bal.year,
                "entitled_days": float(bal.entitled_days),
                "used_days": float(bal.used_days),
                "pending_days": float(bal.pending_days),
                "carry_over_days": float(bal.carry_over_days),
                "available_days": float(bal.available_days),
            })
        return Response(data, status=status.HTTP_200_OK)


class LeaveRequestListView(APIView):
    """Lista e creazione richieste ferie"""
    permission_classes= [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        if not user_can_view_leave_requests(request.user):
            return Response({"detail": "Permessi insufficienti"}, status=status.HTTP_403_FORBIDDEN)
        
        year = request.query_params.get("year", timezone.now().year)
        status_filter = request.query_params.get("status")
        employee_id = request.query_params.get("employee_id")
        
        # Filtra per azienda
        if request.user.is_platform_admin:
            company_id = request.query_params.get("company_id")
            if company_id:
                company = Company.objects.filter(id=company_id).first()
            else:
                company = request.user.company
        else:
            company = request.user.company
        
        queryset = LeaveRequest.objects.filter(company=company, start_date__year=int(year))
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        elif request.user.role == User.RoleChoices.EMPLOYEE:
            employee = EmployeeProfile.objects.filter(user=request.user).first()
            if employee:
                queryset = queryset.filter(employee=employee)
        
        # Ordina per data richiesta
        queryset = queryset.select_related("employee", "leave_type", "approved_by").order_by("-created_at")
        
        data = []
        for lr in queryset:
            data.append({
                "id": str(lr.id),
                "employee": {
                    "id": str(lr.employee.id),
                    "full_name": lr.employee.full_name,
                    "employee_code": lr.employee.employee_code,
                    "department": lr.employee.department.name if lr.employee.department else None,
                },
                "leave_type": {
                    "id": str(lr.leave_type.id),
                    "name": lr.leave_type.name,
                    "code": lr.leave_type.code,
                    "color": lr.leave_type.color,
                },
                "status": lr.status,
                "start_date": lr.start_date.isoformat(),
                "end_date": lr.end_date.isoformat(),
                "total_days": float(lr.total_days),
                "half_day_start": lr.half_day_start,
                "half_day_end": lr.half_day_end,
                "reason": lr.reason,
                "is_paid": lr.is_paid,
                "approved_by": lr.approved_by.email if lr.approved_by else None,
                "approved_at": lr.approved_at.isoformat() if lr.approved_at else None,
                "rejection_reason": lr.rejection_reason,
                "created_at": lr.created_at.isoformat(),
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        # Solo dipendenti possono creare richieste
        if request.user.role == User.RoleChoices.EMPLOYEE:
            employee = EmployeeProfile.objects.filter(user=request.user).first()
        elif request.query_params.get("employee_id"):
            employee = EmployeeProfile.objects.filter(id=request.query_params.get("employee_id")).first()
        else:
            return Response({"detail": "Dipendente non specificato"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not employee:
            return Response({"detail": "Profilo dipendente non trovato"}, status=status.HTTP_404_NOT_FOUND)
        
        leave_type_id = request.data.get("leave_type_id")
        if not leave_type_id:
            return Response({"detail": "Tipo ferie richiesto"}, status=status.HTTP_400_BAD_REQUEST)
        
        leave_type = LeaveType.objects.filter(id=leave_type_id, company=employee.company).first()
        if not leave_type:
            return Response({"detail": "Tipo ferie non valido"}, status=status.HTTP_400_BAD_REQUEST)
        
        start_date = datetime.strptime(request.data.get("start_date"), "%Y-%m-%d").date()
        end_date = datetime.strptime(request.data.get("end_date"), "%Y-%m-%d").date()
        
        if end_date < start_date:
            return Response({"detail": "Data fine antecedente data inizio"}, status=status.HTTP_400_BAD_REQUEST)
        
        total_days = calculate_working_days(
            start_date, end_date,
            request.data.get("half_day_start", False),
            request.data.get("half_day_end", False)
        )
        
        if total_days <= 0:
            return Response({"detail": "Nessun giorno lavorativo selezionato"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verifica limite giorni consecutivi
        if leave_type.max_consecutive_days > 0 and total_days > leave_type.max_consecutive_days:
            return Response({
                "detail": f"Massimo {leave_type.max_consecutive_days} giorni consecutivi permessi"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verifica saldo disponibile
        if leave_type.requires_approval:
            year = start_date.year
            balance, created = LeaveBalance.objects.get_or_create(
                employee=employee,
                leave_type=leave_type,
                year=year,
                defaults={"entitled_days": leave_type.max_days_per_year}
            )
            
            if not leave_type.allow_negative_balance and balance.available_days < total_days:
                return Response({
                    "detail": f"Saldo insufficiente. Disponibili: {balance.available_days} giorni"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        lr = LeaveRequest.objects.create(
            employee=employee,
            leave_type=leave_type,
            company=employee.company,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            half_day_start=request.data.get("half_day_start", False),
            half_day_end=request.data.get("half_day_end", False),
            reason=request.data.get("reason", ""),
            is_paid=request.data.get("is_paid", True),
        )
        
        # Aggiorna pending days
        if leave_type.requires_approval:
            LeaveBalance.objects.filter(
                employee=employee,
                leave_type=leave_type,
                year=year
            ).update(pending_days=total_days)
        
        # Notifica al manager/HR
        managers = User.objects.filter(
            company=employee.company,
            role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.HR_MANAGER, User.RoleChoices.MANAGER]
        )
        for mgr in managers:
            Notification.objects.create(
                user=mgr,
                title="Nuova richiesta ferie",
                message=f"{employee.full_name} ha richiesto {total_days} giorni di {leave_type.name}",
                notification_type=Notification.TypeChoices.INFO,
                action_url=f"/company/leave/{lr.id}/"
            )
        
        return Response({
            "id": str(lr.id),
            "status": lr.status,
            "total_days": float(lr.total_days),
        }, status=status.HTTP_201_CREATED)


class LeaveRequestDetailView(APIView):
    """Dettaglio e azioni su richiesta ferie"""
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request, id):
        lr = LeaveRequest.objects.filter(id=id).select_related(
            "employee", "leave_type", "approved_by", "company"
        ).first()
        
        if not lr:
            return Response({"detail": "Richiesta non trovata"}, status=status.HTTP_404_NOT_FOUND)
        
        if not user_can_access_employee_leave(request.user, lr.employee):
            return Response({"detail": "Non hai accesso a questa richiesta"}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            "id": str(lr.id),
            "employee": {
                "id": str(lr.employee.id),
                "full_name": lr.employee.full_name,
                "employee_code": lr.employee.employee_code,
            },
            "leave_type": {
                "id": str(lr.leave_type.id),
                "name": lr.leave_type.name,
                "code": lr.leave_type.code,
                "color": lr.leave_type.color,
            },
            "status": lr.status,
            "start_date": lr.start_date.isoformat(),
            "end_date": lr.end_date.isoformat(),
            "total_days": float(lr.total_days),
            "reason": lr.reason,
            "is_paid": lr.is_paid,
            "approved_by": lr.approved_by.email if lr.approved_by else None,
            "approved_at": lr.approved_at.isoformat() if lr.approved_at else None,
            "rejection_reason": lr.rejection_reason,
            "created_at": lr.created_at.isoformat(),
        })

    def delete(self, request, id):
        """Cancella richiesta (solo se pending)"""
        lr = LeaveRequest.objects.filter(id=id).first()
        if not lr:
            return Response({"detail": "Richiesta non trovata"}, status=status.HTTP_404_NOT_FOUND)
        
        # Solo il dipendente puo' cancellare
        if lr.employee.user_id != request.user.id and not request.user.is_platform_admin:
            return Response({"detail": "Non puoi cancellare questa richiesta"}, status=status.HTTP_403_FORBIDDEN)
        
        if lr.status != LeaveRequest.StatusChoices.PENDING:
            return Response({"detail": "Solo richieste in attesa possono essere cancellate"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Aggiorna saldo
        LeaveBalance.objects.filter(
            employee=lr.employee,
            leave_type=lr.leave_type,
            year=lr.start_date.year
        ).update(pending_days=0)
        
        lr.status = LeaveRequest.StatusChoices.CANCELLED
        lr.save()
        
        return Response({"detail": "Richiesta cancellata"}, status=status.HTTP_200_OK)


class LeaveRequestApproveView(APIView):
    """Approva o rifiuta richiesta ferie"""
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request, id):
        lr = LeaveRequest.objects.filter(id=id).select_related("employee", "leave_type").first()
        if not lr:
            return Response({"detail": "Richiesta non trovata"}, status=status.HTTP_404_NOT_FOUND)
        
        if not user_can_approve_leave(request.user, lr.company):
            return Response({"detail": "Non hai permessi di approvazione"}, status=status.HTTP_403_FORBIDDEN)
        
        if lr.status != LeaveRequest.StatusChoices.PENDING:
            return Response({"detail": "Richiesta gia' processata"}, status=status.HTTP_400_BAD_REQUEST)
        
        action = request.data.get("action")  # "approve" o "reject"
        reason = request.data.get("reason", "")
        
        if action == "reject":
            lr.status = LeaveRequest.StatusChoices.REJECTED
            lr.rejection_reason = reason
            lr.approved_by = request.user
            
            # Rimuovi dai pending days
            LeaveBalance.objects.filter(
                employee=lr.employee,
                leave_type=lr.leave_type,
                year=lr.start_date.year
            ).update(pending_days=0)
            
            # Notifica al dipendente
            if lr.employee.user:
                Notification.objects.create(
                    user=lr.employee.user,
                    title="Richiesta ferie rifiutata",
                    message=f"La tua richiesta di {lr.leave_type.name} e' stata rifiutata",
                    notification_type=Notification.TypeChoices.WARNING,
                    action_url=f"/attendance/leave/{lr.id}/"
                )
            
            return Response({"detail": "Richiesta rifiutata", "status": lr.status}, status=status.HTTP_200_OK)
        
        elif action == "approve":
            lr.status = LeaveRequest.StatusChoices.APPROVED
            lr.approved_by = request.user
            lr.approved_at = timezone.now()
            
            # Sposta da pending a used
            LeaveBalance.objects.filter(
                employee=lr.employee,
                leave_type=lr.leave_type,
                year=lr.start_date.year
            ).update(
                used_days=lr.total_days,
                pending_days=0
            )
            
            # Notifica al dipendente
            if lr.employee.user:
                Notification.objects.create(
                    user=lr.employee.user,
                    title="Richiesta ferie approvata",
                    message=f"La tua richiesta di {lr.leave_type.name} ({lr.total_days} giorni) e' stata approvata",
                    notification_type=Notification.TypeChoices.SUCCESS,
                    action_url=f"/attendance/leave/{lr.id}/"
                )
            
            return Response({"detail": "Richiesta approvata", "status": lr.status}, status=status.HTTP_200_OK)
        
        return Response({"detail": "Azione non valida"}, status=status.HTTP_400_BAD_REQUEST)


class LeaveCalendarView(APIView):
    """Vista calendario ferie aziendali"""
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        if not user_can_view_leave_requests(request.user):
            return Response({"detail": "Permessi insufficienti"}, status=status.HTTP_403_FORBIDDEN)
        
        year = int(request.query_params.get("year", timezone.now().year))
        month = request.query_params.get("month")
        
        company = request.user.company
        if request.user.is_platform_admin:
            company_id = request.query_params.get("company_id")
            if company_id:
                company = Company.objects.filter(id=company_id).first()
        
        if not company:
            return Response({"detail": "Azienda non trovata"}, status=status.HTTP_404_NOT_FOUND)
        
        queryset = LeaveRequest.objects.filter(
            company=company,
            status__in=[LeaveRequest.StatusChoices.PENDING, LeaveRequest.StatusChoices.APPROVED],
            start_date__lte=f"{year}-12-31",
            end_date__gte=f"{year}-01-01"
        )
        
        if month:
            queryset = queryset.filter(
                start_date__month=int(month),
                end_date__month=int(month)
            ) | queryset.filter(
                start_date__month__lte=int(month),
                end_date__month__gte=int(month)
            )
        
        data = []
        for lr in queryset.distinct():
            data.append({
                "id": str(lr.id),
                "employee": lr.employee.full_name,
                "leave_type": lr.leave_type.name,
                "color": lr.leave_type.color,
                "start_date": lr.start_date.isoformat(),
                "end_date": lr.end_date.isoformat(),
                "total_days": float(lr.total_days),
                "status": lr.status,
            })
        
        return Response(data, status=status.HTTP_200_OK)


class LeaveStatsView(APIView):
    """Statistiche ferie aziendali"""
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        year = int(request.query_params.get("year", timezone.now().year))
        
        company = request.user.company
        if request.user.is_platform_admin:
            company_id = request.query_params.get("company_id")
            if company_id:
                company = Company.objects.filter(id=company_id).first()
        
        if not company:
            return Response({"detail": "Azienda non trovata"}, status=status.HTTP_404_NOT_FOUND)
        
        # Conteggio per stato
        status_counts = LeaveRequest.objects.filter(
            company=company,
            start_date__year=year
        ).values("status").annotate(total=Count("id"))
        
        # Totali giorni per tipo
        approved = LeaveRequest.objects.filter(
            company=company,
            start_date__year=year,
            status=LeaveRequest.StatusChoices.APPROVED
        ).select_related("leave_type")
        
        by_type = {}
        for lr in approved:
            lt_name = lr.leave_type.name
            if lt_name not in by_type:
                by_type[lt_name] = 0
            by_type[lt_name] += float(lr.total_days)
        
        return Response({
            "year": year,
            "status_counts": list(status_counts),
            "days_by_type": by_type,
            "total_approved_days": sum(by_type.values()),
        }, status=status.HTTP_200_OK)

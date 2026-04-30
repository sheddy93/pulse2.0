"""
Modulo Sicurezza sul Lavoro - Views
API endpoints per gestione sicurezza
"""

from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import (
    Company,
    EmployeeProfile,
    User,
    SafetyCourse,
    EmployeeTraining,
    SafetyInspection,
    SafetyAlert,
)
from users.serializers import (
    SafetyCourseSerializer,
    SafetyCourseCreateSerializer,
    EmployeeTrainingSerializer,
    SafetyInspectionSerializer,
    SafetyAlertSerializer,
)
from users.permissions import IsAuthenticatedAndTenantActive


# ============================================
# SAFETY COURSE VIEWS
# ============================================

class SafetyCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la gestione dei corsi di sicurezza

    GET /api/safety/courses/ - Lista corsi azienda
    POST /api/safety/courses/ - Crea nuovo corso (solo super_admin)
    GET /api/safety/courses/{id}/ - Dettaglio corso
    PUT /api/safety/courses/{id}/ - Modifica corso
    DELETE /api/safety/courses/{id}/ - Elimina corso
    """
    serializer_class = SafetyCourseSerializer
    permission_classes = [IsAuthenticatedAndTenantActive]

    def get_queryset(self):
        user = self.request.user
        queryset = SafetyCourse.objects.all()

        # Filter by company
        if user.is_platform_admin:
            # Super admin vede tutto
            company_id = self.request.query_params.get('company_id')
            if company_id:
                queryset = queryset.filter(company_id=company_id)
        else:
            # Altri utenti vedono solo la propria azienda
            queryset = queryset.filter(company=user.company)

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Filter by mandatory
        is_mandatory = self.request.query_params.get('is_mandatory')
        if is_mandatory is not None:
            queryset = queryset.filter(is_mandatory=is_mandatory.lower() == 'true')

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return SafetyCourseCreateSerializer
        return SafetyCourseSerializer

    def create(self, request, *args, **kwargs):
        # Solo super_admin o admin aziendale possono creare corsi
        if not request.user.is_platform_admin and request.user.role not in ['company_admin', 'hr_manager']:
            return Response(
                {"detail": "Non hai i permessi per creare corsi"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Solo super_admin può eliminare corsi
        if not request.user.is_platform_admin:
            return Response(
                {"detail": "Non hai i permessi per eliminare corsi"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


# ============================================
# EMPLOYEE TRAINING VIEWS
# ============================================

class EmployeeTrainingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet per la gestione delle assegnazioni corsi ai dipendenti

    GET /api/safety/trainings/ - Lista assegnazioni
    GET /api/safety/trainings/{id}/ - Dettaglio assegnazione
    GET /api/safety/trainings/pending/ - Corsi in scadenza
    GET /api/safety/trainings/expiring/ - Corsi che scadono presto
    POST /api/safety/trainings/assign/ - Assegna corso a dipendente
    POST /api/safety/trainings/{id}/complete/ - Segna come completato
    """
    serializer_class = EmployeeTrainingSerializer
    permission_classes = [IsAuthenticatedAndTenantActive]

    def get_queryset(self):
        user = self.request.user
        queryset = EmployeeTraining.objects.select_related('employee', 'course', 'employee__company')

        if user.is_platform_admin:
            company_id = self.request.query_params.get('company_id')
            if company_id:
                queryset = queryset.filter(employee__company_id=company_id)
        else:
            queryset = queryset.filter(employee__company=user.company)

        # Filter by employee
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        # Filter by course
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by expired/overdue
        overdue = self.request.query_params.get('overdue')
        if overdue and overdue.lower() == 'true':
            queryset = queryset.filter(status='pending', due_date__lt=timezone.now().date())

        return queryset

    @action(detail=False, methods=['post'])
    def assign(self, request):
        """Assegna un corso a un dipendente"""
        serializer = EmployeeTrainingAssignSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            training = serializer.save()
            return Response(
                EmployeeTrainingSerializer(training).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Segna un'assegnazione come completata"""
        training = self.get_object()
        if training.status == 'completed':
            return Response(
                {"detail": "Questa formazione è già stata completata"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EmployeeTrainingCompleteSerializer(data=request.data)
        if serializer.is_valid():
            training.mark_completed(
                score=serializer.validated_data.get('score'),
                certificate_url=serializer.validated_data.get('certificate_url')
            )
            if serializer.validated_data.get('notes'):
                training.notes = serializer.validated_data['notes']
                training.save(update_fields=['notes'])

            return Response(EmployeeTrainingSerializer(training).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Lista corsi pending (in attesa)"""
        queryset = self.get_queryset().filter(status='pending')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring(self, request):
        """Lista corsi che scadono nei prossimi 30 giorni"""
        warning_date = timezone.now().date() + timedelta(days=30)
        queryset = self.get_queryset().filter(
            status='pending',
            due_date__lte=warning_date,
            due_date__gte=timezone.now().date()
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# ============================================
# SAFETY INSPECTION VIEWS
# ============================================

class SafetyInspectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet per la gestione delle ispezioni di sicurezza

    GET /api/safety/inspections/ - Lista ispezioni
    POST /api/safety/inspections/ - Crea ispezione
    GET /api/safety/inspections/{id}/ - Dettaglio ispezione
    PUT /api/safety/inspections/{id}/ - Modifica ispezione
    POST /api/safety/inspections/{id}/complete/ - Completa ispezione
    """
    serializer_class = SafetyInspectionSerializer
    permission_classes = [IsAuthenticatedAndTenantActive]

    def get_queryset(self):
        user = self.request.user
        queryset = SafetyInspection.objects.select_related('company', 'inspector')

        if user.is_platform_admin:
            company_id = self.request.query_params.get('company_id')
            if company_id:
                queryset = queryset.filter(company_id=company_id)
        else:
            queryset = queryset.filter(company=user.company)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by risk level
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return SafetyInspectionCreateSerializer
        return SafetyInspectionSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Completa un'ispezione"""
        inspection = self.get_object()
        if inspection.status == 'completed':
            return Response(
                {"detail": "Questa ispezione è già stata completata"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SafetyInspectionCompleteSerializer(data=request.data)
        if serializer.is_valid():
            inspection.complete(
                findings=serializer.validated_data['findings'],
                risk_level=serializer.validated_data['risk_level'],
                corrective_actions=serializer.validated_data.get('corrective_actions', '')
            )
            return Response(SafetyInspectionSerializer(inspection).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# SAFETY ALERT VIEWS
# ============================================

class SafetyAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet per la gestione degli alert di sicurezza

    GET /api/safety/alerts/ - Lista alert
    POST /api/safety/alerts/{id}/mark-read/ - Segna come letto
    POST /api/safety/alerts/generate/ - Genera alert (da crono o manuale)
    """
    serializer_class = SafetyAlertSerializer
    permission_classes = [IsAuthenticatedAndTenantActive]

    def get_queryset(self):
        user = self.request.user
        queryset = SafetyAlert.objects.select_related('company', 'employee')

        if user.is_platform_admin:
            company_id = self.request.query_params.get('company_id')
            if company_id:
                queryset = queryset.filter(company_id=company_id)
        else:
            queryset = queryset.filter(company=user.company)

        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')

        # Filter by alert type
        alert_type = self.request.query_params.get('alert_type')
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)

        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)

        return queryset

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Segna un alert come letto"""
        alert = self.get_object()
        alert.mark_as_read()
        return Response(SafetyAlertSerializer(alert).data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Genera alert per l'azienda (da cron o manuale)"""
        from users.models import generate_safety_alerts_for_company

        user = request.user
        company_id = request.data.get('company_id')

        if user.is_platform_admin:
            if company_id:
                try:
                    company = Company.objects.get(id=company_id)
                except Company.DoesNotExist:
                    return Response(
                        {"detail": "Azienda non trovata"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {"detail": "company_id richiesto per super_admin"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            company = user.company

        #Genera gli alert
        generate_safety_alerts_for_company(company)

        # Restituisci gli alert generati
        alerts = SafetyAlert.objects.filter(company=company, is_read=False)
        serializer = SafetyAlertSerializer(alerts, many=True)
        return Response({
            "generated": alerts.count(),
            "alerts": serializer.data
        })

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Segna tutti gli alert come letti"""
        user = request.user
        queryset = SafetyAlert.objects.filter(company=user.company, is_read=False)
        count = queryset.update(is_read=True, read_at=timezone.now())
        return Response({"marked_read": count})


# ============================================
# SAFETY DASHBOARD VIEW
# ============================================

class SafetyDashboardView(APIView):
    """
    Dashboard sicurezza con statistiche

    GET /api/safety/dashboard/ - Statistiche sicurezza
    """
    permission_classes = [IsAuthenticatedAndTenantActive]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        warning_date = today + timedelta(days=30)

        if user.is_platform_admin:
            company_id = request.query_params.get('company_id')
            if company_id:
                company = Company.objects.filter(id=company_id).first()
            else:
                # Super admin senza company_id = nessun dato
                return Response({
                    "total_employees": 0,
                    "compliant_employees": 0,
                    "non_compliant_employees": 0,
                    "compliance_rate": 0,
                    "active_courses": 0,
                    "completed_courses": 0,
                    "total_courses": 0,
                    "pending_trainings": 0,
                    "expired_trainings": 0,
                    "upcoming_deadlines": 0,
                    "overdue_count": 0,
                    "active_inspections": 0,
                    "completed_inspections": 0,
                    "unread_alerts": 0,
                    "courses_completed_this_month": 0,
                })
        else:
            company = user.company

        # Statistiche dipendenti
        total_employees = EmployeeProfile.objects.filter(
            company=company,
            status='active'
        ).count()

        # Calcolo compliance (dipendenti con tutti i corsi obbligatori completati e non scaduti)
        mandatory_courses = SafetyCourse.objects.filter(
            company=company,
            is_mandatory=True
        )
        total_mandatory = mandatory_courses.count()

        if total_mandatory > 0:
            # Dizionario: employee_id -> count di corsi completati non scaduti
            from django.db.models import Count, Case, When, IntegerField
            from django.db.models.functions import Coalesce

            completed_by_employee = EmployeeTraining.objects.filter(
                employee__company=company,
                course__in=mandatory_courses
            ).exclude(
                status='expired'
            ).values('employee').annotate(
                completed_count=Count('id')
            )

            compliant_count = sum(1 for e in completed_by_employee if e['completed_count'] >= total_mandatory)
            non_compliant = total_employees - compliant_count
            compliance_rate = (compliant_count / total_employees * 100) if total_employees > 0 else 0
        else:
            compliant_count = total_employees
            non_compliant = 0
            compliance_rate = 100

        # Statistiche corsi
        total_courses = SafetyCourse.objects.filter(company=company).count()
        active_courses = total_courses  # Corsi attivi = tutti i corsi creati

        # Statistiche formazioni
        all_trainings = EmployeeTraining.objects.filter(employee__company=company)
        pending_trainings = all_trainings.filter(status='pending').count()
        expired_trainings = all_trainings.filter(status='expired').count()
        completed_trainings = all_trainings.filter(status='completed').count()

        # Scadenze imminenti
        upcoming_deadlines = all_trainings.filter(
            status='pending',
            due_date__lte=warning_date,
            due_date__gte=today
        ).count()

        # Scaduti
        overdue_count = all_trainings.filter(
            status='pending',
            due_date__lt=today
        ).count()

        # Corsi completati questo mese
        month_start = today.replace(day=1)
        courses_this_month = all_trainings.filter(
            completed_at__gte=month_start
        ).count()

        # Statistiche ispezioni
        inspections = SafetyInspection.objects.filter(company=company)
        active_inspections = inspections.filter(status__in=['scheduled', 'in_progress']).count()
        completed_inspections = inspections.filter(status='completed').count()

        # Alert non letti
        unread_alerts = SafetyAlert.objects.filter(company=company, is_read=False).count()

        data = {
            "total_employees": total_employees,
            "compliant_employees": compliant_count,
            "non_compliant_employees": non_compliant,
            "compliance_rate": round(compliance_rate, 1),
            "active_courses": active_courses,
            "completed_courses": completed_trainings,
            "total_courses": total_courses,
            "pending_trainings": pending_trainings,
            "expired_trainings": expired_trainings,
            "upcoming_deadlines": upcoming_deadlines,
            "overdue_count": overdue_count,
            "active_inspections": active_inspections,
            "completed_inspections": completed_inspections,
            "unread_alerts": unread_alerts,
            "courses_completed_this_month": courses_this_month,
        }

        serializer = SafetyDashboardSerializer(data)
        return Response(serializer.data)


# ============================================
# EMPLOYEE COMPLIANCE VIEW
# ============================================

class EmployeeComplianceView(APIView):
    """
    Lista compliance per singolo dipendente

    GET /api/safety/employee/{employee_id}/compliance/
    """
    permission_classes = [IsAuthenticatedAndTenantActive]

    def get(self, request, employee_id):
        user = request.user

        try:
            if user.is_platform_admin:
                employee = EmployeeProfile.objects.get(id=employee_id)
            else:
                employee = EmployeeProfile.objects.get(id=employee_id, company=user.company)
        except EmployeeProfile.DoesNotExist:
            return Response(
                {"detail": "Dipendente non trovato"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Tutte le formazioni del dipendente
        trainings = EmployeeTraining.objects.filter(
            employee=employee
        ).select_related('course')

        completed = trainings.filter(status='completed').count()
        pending = trainings.filter(status='pending').count()
        expired = trainings.filter(status='expired').count()

        # Corsi obbligatori non assegnati
        mandatory_courses = SafetyCourse.objects.filter(
            company=employee.company,
            is_mandatory=True
        )
        assigned_course_ids = trainings.values_list('course_id', flat=True)
        unassigned_mandatory = mandatory_courses.exclude(id__in=assigned_course_ids).count()

        return Response({
            "employee_id": str(employee.id),
            "employee_name": employee.full_name,
            "employee_code": employee.employee_code,
            "completed_courses": completed,
            "pending_courses": pending,
            "expired_courses": expired,
            "unassigned_mandatory": unassigned_mandatory,
            "total_required": mandatory_courses.count(),
            "trainings": EmployeeTrainingSerializer(trainings, many=True).data
        })


# ============================================
# BULK ASSIGN COURSES VIEW
# ============================================

class BulkAssignCoursesView(APIView):
    """
    Assegna un corso a piu dipendenti

    POST /api/safety/trainings/bulk-assign/
    {
        "course_id": "uuid",
        "employee_ids": ["uuid", "uuid"],
        "due_date": "2025-12-31" (opzionale)
    }
    """
    permission_classes = [IsAuthenticatedAndTenantActive]

    def post(self, request):
        user = request.user
        course_id = request.data.get('course_id')
        employee_ids = request.data.get('employee_ids', [])
        due_date = request.data.get('due_date')

        if not course_id:
            return Response(
                {"detail": "course_id richiesto"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not employee_ids:
            return Response(
                {"detail": "employee_ids richiesto (array vuoto)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if user.is_platform_admin:
                company = Company.objects.get(id=request.data.get('company_id', user.company.id))
            else:
                company = user.company

            course = SafetyCourse.objects.get(id=course_id, company=company)
        except SafetyCourse.DoesNotExist:
            return Response(
                {"detail": "Corso non trovato"},
                status=status.HTTP_404_NOT_FOUND
            )

        assigned = []
        skipped = []

        for emp_id in employee_ids:
            if EmployeeTraining.objects.filter(employee_id=emp_id, course=course).exists():
                skipped.append(str(emp_id))
                continue

            try:
                employee = EmployeeProfile.objects.get(id=emp_id, company=company)
                training = EmployeeTraining.objects.create(
                    employee=employee,
                    course=course,
                    due_date=due_date or (timezone.now().date() + timedelta(days=course.validity_months * 30)),
                    status='pending'
                )
                assigned.append(str(training.id))
            except EmployeeProfile.DoesNotExist:
                skipped.append(str(emp_id))

        return Response({
            "assigned_count": len(assigned),
            "skipped_count": len(skipped),
            "assigned_ids": assigned,
            "skipped_ids": skipped
        })

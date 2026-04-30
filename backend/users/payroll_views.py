from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.db.models import Count
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog, Company, Document, PayrollRun, User
from .pricing_utils import check_module_access, can_perform_action
from .serializers import (
    DocumentQuerySerializer,
    DocumentCreateSerializer,
    DocumentSerializer,
    DocumentUpdateSerializer,
    PayrollAttachDocumentSerializer,
    PayrollMonthlySummaryRowSerializer,
    PayrollQuerySerializer,
    PayrollRunCreateSerializer,
    PayrollRunSerializer,
    PayrollRunUpdateSerializer,
    PayrollStatusChangeSerializer,
)
from .payroll_services import (
    archive_document,
    attach_document_to_payroll,
    change_payroll_status,
    consultant_link_is_approved,
    create_document,
    create_payroll_run,
    get_company_payroll_overview,
    get_consultant_payroll_overview,
    get_document_queryset_for_user,
    get_monthly_payroll_summary,
    get_payroll_queryset_for_user,
    parse_month_year_or_default,
    update_payroll_run,
    user_can_access_company,
    user_can_upload_document,
    user_can_download_document,
    user_can_view_document,
)
from .permissions import IsAuthenticatedAndTenantActive, user_has_company_permission
from .services import log_audit_event


def _resolve_company_for_request(request, *, company_id=None):
    user = request.user
    if user.is_platform_admin:
        return Company.objects.filter(id=company_id).first() if company_id else None

    if company_id:
        company = Company.objects.filter(id=company_id).first()
        if company and user_can_access_company(user=user, company=company):
            return company
        return None

    return user.company


class DocumentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        queryset = get_document_queryset_for_user(request.user)

        query_serializer = DocumentQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        filters = query_serializer.validated_data

        company_id = filters.get("company_id")
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        employee_id = filters.get("employee_id")
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        status_value = request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)
        payroll_run_id = request.query_params.get("payroll_run")
        if payroll_run_id:
            queryset = queryset.filter(payroll_links__payroll_run_id=payroll_run_id)

        serializer = DocumentSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DocumentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        try:
            document = create_document(
                actor=request.user,
                company=payload["company"],
                upload=payload["file"],
                title=payload["title"],
                category=payload["category"],
                visibility=payload["visibility"],
                employee=payload.get("employee"),
                description=payload.get("description", ""),
                status_value=payload.get("status", Document.StatusChoices.ACTIVE),
                metadata=payload.get("metadata"),
                payroll_run=payload.get("payroll_run"),
                workflow_role=payload.get("role_in_workflow", "attachment"),
            )
        except PermissionError as error:
            return Response({"detail": str(error)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            DocumentSerializer(document, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get_object(self, request, id):
        document = get_object_or_404(Document, id=id)
        if not user_can_view_document(user=request.user, document=document):
            return None
        return document

    def get(self, request, id):
        document = self.get_object(request, id)
        if not document:
            return Response({"detail": "Documento non trovato."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DocumentSerializer(document, context={"request": request}).data, status=status.HTTP_200_OK)

    def patch(self, request, id):
        document = self.get_object(request, id)
        if not document:
            return Response({"detail": "Documento non trovato."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == User.RoleChoices.EMPLOYEE:
            return Response({"detail": "Operazione non consentita."}, status=status.HTTP_403_FORBIDDEN)

        if not user_can_upload_document(user=request.user, company=document.company):
            return Response({"detail": "Permessi insufficienti per modificare il documento."}, status=status.HTTP_403_FORBIDDEN)

        serializer = DocumentUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get("status") == Document.StatusChoices.ARCHIVED:
            return Response({"detail": "Usa l'endpoint di archiviazione dedicato."}, status=status.HTTP_400_BAD_REQUEST)

        for field, value in serializer.validated_data.items():
            setattr(document, field, value)
        document.save()

        return Response(DocumentSerializer(document, context={"request": request}).data, status=status.HTTP_200_OK)


class DocumentDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request, id):
        document = get_object_or_404(Document, id=id)

        if not user_can_download_document(user=request.user, document=document):
            log_audit_event(
                actor=request.user,
                company=document.company,
                action=AuditLog.ActionChoices.UNAUTHORIZED_ACCESS_ATTEMPT,
                description=f"Tentativo download non autorizzato documento {document.id}.",
                metadata={"document_id": str(document.id)},
            )
            return Response({"detail": "Non sei autorizzato a scaricare questo documento."}, status=status.HTTP_403_FORBIDDEN)

        if not document.file:
            return Response({"detail": "File non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        log_audit_event(
            actor=request.user,
            company=document.company,
            action=AuditLog.ActionChoices.DOCUMENT_DOWNLOADED,
            description=f"Documento scaricato: {document.title}.",
            metadata={"document_id": str(document.id)},
        )

        filename = document.metadata.get("original_filename") or f"{document.title}.pdf"
        response = FileResponse(document.file.open("rb"), as_attachment=True, filename=filename)
        response["Content-Type"] = document.mime_type or "application/octet-stream"
        return response


class DocumentArchiveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request, id):
        document = get_object_or_404(Document, id=id)
        try:
            archive_document(actor=request.user, document=document)
        except PermissionError as error:
            return Response({"detail": str(error)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DocumentSerializer(document, context={"request": request}).data, status=status.HTTP_200_OK)


class PayrollListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        # CONTROLLO MODULO: verifica se il piano include payroll
        company = _resolve_company_for_request(request)
        if company and not check_module_access(company, 'payroll'):
            return Response(
                {
                    "detail": "Il modulo Payroll non è incluso nel tuo piano. Aggiorna il piano per accedere.",
                    "error_code": "MODULE_NOT_INCLUDED",
                    "required_module": "payroll",
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = get_payroll_queryset_for_user(request.user)
        query_serializer = PayrollQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        filters = query_serializer.validated_data

        if filters.get("company_id"):
            queryset = queryset.filter(company_id=filters["company_id"])
        if filters.get("employee_id"):
            queryset = queryset.filter(employee_id=filters["employee_id"])
        if filters.get("month"):
            queryset = queryset.filter(month=filters["month"])
        if filters.get("year"):
            queryset = queryset.filter(year=filters["year"])
        if filters.get("status"):
            queryset = queryset.filter(status=filters["status"])

        serializer = PayrollRunSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # CONTROLLO MODULO: verifica se il piano include payroll
        company = _resolve_company_for_request(request, company_id=request.data.get("company"))
        if company and not check_module_access(company, 'payroll'):
            return Response(
                {
                    "detail": "Il modulo Payroll non è incluso nel tuo piano. Aggiorna il piano per accedere.",
                    "error_code": "MODULE_NOT_INCLUDED",
                    "required_module": "payroll",
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PayrollRunCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        try:
            payroll_run = create_payroll_run(
                actor=request.user,
                company=payload["company"],
                employee=payload["employee"],
                month=payload["month"],
                year=payload["year"],
                labor_consultant=payload.get("labor_consultant"),
                notes_company=payload.get("notes_company", ""),
                notes_consultant=payload.get("notes_consultant", ""),
                period_reference=payload.get("period_reference", ""),
                metadata=payload.get("metadata"),
            )
        except PermissionError as error:
            return Response({"detail": str(error)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            PayrollRunSerializer(payroll_run, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PayrollDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get_object(self, request, id):
        return get_object_or_404(get_payroll_queryset_for_user(request.user), id=id)

    def get(self, request, id):
        payroll_run = self.get_object(request, id)
        return Response(PayrollRunSerializer(payroll_run, context={"request": request}).data, status=status.HTTP_200_OK)

    def patch(self, request, id):
        payroll_run = self.get_object(request, id)
        serializer = PayrollRunUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            updated = update_payroll_run(actor=request.user, payroll_run=payroll_run, payload=serializer.validated_data)
        except PermissionError as error:
            return Response({"detail": str(error)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PayrollRunSerializer(updated, context={"request": request}).data, status=status.HTTP_200_OK)


class PayrollChangeStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request, id):
        payroll_run = get_object_or_404(get_payroll_queryset_for_user(request.user), id=id)
        serializer = PayrollStatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = change_payroll_status(
                actor=request.user,
                payroll_run=payroll_run,
                target_status=serializer.validated_data["status"],
                note=serializer.validated_data.get("note", ""),
            )
        except PermissionError as error:
            return Response({"detail": str(error)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(PayrollRunSerializer(updated, context={"request": request}).data, status=status.HTTP_200_OK)


class PayrollAttachDocumentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request, id):
        payroll_run = get_object_or_404(get_payroll_queryset_for_user(request.user), id=id)
        serializer = PayrollAttachDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.validated_data["document"]
        try:
            attach_document_to_payroll(
                actor=request.user,
                payroll_run=payroll_run,
                document=document,
                workflow_role=serializer.validated_data["role_in_workflow"],
            )
        except PermissionError as error:
            return Response({"detail": str(error)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        refreshed = PayrollRun.objects.get(id=payroll_run.id)
        return Response(PayrollRunSerializer(refreshed, context={"request": request}).data, status=status.HTTP_200_OK)


class PayrollDocumentsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request, id):
        payroll_run = get_object_or_404(get_payroll_queryset_for_user(request.user), id=id)
        documents = [
            link.document
            for link in payroll_run.document_links.select_related(
                "document",
                "document__company",
                "document__employee",
                "document__employee__user",
                "document__uploaded_by",
            )
            if user_can_view_document(user=request.user, document=link.document)
        ]
        return Response(DocumentSerializer(documents, many=True, context={"request": request}).data, status=status.HTTP_200_OK)


class EmployeePayrollMineView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        queryset = get_payroll_queryset_for_user(request.user)
        if request.user.role == User.RoleChoices.EMPLOYEE:
            queryset = queryset.filter(employee__user=request.user)
        return Response(PayrollRunSerializer(queryset, many=True, context={"request": request}).data, status=status.HTTP_200_OK)


class CompanyPayrollOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        company = _resolve_company_for_request(request, company_id=request.query_params.get("company_id"))
        if request.user.role == User.RoleChoices.SAFETY_CONSULTANT:
            return Response({"detail": "Ruolo non autorizzato al payroll."}, status=status.HTTP_403_FORBIDDEN)
        if not request.user.is_platform_admin and not user_has_company_permission(request.user, "view-payroll"):
            return Response({"detail": "Permessi insufficienti."}, status=status.HTTP_403_FORBIDDEN)

        try:
            month, year = parse_month_year_or_default(
                month=request.query_params.get("month"),
                year=request.query_params.get("year"),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_platform_admin and not company:
            queryset = PayrollRun.objects.filter(month=month, year=year).select_related("employee", "labor_consultant", "company")
            status_counts = queryset.values("status").annotate(total=Count("id")).order_by("status")
            return Response(
                {
                    "company_id": None,
                    "company_name": "Tutti i tenant",
                    "month": month,
                    "year": year,
                    "status_counts": list(status_counts),
                    "total_runs": queryset.count(),
                    "runs": PayrollRunSerializer(queryset, many=True, context={"request": request}).data,
                    "summary": get_monthly_payroll_summary(queryset=queryset),
                },
                status=status.HTTP_200_OK,
            )

        if not company:
            return Response({"detail": "Tenant non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        overview = get_company_payroll_overview(company=company, month=month, year=year)
        runs = overview.pop("runs")
        overview["runs"] = PayrollRunSerializer(runs, many=True, context={"request": request}).data
        overview["summary"] = get_monthly_payroll_summary(queryset=PayrollRun.objects.filter(company=company, month=month, year=year))
        return Response(overview, status=status.HTTP_200_OK)


class ConsultantPayrollOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        if not (request.user.is_platform_admin or request.user.role == User.RoleChoices.LABOR_CONSULTANT):
            return Response({"detail": "Solo labor consultant o super admin possono accedere."}, status=status.HTTP_403_FORBIDDEN)

        company = _resolve_company_for_request(request, company_id=request.query_params.get("company_id"))
        if company and request.user.role == User.RoleChoices.LABOR_CONSULTANT and not consultant_link_is_approved(
            consultant=request.user,
            company=company,
        ):
            return Response({"detail": "La societa' non e' collegata al consulente."}, status=status.HTTP_403_FORBIDDEN)

        try:
            month, year = parse_month_year_or_default(
                month=request.query_params.get("month"),
                year=request.query_params.get("year"),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_platform_admin:
            queryset = PayrollRun.objects.all()
            if company:
                queryset = queryset.filter(company=company)
            queryset = queryset.filter(month=month, year=year).select_related("company", "employee", "labor_consultant").order_by(
                "-year",
                "-month",
                "company__name",
                "employee__first_name",
            )
        else:
            queryset = get_consultant_payroll_overview(
                consultant=request.user,
                company=company,
                month=month,
                year=year,
            )
        return Response(
            {
                "month": month,
                "year": year,
                "company_id": str(company.id) if company else None,
                "runs": PayrollRunSerializer(queryset, many=True, context={"request": request}).data,
                "summary": get_monthly_payroll_summary(queryset=queryset),
            },
            status=status.HTTP_200_OK,
        )


class PayrollMonthlySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        queryset = get_payroll_queryset_for_user(request.user)
        try:
            month, year = parse_month_year_or_default(
                month=request.query_params.get("month"),
                year=request.query_params.get("year"),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        queryset = queryset.filter(month=month, year=year)
        company_id = request.query_params.get("company_id")
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        rows = get_monthly_payroll_summary(queryset=queryset)
        serializer = PayrollMonthlySummaryRowSerializer(rows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PayrollAssistantView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        role = request.query_params.get("role") or request.user.role

        try:
            month, year = parse_month_year_or_default(
                month=request.query_params.get("month"),
                year=request.query_params.get("year"),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        company = _resolve_company_for_request(request, company_id=request.query_params.get("company_id"))
        queryset = get_payroll_queryset_for_user(request.user).filter(month=month, year=year)

        if company:
            queryset = queryset.filter(company=company)

        counts = {
            "waiting_documents": queryset.filter(status=PayrollRun.StatusChoices.WAITING_DOCUMENTS).count(),
            "in_progress": queryset.filter(status=PayrollRun.StatusChoices.IN_PROGRESS).count(),
            "ready_for_review": queryset.filter(status=PayrollRun.StatusChoices.READY_FOR_REVIEW).count(),
            "approved_by_company": queryset.filter(status=PayrollRun.StatusChoices.APPROVED_BY_COMPANY).count(),
            "delivered_to_employee": queryset.filter(status=PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE).count(),
            "correction_requested": queryset.filter(status=PayrollRun.StatusChoices.CORRECTION_REQUESTED).count(),
        }

        priorities = []

        if role in {User.RoleChoices.LABOR_CONSULTANT, User.RoleChoices.EXTERNAL_CONSULTANT, User.RoleChoices.SAFETY_CONSULTANT, "consultant"}:
            if counts["waiting_documents"]:
                priorities.append(f"{counts['waiting_documents']} lavorazioni bloccate per documenti mancanti.")
            if counts["ready_for_review"]:
                priorities.append(f"{counts['ready_for_review']} payroll pronti da inviare o seguire in revisione.")
            if counts["approved_by_company"]:
                priorities.append(f"{counts['approved_by_company']} payroll possono essere pubblicati ai dipendenti.")
            headline = "Priorità consulente"
            summary = "Il sistema evidenzia aziende bloccate, review aperte e pubblicazioni da completare."
        elif role in {User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN, User.RoleChoices.HR_MANAGER, User.RoleChoices.MANAGER, "company"}:
            if counts["ready_for_review"]:
                priorities.append(f"{counts['ready_for_review']} payroll attendono approvazione aziendale.")
            if counts["correction_requested"]:
                priorities.append(f"{counts['correction_requested']} lavorazioni sono rientrate in correzione.")
            if counts["delivered_to_employee"]:
                priorities.append(f"{counts['delivered_to_employee']} buste paga sono già pubblicate.")
            headline = "Centro approvazione azienda"
            summary = "L'assistente evidenzia cosa approvare, cosa correggere e cosa è già stato pubblicato."
        else:
            if counts["delivered_to_employee"]:
                priorities.append(f"Hai {counts['delivered_to_employee']} buste paga disponibili nel periodo selezionato.")
            headline = "Aggiornamento personale"
            summary = "Vista sintetica delle buste paga disponibili e dello stato delle tue lavorazioni."

        return Response({"headline": headline, "summary": summary, "month": month, "year": year, "priorities": priorities, "counts": counts}, status=status.HTTP_200_OK)

import mimetypes
from calendar import monthrange
from collections import defaultdict
from datetime import date

from django.db import IntegrityError, transaction
from django.db.models import Count
from django.utils import timezone

from .models import (
    AttendancePeriod,
    AuditLog,
    Company,
    Notification,
    ConsultantCompanyLink,
    Document,
    PayrollDocumentLink,
    PayrollRun,
    User,
    UserCompanyAccess,
)
from .services import create_notification, notify_users, log_audit_event
from users.utils.pricing import check_storage_limit


MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024
ALLOWED_DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

PAYROLL_STATUSES_VISIBLE_TO_EMPLOYEE = {
    PayrollRun.StatusChoices.APPROVED_BY_COMPANY,
    PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE,
    PayrollRun.StatusChoices.ARCHIVED,
}

PAYROLL_STATUS_TRANSITIONS = {
    PayrollRun.StatusChoices.DRAFT: {
        PayrollRun.StatusChoices.WAITING_DOCUMENTS,
        PayrollRun.StatusChoices.IN_PROGRESS,
        PayrollRun.StatusChoices.ARCHIVED,
    },
    PayrollRun.StatusChoices.WAITING_DOCUMENTS: {
        PayrollRun.StatusChoices.IN_PROGRESS,
        PayrollRun.StatusChoices.CORRECTION_REQUESTED,
        PayrollRun.StatusChoices.ARCHIVED,
    },
    PayrollRun.StatusChoices.IN_PROGRESS: {
        PayrollRun.StatusChoices.READY_FOR_REVIEW,
        PayrollRun.StatusChoices.CORRECTION_REQUESTED,
        PayrollRun.StatusChoices.ARCHIVED,
    },
    PayrollRun.StatusChoices.READY_FOR_REVIEW: {
        PayrollRun.StatusChoices.APPROVED_BY_COMPANY,
        PayrollRun.StatusChoices.CORRECTION_REQUESTED,
        PayrollRun.StatusChoices.ARCHIVED,
    },
    PayrollRun.StatusChoices.APPROVED_BY_COMPANY: {
        PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE,
        PayrollRun.StatusChoices.ARCHIVED,
    },
    PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE: {
        PayrollRun.StatusChoices.ARCHIVED,
    },
    PayrollRun.StatusChoices.CORRECTION_REQUESTED: {
        PayrollRun.StatusChoices.IN_PROGRESS,
        PayrollRun.StatusChoices.READY_FOR_REVIEW,
        PayrollRun.StatusChoices.ARCHIVED,
    },
    PayrollRun.StatusChoices.ARCHIVED: set(),
}


def parse_month_year_or_default(*, month, year):
    today = timezone.localdate()
    parsed_month = int(month or today.month)
    parsed_year = int(year or today.year)
    if parsed_month < 1 or parsed_month > 12:
        raise ValueError("Mese non valido.")
    if parsed_year < 2000 or parsed_year > 3000:
        raise ValueError("Anno non valido.")
    return parsed_month, parsed_year


def get_month_range(*, month, year):
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end


def _active_company_role_for_company(*, user, company):
    if user.company_id == company.id and getattr(user, "company_role_id", None):
        if user.company_role and user.company_role.company_id == company.id:
            return user.company_role

    access = (
        UserCompanyAccess.objects.filter(user=user, company=company, is_active=True)
        .select_related("company_role")
        .first()
    )
    return access.company_role if access else None


def consultant_link_is_approved(*, consultant, company):
    return ConsultantCompanyLink.objects.filter(
        consultant=consultant,
        company=company,
        status=ConsultantCompanyLink.StatusChoices.APPROVED,
        active=True,
    ).exists()


def user_can_access_company(*, user, company):
    if user.is_platform_admin:
        return True
    if user.company_id == company.id and user.role not in {
        User.RoleChoices.EXTERNAL_CONSULTANT,
        User.RoleChoices.LABOR_CONSULTANT,
        User.RoleChoices.SAFETY_CONSULTANT,
    }:
        return True
    return UserCompanyAccess.objects.filter(
        user=user,
        company=company,
        is_active=True,
    ).exists()


def user_has_permission_for_company(*, user, company, permission_code):
    if user.is_platform_admin:
        return True

    company_role = _active_company_role_for_company(user=user, company=company)
    if not company_role:
        return False

    return company_role.permissions.filter(code=permission_code).exists()


def _user_is_company_payroll_operator(user):
    return user.role in {
        User.RoleChoices.COMPANY_OWNER,
        User.RoleChoices.COMPANY_ADMIN,
        User.RoleChoices.HR_MANAGER,
        User.RoleChoices.MANAGER,
    }


def _user_is_consultant_for_payroll(user):
    return user.role == User.RoleChoices.LABOR_CONSULTANT


def _visibility_allows_user(*, document, user):
    if user.is_platform_admin:
        return True

    visibility = document.visibility
    is_employee_owner = bool(document.employee and document.employee.user_id == user.id)
    is_company_user = bool(user.company_id == document.company_id and _user_is_company_payroll_operator(user))
    is_assigned_consultant = _user_is_consultant_for_payroll(user) and consultant_link_is_approved(
        consultant=user,
        company=document.company,
    )

    if visibility == Document.VisibilityChoices.COMPANY_ONLY:
        return is_company_user
    if visibility == Document.VisibilityChoices.CONSULTANT_ONLY:
        return is_assigned_consultant
    if visibility == Document.VisibilityChoices.COMPANY_AND_CONSULTANT:
        return is_company_user or is_assigned_consultant
    if visibility == Document.VisibilityChoices.EMPLOYEE_ONLY:
        return is_employee_owner
    if visibility == Document.VisibilityChoices.EMPLOYEE_AND_COMPANY:
        return is_employee_owner or is_company_user
    if visibility == Document.VisibilityChoices.EMPLOYEE_COMPANY_CONSULTANT:
        return is_employee_owner or is_company_user or is_assigned_consultant
    return False


def get_document_queryset_for_user(user):
    queryset = Document.objects.select_related("company", "employee", "employee__user", "uploaded_by").order_by(
        "-created_at"
    )

    if user.is_platform_admin:
        return queryset

    if user.role == User.RoleChoices.SAFETY_CONSULTANT:
        return queryset.none()

    if user.role == User.RoleChoices.EMPLOYEE:
        return queryset.filter(
            employee__user=user,
            status=Document.StatusChoices.ACTIVE,
            visibility__in=[
                Document.VisibilityChoices.EMPLOYEE_ONLY,
                Document.VisibilityChoices.EMPLOYEE_AND_COMPANY,
                Document.VisibilityChoices.EMPLOYEE_COMPANY_CONSULTANT,
            ],
        )

    if _user_is_company_payroll_operator(user):
        return queryset.filter(company=user.company).exclude(
            visibility=Document.VisibilityChoices.EMPLOYEE_ONLY
        )

    if _user_is_consultant_for_payroll(user):
        approved_company_ids = ConsultantCompanyLink.objects.filter(
            consultant=user,
            status=ConsultantCompanyLink.StatusChoices.APPROVED,
            active=True,
        ).values_list("company_id", flat=True)
        return queryset.filter(
            company_id__in=approved_company_ids,
            visibility__in=[
                Document.VisibilityChoices.CONSULTANT_ONLY,
                Document.VisibilityChoices.COMPANY_AND_CONSULTANT,
                Document.VisibilityChoices.EMPLOYEE_COMPANY_CONSULTANT,
            ],
        )

    return queryset.none()


def user_can_view_document(*, user, document):
    if document.status == Document.StatusChoices.ARCHIVED and not user.is_platform_admin:
        if user.role == User.RoleChoices.EMPLOYEE:
            return False

    if not user_can_access_company(user=user, company=document.company):
        return False

    return _visibility_allows_user(document=document, user=user)


def user_can_download_document(*, user, document):
    if not user_can_view_document(user=user, document=document):
        return False

    if user.is_platform_admin:
        return True
    if user.role == User.RoleChoices.EMPLOYEE:
        return True

    return user_has_permission_for_company(
        user=user,
        company=document.company,
        permission_code="download-employee-documents",
    ) or user_has_permission_for_company(
        user=user,
        company=document.company,
        permission_code="view-documents",
    )


def user_can_upload_document(*, user, company):
    if user.role == User.RoleChoices.SAFETY_CONSULTANT:
        return False
    if not user_can_access_company(user=user, company=company):
        return False
    if _user_is_consultant_for_payroll(user) and not consultant_link_is_approved(consultant=user, company=company):
        return False
    return user_has_permission_for_company(
        user=user,
        company=company,
        permission_code="upload-documents",
    )


def user_can_archive_document(*, user, document):
    if not user_can_access_company(user=user, company=document.company):
        return False
    if user.role == User.RoleChoices.EMPLOYEE:
        return False
    return user_has_permission_for_company(
        user=user,
        company=document.company,
        permission_code="archive-documents",
    )


def get_payroll_queryset_for_user(user):
    queryset = PayrollRun.objects.select_related(
        "company",
        "employee",
        "employee__user",
        "labor_consultant",
    ).order_by("-year", "-month", "-updated_at")

    if user.is_platform_admin:
        return queryset

    if user.role == User.RoleChoices.SAFETY_CONSULTANT:
        return queryset.none()

    if user.role == User.RoleChoices.EMPLOYEE:
        return queryset.filter(
            employee__user=user,
            status__in=PAYROLL_STATUSES_VISIBLE_TO_EMPLOYEE,
        )

    if _user_is_company_payroll_operator(user):
        return queryset.filter(company=user.company)

    if _user_is_consultant_for_payroll(user):
        approved_company_ids = ConsultantCompanyLink.objects.filter(
            consultant=user,
            status=ConsultantCompanyLink.StatusChoices.APPROVED,
            active=True,
        ).values_list("company_id", flat=True)
        return queryset.filter(company_id__in=approved_company_ids)

    return queryset.none()


def user_can_view_payroll(*, user, payroll_run):
    return get_payroll_queryset_for_user(user).filter(id=payroll_run.id).exists()


def user_can_edit_payroll(*, user, payroll_run):
    if user.role == User.RoleChoices.EMPLOYEE:
        return False
    if user.role == User.RoleChoices.SAFETY_CONSULTANT:
        return False
    if not user_can_view_payroll(user=user, payroll_run=payroll_run):
        return False
    return user_has_permission_for_company(
        user=user,
        company=payroll_run.company,
        permission_code="edit-payroll",
    )


def validate_upload_file(*, upload):
    if not upload:
        raise ValueError("File obbligatorio.")
    if upload.size > MAX_DOCUMENT_SIZE_BYTES:
        raise ValueError("Il file supera la dimensione massima consentita (20MB).")

    mime_type = getattr(upload, "content_type", "") or mimetypes.guess_type(upload.name)[0] or ""
    if mime_type and mime_type not in ALLOWED_DOCUMENT_MIME_TYPES:
        raise ValueError("Tipo file non supportato.")
    return mime_type


def _append_note(existing_value, new_note):
    clean_note = (new_note or "").strip()
    if not clean_note:
        return existing_value
    if not existing_value:
        return clean_note
    return f"{existing_value}\n{clean_note}"


@transaction.atomic
def create_document(
    *,
    actor,
    company,
    upload,
    title,
    category,
    visibility,
    employee=None,
    description="",
    status_value=Document.StatusChoices.ACTIVE,
    metadata=None,
    payroll_run=None,
    workflow_role=PayrollDocumentLink.RoleInWorkflowChoices.ATTACHMENT,
):
    if not user_can_upload_document(user=actor, company=company):
        raise PermissionError("Non hai i permessi per caricare documenti per questa azienda.")

    if employee and employee.company_id != company.id:
        raise ValueError("Il dipendente selezionato non appartiene al tenant.")

    if payroll_run and payroll_run.company_id != company.id:
        raise ValueError("La lavorazione payroll selezionata non appartiene al tenant.")

    # Verifica dimensione file rispetto al limite del piano
    file_size_mb = upload.size / (1024 * 1024)
    can_upload, current_mb, max_mb = check_storage_limit(company, file_size_mb)
    if not can_upload:
        raise ValueError(
            f"Spazio di archiviazione insufficiente. File: {file_size_mb:.1f}MB, "
            f"Disponibile: {max(0, max_mb - current_mb):.1f}MB. "
            f"Rimuovi file esistenti o aggiorna il piano."
        )

    mime_type = validate_upload_file(upload=upload)
    document_metadata = metadata or {}
    document_metadata.setdefault("original_filename", upload.name)

    document = Document.objects.create(
        company=company,
        employee=employee,
        uploaded_by=actor,
        category=category,
        title=title,
        description=description or "",
        file=upload,
        mime_type=mime_type,
        file_size=upload.size,
        visibility=visibility,
        status=status_value,
        metadata=document_metadata,
    )

    # Aggiorna lo storage utilizzato dall'azienda
    company.refresh_from_db()
    company.current_storage_mb = company.current_storage_mb + file_size_mb
    company.save(update_fields=['current_storage_mb', 'updated_at'])

    if payroll_run:
        PayrollDocumentLink.objects.get_or_create(
            payroll_run=payroll_run,
            document=document,
            defaults={"role_in_workflow": workflow_role},
        )

    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.DOCUMENT_UPLOADED,
        description=f"Documento caricato: {document.title}.",
        metadata={
            "document_id": str(document.id),
            "category": document.category,
            "visibility": document.visibility,
            "employee_id": str(employee.id) if employee else None,
            "payroll_run_id": str(payroll_run.id) if payroll_run else None,
        },
    )
    return document


@transaction.atomic
def archive_document(*, actor, document):
    if not user_can_archive_document(user=actor, document=document):
        raise PermissionError("Non hai i permessi per archiviare questo documento.")

    # Calcola la dimensione del file da liberare
    file_size_mb = document.file_size / (1024 * 1024) if document.file_size else 0

    document.status = Document.StatusChoices.ARCHIVED
    document.archived_at = timezone.now()
    document.save(update_fields=["status", "archived_at", "updated_at"])

    # Libera lo storage dell'azienda
    if file_size_mb > 0:
        company = document.company
        company.current_storage_mb = max(0, company.current_storage_mb - file_size_mb)
        company.save(update_fields=['current_storage_mb', 'updated_at'])

    log_audit_event(
        actor=actor,
        company=document.company,
        action=AuditLog.ActionChoices.DOCUMENT_ARCHIVED,
        description=f"Documento archiviato: {document.title}.",
        metadata={"document_id": str(document.id)},
    )
    return document


def validate_payroll_transition(*, payroll_run, target_status):
    allowed_next = PAYROLL_STATUS_TRANSITIONS.get(payroll_run.status, set())
    if target_status not in allowed_next:
        raise ValueError(
            f"Transizione non valida: da {payroll_run.status} a {target_status}."
        )


@transaction.atomic
def create_payroll_run(
    *,
    actor,
    company,
    employee,
    month,
    year,
    labor_consultant=None,
    notes_company="",
    notes_consultant="",
    period_reference="",
    metadata=None,
):
    if employee.company_id != company.id:
        raise ValueError("Il dipendente selezionato non appartiene al tenant.")
    if not user_can_access_company(user=actor, company=company):
        raise PermissionError("Tenant non accessibile.")
    if not user_has_permission_for_company(
        user=actor,
        company=company,
        permission_code="create-payroll",
    ):
        raise PermissionError("Non hai i permessi per creare payroll.")

    if labor_consultant and labor_consultant.role != User.RoleChoices.LABOR_CONSULTANT:
        raise ValueError("Il consulente selezionato non e' un labor consultant.")
    if labor_consultant and not consultant_link_is_approved(consultant=labor_consultant, company=company):
        raise ValueError("Il labor consultant non e' collegato con approvazione alla societa'.")

    period = AttendancePeriod.objects.filter(company=company, month=month, year=year).first()
    if not period or period.status not in {
        AttendancePeriod.StatusChoices.APPROVED,
        AttendancePeriod.StatusChoices.CLOSED,
        AttendancePeriod.StatusChoices.EXPORTED,
    }:
        raise ValueError("Impossibile creare il payroll: le presenze mensili non sono ancora approvate dall'azienda.")


    try:
        payroll_run = PayrollRun.objects.create(
            company=company,
            employee=employee,
            labor_consultant=labor_consultant,
            month=month,
            year=year,
            status=PayrollRun.StatusChoices.DRAFT,
            notes_company=notes_company or "",
            notes_consultant=notes_consultant or "",
            period_reference=period_reference or "",
            metadata=metadata or {},
        )
    except IntegrityError as exc:
        raise ValueError("Esiste gia' una lavorazione payroll per dipendente e periodo.") from exc

    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.PAYROLL_CREATED,
        description=f"Payroll creato per {employee.full_name or employee.employee_code} ({month:02d}/{year}).",
        metadata={
            "payroll_run_id": str(payroll_run.id),
            "employee_id": str(employee.id),
            "month": month,
            "year": year,
            "labor_consultant_id": str(labor_consultant.id) if labor_consultant else None,
        },
    )
    return payroll_run


@transaction.atomic
def update_payroll_run(*, actor, payroll_run, payload):
    if not user_can_edit_payroll(user=actor, payroll_run=payroll_run):
        raise PermissionError("Non hai i permessi per modificare questa lavorazione payroll.")
    if payroll_run.status == PayrollRun.StatusChoices.ARCHIVED and not actor.is_platform_admin:
        raise ValueError("Le lavorazioni archiviate non sono modificabili.")

    labor_consultant = payload.get("labor_consultant")
    if labor_consultant:
        if labor_consultant.role != User.RoleChoices.LABOR_CONSULTANT:
            raise ValueError("Il consulente selezionato non e' un labor consultant.")
        if not consultant_link_is_approved(consultant=labor_consultant, company=payroll_run.company):
            raise ValueError("Il labor consultant non e' collegato con approvazione alla societa'.")
        payroll_run.labor_consultant = labor_consultant

    for field in ["notes_company", "notes_consultant", "period_reference", "metadata"]:
        if field in payload:
            setattr(payroll_run, field, payload[field] or "")

    payroll_run.save()
    return payroll_run


@transaction.atomic
def change_payroll_status(*, actor, payroll_run, target_status, note=""):
    if not user_can_view_payroll(user=actor, payroll_run=payroll_run):
        raise PermissionError("Non puoi accedere a questa lavorazione payroll.")
    validate_payroll_transition(payroll_run=payroll_run, target_status=target_status)

    company = payroll_run.company
    permission_code = "edit-payroll"
    action = AuditLog.ActionChoices.PAYROLL_STATUS_CHANGED
    description = (
        f"Stato payroll aggiornato per {payroll_run.employee.full_name or payroll_run.employee.employee_code}: "
        f"{payroll_run.status} -> {target_status}."
    )
    metadata = {
        "payroll_run_id": str(payroll_run.id),
        "from_status": payroll_run.status,
        "to_status": target_status,
    }

    if target_status == PayrollRun.StatusChoices.APPROVED_BY_COMPANY:
        permission_code = "approve-payroll"
        action = AuditLog.ActionChoices.PAYROLL_APPROVED
    elif target_status == PayrollRun.StatusChoices.CORRECTION_REQUESTED:
        permission_code = "request-payroll-correction"
        action = AuditLog.ActionChoices.PAYROLL_CORRECTION_REQUESTED
    elif target_status == PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE:
        permission_code = "deliver-payroll"
        action = AuditLog.ActionChoices.PAYROLL_DELIVERED

    if not user_has_permission_for_company(
        user=actor,
        company=company,
        permission_code=permission_code,
    ):
        raise PermissionError("Permessi insufficienti per la transizione richiesta.")

    if target_status == PayrollRun.StatusChoices.APPROVED_BY_COMPANY and _user_is_consultant_for_payroll(actor):
        raise PermissionError("L'approvazione aziendale deve essere eseguita da un utente aziendale.")

    if target_status in {
        PayrollRun.StatusChoices.IN_PROGRESS,
        PayrollRun.StatusChoices.READY_FOR_REVIEW,
    } and not (actor.is_platform_admin or _user_is_consultant_for_payroll(actor) or _user_is_company_payroll_operator(actor)):
        raise PermissionError("Transizione non consentita per il tuo ruolo.")

    payroll_run.status = target_status
    if target_status == PayrollRun.StatusChoices.APPROVED_BY_COMPANY:
        payroll_run.approved_at = timezone.now()
    if target_status == PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE:
        payroll_run.delivered_at = timezone.now()

    if note:
        if _user_is_consultant_for_payroll(actor):
            payroll_run.notes_consultant = _append_note(payroll_run.notes_consultant, note)
        else:
            payroll_run.notes_company = _append_note(payroll_run.notes_company, note)
        metadata["note"] = note

    payroll_run.save()

    log_audit_event(
        actor=actor,
        company=company,
        action=action,
        description=description,
        metadata=metadata,
    )

    company_users = list(User.objects.filter(company=company, is_active=True).exclude(role=User.RoleChoices.EMPLOYEE))
    consultant_user = payroll_run.labor_consultant
    employee_user = getattr(payroll_run.employee, "user", None)

    if target_status == PayrollRun.StatusChoices.READY_FOR_REVIEW:
        notify_users(
            users=company_users,
            title="Payroll pronto per revisione",
            message=f"La lavorazione payroll di {payroll_run.employee.full_name or payroll_run.employee.employee_code} per {payroll_run.month:02d}/{payroll_run.year} attende revisione aziendale.",
            notification_type=Notification.TypeChoices.ATTENTION,
            priority=Notification.PriorityChoices.HIGH,
            action_url=f"/company/payroll/{payroll_run.id}",
            metadata={"payroll_run_id": str(payroll_run.id), "status": target_status},
        )
    elif target_status == PayrollRun.StatusChoices.APPROVED_BY_COMPANY and consultant_user:
        create_notification(
            user=consultant_user,
            title="Payroll approvato dall'azienda",
            message=f"L'azienda ha approvato la lavorazione payroll di {payroll_run.employee.full_name or payroll_run.employee.employee_code}. Puoi pubblicare la busta paga.",
            notification_type=Notification.TypeChoices.SUCCESS,
            priority=Notification.PriorityChoices.HIGH,
            action_url=f"/consultant/payroll/{payroll_run.id}",
            metadata={"payroll_run_id": str(payroll_run.id), "status": target_status},
        )
    elif target_status == PayrollRun.StatusChoices.CORRECTION_REQUESTED and consultant_user:
        create_notification(
            user=consultant_user,
            title="Correzione richiesta sul payroll",
            message=f"L'azienda ha richiesto una correzione per la lavorazione payroll di {payroll_run.employee.full_name or payroll_run.employee.employee_code}.",
            notification_type=Notification.TypeChoices.WARNING,
            priority=Notification.PriorityChoices.HIGH,
            action_url=f"/consultant/payroll/{payroll_run.id}",
            metadata={"payroll_run_id": str(payroll_run.id), "status": target_status},
        )
    elif target_status == PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE:
        notify_users(
            users=[employee_user, consultant_user],
            title="Busta paga pubblicata",
            message=f"La busta paga di {payroll_run.month:02d}/{payroll_run.year} è stata pubblicata ed è disponibile.",
            notification_type=Notification.TypeChoices.SUCCESS,
            priority=Notification.PriorityChoices.MEDIUM,
            action_url="/employee/payslips",
            metadata={"payroll_run_id": str(payroll_run.id), "status": target_status},
        )
        notify_users(
            users=company_users,
            title="Payroll pubblicato",
            message=f"La busta paga di {payroll_run.employee.full_name or payroll_run.employee.employee_code} è stata pubblicata.",
            notification_type=Notification.TypeChoices.INFO,
            priority=Notification.PriorityChoices.MEDIUM,
            action_url=f"/company/payroll/{payroll_run.id}",
            metadata={"payroll_run_id": str(payroll_run.id), "status": target_status},
        )

    return payroll_run


@transaction.atomic
def attach_document_to_payroll(*, actor, payroll_run, document, workflow_role):
    if not user_can_edit_payroll(user=actor, payroll_run=payroll_run):
        raise PermissionError("Non hai i permessi per collegare documenti a questa lavorazione.")
    if not user_can_view_document(user=actor, document=document):
        raise PermissionError("Non hai accesso al documento selezionato.")
    if document.company_id != payroll_run.company_id:
        raise ValueError("Documento e payroll non appartengono allo stesso tenant.")

    PayrollDocumentLink.objects.get_or_create(
        payroll_run=payroll_run,
        document=document,
        defaults={"role_in_workflow": workflow_role},
    )
    return payroll_run


def get_company_payroll_overview(*, company, month, year):
    queryset = PayrollRun.objects.filter(company=company, month=month, year=year)
    status_counts = queryset.values("status").annotate(total=Count("id")).order_by("status")
    return {
        "company_id": str(company.id),
        "company_name": company.name,
        "month": month,
        "year": year,
        "status_counts": list(status_counts),
        "total_runs": queryset.count(),
        "runs": list(queryset.select_related("employee", "labor_consultant").order_by("employee__first_name", "employee__last_name")),
    }


def get_consultant_payroll_overview(*, consultant, company=None, month=None, year=None):
    approved_company_ids = ConsultantCompanyLink.objects.filter(
        consultant=consultant,
        status=ConsultantCompanyLink.StatusChoices.APPROVED,
        active=True,
    ).values_list("company_id", flat=True)
    queryset = PayrollRun.objects.filter(company_id__in=approved_company_ids)

    if company:
        queryset = queryset.filter(company=company)
    if month:
        queryset = queryset.filter(month=month)
    if year:
        queryset = queryset.filter(year=year)

    return queryset.select_related("company", "employee", "labor_consultant").order_by(
        "-year",
        "-month",
        "company__name",
        "employee__first_name",
    )


def get_monthly_payroll_summary(*, queryset):
    grouped = defaultdict(
        lambda: {
            "employee_id": "",
            "employee_name": "",
            "month": None,
            "year": None,
            "runs": 0,
            "approved_runs": 0,
            "delivered_runs": 0,
            "archived_runs": 0,
            "documents_count": 0,
        }
    )

    runs_with_documents = queryset.prefetch_related("document_links")
    for run in runs_with_documents:
        key = (run.employee_id, run.month, run.year, run.company_id)
        bucket = grouped[key]
        bucket["employee_id"] = str(run.employee_id)
        bucket["employee_name"] = run.employee.full_name or run.employee.employee_code
        bucket["month"] = run.month
        bucket["year"] = run.year
        bucket["runs"] += 1
        bucket["documents_count"] += run.document_links.count()
        if run.status == PayrollRun.StatusChoices.APPROVED_BY_COMPANY:
            bucket["approved_runs"] += 1
        if run.status == PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE:
            bucket["delivered_runs"] += 1
        if run.status == PayrollRun.StatusChoices.ARCHIVED:
            bucket["archived_runs"] += 1

    return list(grouped.values())

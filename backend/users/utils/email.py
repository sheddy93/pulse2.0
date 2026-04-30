"""
PulseHR - Email Utility Functions
================================

Helper functions for sending HTML emails using Django's email system.
Supports rendering of HTML templates with context variables.

Functions:
- send_verification_email: Send email verification link
- send_password_reset_email: Send password reset link
- send_welcome_email: Send welcome email to new users
- send_leave_request_notification: Notify managers of leave requests

@author: PulseHR Team
@version: 1.0.0
"""

import logging
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend
from django.template.loader import render_to_string
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)


def get_email_backend():
    """
    Get the configured email backend.
    
    In development (DEBUG=True), returns console backend for testing.
    In production, returns the configured SMTP backend.
    
    Returns:
        Email backend instance
    """
    backend_path = settings.EMAIL_BACKEND
    
    if 'console' in backend_path.lower():
        return ConsoleEmailBackend()
    
    # For SMTP backends, Django handles instantiation
    return None


def render_email_template(template_name, context):
    """
    Render an HTML email template with context.
    
    Args:
        template_name: Template path relative to EMAIL_TEMPLATE_PREFIX
        context: Dictionary of context variables
        
    Returns:
        Rendered HTML string
    """
    full_template = f"{settings.EMAIL_TEMPLATE_PREFIX}{template_name}"
    return render_to_string(full_template, context)


def send_email(subject, html_message, recipient_list, text_message=None):
    """
    Send an HTML email with fallback to text.
    
    Args:
        subject: Email subject line
        html_message: HTML content
        recipient_list: List of recipient email addresses
        text_message: Optional plain text fallback
        
    Returns:
        True if sent successfully, False otherwise
    """
    try:
        send_mail(
            subject=subject,
            message=text_message or html_message,  # Fallback to HTML if no text
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=not settings.DEBUG,
        )
        logger.info(f"Email sent successfully to {recipient_list}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_list}: {str(e)}")
        if settings.DEBUG:
            logger.warning(f"Email sending failed in DEBUG mode. Subject: {subject}")
        return False


def send_verification_email(user, request=None):
    """
    Send email verification link to a user.
    
    Generates a unique token, builds verification URL, and sends
    HTML email with the verification link.
    
    Args:
        user: User model instance
        request: Optional HTTP request for building absolute URLs
        
    Returns:
        True if sent successfully, False otherwise
    """
    # Generate token
    token = default_token_generator.make_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Build verification link
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:3000')
    verification_link = f"{frontend_url}/verify-email?token={uidb64}-{token}"
    
    # Prepare context
    context = {
        'user_name': user.first_name or user.email.split('@')[0],
        'verification_link': verification_link,
    }
    
    # Render template
    html_content = render_email_template('verify_email.html', context)
    
    # Send email
    subject = "PulseHR - Verifica il tuo indirizzo email"
    return send_email(subject, html_content, [user.email])


def send_password_reset_email(user, request=None):
    """
    Send password reset link to a user.
    
    Generates a unique token, builds reset URL, and sends
    HTML email with the password reset link.
    
    Args:
        user: User model instance
        request: Optional HTTP request for building absolute URLs
        
    Returns:
        True if sent successfully, False otherwise
    """
    # Generate token
    token = default_token_generator.make_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Build reset link
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:3000')
    reset_link = f"{frontend_url}/reset-password?token={uidb64}-{token}"
    
    # Prepare context
    context = {
        'user_name': user.first_name or user.email.split('@')[0],
        'reset_link': reset_link,
    }
    
    # Render template
    html_content = render_email_template('password_reset.html', context)
    
    # Send email
    subject = "PulseHR - Reimposta la tua password"
    return send_email(subject, html_content, [user.email])


def send_welcome_email(user, company=None):
    """
    Send welcome email to a new user.
    
    Includes onboarding steps and dashboard link.
    
    Args:
        user: User model instance
        company: Optional Company model instance
        
    Returns:
        True if sent successfully, False otherwise
    """
    # Build dashboard link
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:3000')
    dashboard_link = f"{frontend_url}/dashboard"
    
    # Prepare context
    context = {
        'user_name': user.first_name or user.email.split('@')[0],
        'company_name': company.name if company else '',
        'dashboard_link': dashboard_link,
    }
    
    # Render template
    html_content = render_email_template('welcome.html', context)
    
    # Send email
    subject = "Benvenuto su PulseHR!"
    return send_email(subject, html_content, [user.email])


def send_leave_request_notification(leave_request, managers):
    """
    Notify managers of a new leave request.
    
    Sends HTML email to each manager with leave request details
    and approve/reject action links.
    
    Args:
        leave_request: LeaveRequest model instance
        managers: QuerySet or list of User model instances (managers)
        
    Returns:
        Number of emails sent successfully
    """
    if not managers:
        logger.warning("No managers provided for leave request notification")
        return 0
    
    # Build links
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:3000')
    approve_link = f"{frontend_url}/leave-requests/{leave_request.id}/approve"
    reject_link = f"{frontend_url}/leave-requests/{leave_request.id}/reject"
    
    # Get employee name
    employee_name = leave_request.user.get_full_name() or leave_request.user.email
    
    # Prepare context
    context = {
        'employee_name': employee_name,
        'leave_type': leave_request.leave_type,
        'start_date': leave_request.start_date.strftime('%d/%m/%Y'),
        'end_date': leave_request.end_date.strftime('%d/%m/%Y'),
        'total_days': leave_request.total_days,
        'notes': leave_request.notes or '',
        'approve_link': approve_link,
        'reject_link': reject_link,
    }
    
    # Render template once
    html_content = render_email_template('leave_request_notification.html', context)
    subject = f"PulseHR - Nuova richiesta ferie da {employee_name}"
    
    # Send to each manager
    sent_count = 0
    for manager in managers:
        # Add manager-specific context
        manager_context = {**context, 'manager_name': manager.first_name or manager.email.split('@')[0]}
        manager_html = render_email_template('leave_request_notification.html', manager_context)
        
        if send_email(subject, manager_html, [manager.email]):
            sent_count += 1
    
    return sent_count


def send_test_email(recipient_email):
    """
    Send a test email to verify SMTP configuration.
    
    Args:
        recipient_email: Email address to send test to
        
    Returns:
        True if sent successfully, False otherwise
    """
    context = {
        'user_name': 'Test User',
        'verification_link': f"{getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:3000')}/test",
    }
    
    html_content = render_email_template('verify_email.html', context)
    subject = "PulseHR - Test Email Configuration"
    
    return send_email(subject, html_content, [recipient_email])

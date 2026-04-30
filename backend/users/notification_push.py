"""
Sistema notifiche push con Firebase Cloud Messaging
"""
from django.conf import settings
import logging
import json
import requests

logger = logging.getLogger(__name__)

class FirebasePushNotification:
    """Gestione notifiche push Firebase"""
    
    def __init__(self):
        self.server_key = getattr(settings, 'FCM_SERVER_KEY', None)
        self.api_url = "https://fcm.googleapis.com/fcm/send"
    
    def send_to_token(self, token, title, body, data=None, badge=None):
        """
        Invia notifica a un singolo dispositivo
        
        Args:
            token: FCM device token
            title: Titolo notifica
            body: Corpo notifica
            data: Dati extra opzionali
            badge: Numero badge opzionale
        """
        if not self.server_key:
            logger.warning("FCM_SERVER_KEY not configured")
            return False
        
        headers = {
            "Authorization": f"key={self.server_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "to": token,
            "notification": {
                "title": title,
                "body": body,
                "sound": "default",
                "badge": badge or 1
            },
            "data": data or {}
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
            result = response.json()
            
            if result.get('success', 0) > 0:
                logger.info(f"Push sent successfully to {token[:20]}...")
                return True
            else:
                logger.error(f"Push failed: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Push error: {e}")
            return False
    
    def send_to_topic(self, topic, title, body, data=None):
        """
        Invia a tutti i dispositivi iscritti a un topic
        """
        if not self.server_key:
            return False
        
        headers = {
            "Authorization": f"key={self.server_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "to": f"/topics/{topic}",
            "notification": {
                "title": title,
                "body": body
            },
            "data": data or {}
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
            return response.json().get('success', 0) > 0
        except Exception as e:
            logger.error(f"Topic push error: {e}")
            return False

class PushNotificationService:
    """Servizio di alto livello per notifiche push"""
    
    @staticmethod
    def notify_new_payroll(employee_profile, payroll_month):
        """Notifica dipendente di nuova busta paga"""
        from .models import UserDeviceToken
        
        push = FirebasePushNotification()
        
        for device in UserDeviceToken.objects.filter(user=employee_profile.user, is_active=True):
            push.send_to_token(
                token=device.fcm_token,
                title="Nuova busta paga",
                body=f"La busta paga di {payroll_month} è disponibile",
                data={
                    "type": "payroll",
                    "action": "view",
                    "payroll_month": payroll_month
                }
            )
    
    @staticmethod
    def notify_leave_request_status(employee, leave_request, status):
        """Notifica stato richiesta ferie"""
        from .models import UserDeviceToken
        
        push = FirebasePushNotification()
        
        status_text = {
            'approved': 'approvata',
            'rejected': 'rifiutata',
            'pending': 'in attesa di approvazione'
        }
        
        for device in UserDeviceToken.objects.filter(user=employee, is_active=True):
            push.send_to_token(
                token=device.fcm_token,
                title="Richiesta ferie",
                body=f"La tua richiesta è stata {status_text.get(status, status)}",
                data={
                    "type": "leave",
                    "action": "view",
                    "leave_id": str(leave_request.id)
                }
            )
    
    @staticmethod
    def notify_safety_course_reminder(employee_profile, course):
        """Reminder corso sicurezza in scadenza"""
        from .models import UserDeviceToken
        
        push = FirebasePushNotification()
        
        for device in UserDeviceToken.objects.filter(user=employee_profile.user, is_active=True):
            push.send_to_token(
                token=device.fcm_token,
                title="Corso in scadenza",
                body=f"Ricorda di completare '{course.title}'",
                data={
                    "type": "safety",
                    "action": "course",
                    "course_id": str(course.id)
                },
                badge=1
            )
    
    @staticmethod
    def notify_consultant_new_company(consultant, company):
        """Notifica consulente di nuova richiesta azienda"""
        from .models import UserDeviceToken
        
        push = FirebasePushNotification()
        
        for device in UserDeviceToken.objects.filter(user=consultant, is_active=True):
            push.send_to_token(
                token=device.fcm_token,
                title="Nuova richiesta azienda",
                body=f"L'azienda {company.name} ha richiesto il tuo servizio",
                data={
                    "type": "consultant",
                    "action": "view_request",
                    "company_id": str(company.id)
                },
                badge=1
            )
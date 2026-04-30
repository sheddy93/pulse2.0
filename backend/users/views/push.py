"""
API per gestione token push e notifiche
"""
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserDeviceToken

class DeviceTokenView(APIView):
    """Registrazione token dispositivo"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Registra token FCM
        POST /api/push/register/
        {
            "fcm_token": "xxx",
            "device_type": "ios|android|web",
            "device_name": "iPhone di Mario"
        }
        """
        token = request.data.get('fcm_token')
        device_type = request.data.get('device_type', 'web')
        device_name = request.data.get('device_name', '')
        
        if not token:
            return Response({"detail": "Token richiesto"}, status=400)
        
        # Upsert token
        UserDeviceToken.objects.update_or_create(
            user=request.user,
            fcm_token=token,
            defaults={
                'device_type': device_type,
                'device_name': device_name,
                'is_active': True,
                'last_used_at': timezone.now()
            }
        )
        
        return Response({"status": "registered"})
    
    def delete(self, request):
        """Rimuovi token"""
        token = request.data.get('fcm_token')
        
        if token:
            UserDeviceToken.objects.filter(
                user=request.user,
                fcm_token=token
            ).delete()
        
        return Response({"status": "removed"})

class PushTestView(APIView):
    """Test invio notifica"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Invia notifica test al proprio dispositivo"""
        from .notification_push import FirebasePushNotification
        
        push = FirebasePushNotification()
        tokens = UserDeviceToken.objects.filter(user=request.user, is_active=True)
        
        if not tokens.exists():
            return Response({"detail": "Nessun dispositivo registrato"}, status=400)
        
        sent = 0
        for device in tokens:
            if push.send_to_token(
                device.fcm_token,
                title="Test PulseHR",
                body="Questa è una notifica di test!",
                data={"test": True}
            ):
                sent += 1
        
        return Response({
            "sent": sent,
            "total_devices": tokens.count()
        })
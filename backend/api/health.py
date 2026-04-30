"""
Health Check API Endpoint per Railway.
Verifica che il servizio sia attivo e funzionante.
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import os


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint per Railway deployment.
    Verifica: Database, Cache, Environment.
    """
    health_status = {
        'status': 'healthy',
        'service': 'pulsehr-backend',
        'version': '1.0.0',
        'environment': os.getenv('DJANGO_ENV', 'production'),
        'checks': {}
    }
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        health_status['checks']['database'] = 'connected'
    except Exception as e:
        health_status['checks']['database'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'
    
    # Check cache connection
    try:
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['checks']['cache'] = 'connected'
        else:
            health_status['checks']['cache'] = 'degraded'
    except Exception as e:
        health_status['checks']['cache'] = f'error: {str(e)}'
        # Cache failure is not critical
    
    # Check environment variables
    critical_vars = ['SECRET_KEY', 'ALLOWED_HOSTS']
    missing_vars = [v for v in critical_vars if not os.getenv(v)]
    if missing_vars:
        health_status['checks']['environment'] = f'missing: {missing_vars}'
        health_status['status'] = 'degraded'
    else:
        health_status['checks']['environment'] = 'configured'
    
    # Return appropriate HTTP status
    status_code = 200 if health_status['status'] == 'healthy' else 503
    
    return JsonResponse(health_status, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness probe per Kubernetes-style deployments.
    Verifica che il servizio sia pronto a ricevere traffico.
    """
    try:
        # Verify database is reachable
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        
        return JsonResponse({
            'ready': True,
            'message': 'Service is ready to accept traffic'
        })
    except Exception as e:
        return JsonResponse({
            'ready': False,
            'message': f'Service not ready: {str(e)}'
        }, status=503)


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check(request):
    """
    Liveness probe - indica se il processo è vivo.
    """
    return JsonResponse({
        'alive': True,
        'pid': os.getpid()
    })
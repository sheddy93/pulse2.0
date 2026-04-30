"""
Utility per geolocalizzazione e geofencing
"""
from math import radians, sin, cos, sqrt, atan2
from decimal import Decimal


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calcola distanza in metri tra due coordinate
    usando la formula di Haversine
    """
    R = 6371000  # Raggio Terra in metri

    lat1_rad = radians(float(lat1))
    lat2_rad = radians(float(lat2))
    delta_lat = radians(float(lat2) - float(lat1))
    delta_lon = radians(float(lon2) - float(lon1))

    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return R * c


def is_within_geofence(check_lat, check_lon, office_lat, office_lon, radius_meters):
    """
    Verifica se un punto e dentro il geofence
    """
    distance = haversine_distance(check_lat, check_lon, office_lat, office_lon)
    return distance <= radius_meters


def find_nearest_office(company, lat, lon):
    """
    Trova l'ufficio piu vicino all'interno del raggio
    """
    from .models import OfficeLocation

    offices = OfficeLocation.objects.filter(
        company=company,
        is_geofence_enabled=True,
latitude__isnull=False,
        longitude__isnull=False
    )

    for office in offices:
        if is_within_geofence(lat, lon, office.latitude, office.longitude, office.radius_meters):
            return office

    return None


def get_location_accuracy_description(meters):
    """
    Descrive l'accuratezza in modo leggibile
    """
    if meters <= 10:
        return "Ottima"
    elif meters <= 50:
        return "Buona"
    elif meters <= 100:
        return "Discreta"
    elif meters <= 500:
        return "Bassa"
    else:
        return "Molto bassa"

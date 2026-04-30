"""
API views per geolocalizzazione e geofencing
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from users.models import TimeEntry, OfficeLocation
from users.utils.geolocation import (
    haversine_distance,
    is_within_geofence,
    find_nearest_office,
    get_location_accuracy_description
)


class GeoLocationView(APIView):
    """API per gestione geolocalizzazione"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Registra posizione per check-in
        POST /api/time/check-in/ con:
        {
            "latitude": 41.9028,
            "longitude": 12.4964,
            "accuracy": 10.5,
            "source": "gps"
        }
        """
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        accuracy = request.data.get('accuracy', 100)
        source = request.data.get('source', 'gps')

        if not lat or not lon:
            return Response(
                {"detail": "Coordinate GPS richieste"},
                status=400
            )

        # Trova ufficio piu vicino
        company = request.user.company
        nearest_office = find_nearest_office(company, lat, lon)

        result = {
            "latitude": lat,
            "longitude": lon,
            "accuracy": accuracy,
            "source": source,
            "nearest_office": None,
            "is_within_geofence": nearest_office is not None,
        }

        if nearest_office:
            result["nearest_office"] = {
                "id": str(nearest_office.id),
                "name": nearest_office.name,
                "distance_meters": haversine_distance(
                    lat, lon,
                    nearest_office.latitude,
                    nearest_office.longitude
                )
            }

        return Response(result)


class OfficeLocationsView(APIView):
    """Gestione sedi con geofence"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista sedi con coordinate"""
        company = request.user.company
        offices = OfficeLocation.objects.filter(company=company)

        return Response([{
            "id": str(o.id),
            "name": o.name,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "radius_meters": o.radius_meters,
            "is_geofence_enabled": o.is_geofence_enabled,
            "address": o.address_line_1,
        } for o in offices])

    def post(self, request):
        """Crea/modifica sede con geofence"""
        company = request.user.company

        office_id = request.data.get('id')
        name = request.data.get('name')
        address_line_1 = request.data.get('address_line_1', '')
        city = request.data.get('city', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        radius_meters = request.data.get('radius_meters', 100)
        is_geofence_enabled = request.data.get('is_geofence_enabled', False)

        if not name:
            return Response(
                {"detail": "Nome sede richiesto"},
                status=400
            )

        if office_id:
            # Update existing
            try:
                office = OfficeLocation.objects.get(id=office_id, company=company)
            except OfficeLocation.DoesNotExist:
                return Response(
                    {"detail": "Sede non trovata"},
                    status=404
                )
        else:
            # Create new
            office = OfficeLocation(company=company)

        office.name = name
        office.address_line_1 = address_line_1
        office.city = city
        office.latitude = latitude
        office.longitude = longitude
        office.radius_meters = radius_meters
        office.is_geofence_enabled = is_geofence_enabled
        office.save()

        return Response({
            "id": str(office.id),
            "name": office.name,
            "latitude": office.latitude,
            "longitude": office.longitude,
            "radius_meters": office.radius_meters,
            "is_geofence_enabled": office.is_geofence_enabled,
            "address": office.address_line_1,
        })


class GPSHistoryView(APIView):
    """Storico posizioni check-in"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Mostra storico GPS per dipendente"""
        employee_id = request.query_params.get('employee_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        limit = request.query_params.get('limit', 100)

        entries = TimeEntry.objects.filter(
            company=request.user.company,
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('employee_profile', 'user')

        if employee_id:
            entries = entries.filter(employee_profile_id=employee_id)

        if date_from:
            entries = entries.filter(timestamp__gte=date_from)

        if date_to:
            entries = entries.filter(timestamp__lte=date_to)

        entries = entries[:int(limit)]

        return Response([{
            "id": str(e.id),
            "employee": e.employee_profile.full_name if e.employee_profile else (e.user.get_full_name() or e.user.email),
            "timestamp": e.timestamp.isoformat(),
            "entry_type": e.entry_type,
            "latitude": e.latitude,
            "longitude": e.longitude,
            "accuracy": e.accuracy_meters,
            "accuracy_description": get_location_accuracy_description(float(e.accuracy_meters)) if e.accuracy_meters else None,
            "location_source": e.location_source,
            "is_within_geofence": e.is_within_geofence,
            "office_location": e.office_location.name if e.office_location else None,
        } for e in entries])


class CheckInWithLocationView(APIView):
    """Check-in con geolocalizzazione"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Check-in con posizione GPS
        POST /api/time/check-in-gps/ con:
        {
            "latitude": 41.9028,
            "longitude": 12.4964,
            "accuracy": 10.5,
            "source": "gps",
            "note": ""
        }
        """
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        accuracy = request.data.get('accuracy', 100)
        source = request.data.get('source', 'gps')
        note = request.data.get('note', '')

        if not lat or not lon:
            return Response(
                {"detail": "Coordinate GPS richieste"},
                status=400
            )

        company = request.user.company
        user = request.user

        # Get employee profile
        employee_profile = None
        if hasattr(user, 'employee_profile'):
            employee_profile = user.employee_profile

        # Find nearest office within geofence
        nearest_office = find_nearest_office(company, lat, lon)
        is_within_geofence = nearest_office is not None

        # Create time entry
        entry = TimeEntry.objects.create(
            user=user,
            company=company,
            employee_profile=employee_profile,
            created_by=user,
            timestamp=timezone.now(),
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.MOBILE,
            note=note,
            latitude=lat,
            longitude=lon,
            accuracy_meters=accuracy,
            location_source=source,
            office_location=nearest_office,
            is_within_geofence=is_within_geofence,
        )

        return Response({
            "id": str(entry.id),
            "timestamp": entry.timestamp.isoformat(),
            "entry_type": entry.entry_type,
            "latitude": entry.latitude,
            "longitude": entry.longitude,
            "accuracy": entry.accuracy_meters,
            "accuracy_description": get_location_accuracy_description(float(accuracy)),
            "location_source": entry.location_source,
            "is_within_geofence": entry.is_within_geofence,
            "office_location": nearest_office.name if nearest_office else None,
            "distance_from_office": haversine_distance(lat, lon, nearest_office.latitude, nearest_office.longitude) if nearest_office else None,
        })


class CheckOutWithLocationView(APIView):
    """Check-out con geolocalizzazione"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Check-out con posizione GPS
        POST /api/time/check-out-gps/ con:
        {
            "latitude": 41.9028,
            "longitude": 12.4964,
            "accuracy": 10.5,
            "source": "gps",
            "note": ""
        }
        """
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        accuracy = request.data.get('accuracy', 100)
        source = request.data.get('source', 'gps')
        note = request.data.get('note', '')

        if not lat or not lon:
            return Response(
                {"detail": "Coordinate GPS richieste"},
                status=400
            )

        company = request.user.company
        user = request.user

        # Get employee profile
        employee_profile = None
        if hasattr(user, 'employee_profile'):
            employee_profile = user.employee_profile

        # Find nearest office within geofence
        nearest_office = find_nearest_office(company, lat, lon)
        is_within_geofence = nearest_office is not None

        # Create time entry
        entry = TimeEntry.objects.create(
            user=user,
            company=company,
            employee_profile=employee_profile,
            created_by=user,
            timestamp=timezone.now(),
            entry_type=TimeEntry.EntryTypeChoices.CHECK_OUT,
            source=TimeEntry.SourceChoices.MOBILE,
            note=note,
            latitude=lat,
            longitude=lon,
            accuracy_meters=accuracy,
            location_source=source,
            office_location=nearest_office,
            is_within_geofence=is_within_geofence,
        )

        return Response({
            "id": str(entry.id),
            "timestamp": entry.timestamp.isoformat(),
            "entry_type": entry.entry_type,
            "latitude": entry.latitude,
            "longitude": entry.longitude,
            "accuracy": entry.accuracy_meters,
            "accuracy_description": get_location_accuracy_description(float(accuracy)),
            "location_source": entry.location_source,
            "is_within_geofence": entry.is_within_geofence,
            "office_location": nearest_office.name if nearest_office else None,
        })

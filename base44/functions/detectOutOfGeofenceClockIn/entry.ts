import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Rileva clock-in fuori geofence e crea alert con workflow
 * Triggerato da automazione su TimeEntry.create
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data: timeEntry } = await req.json();

    if (!timeEntry || !timeEntry.company_id) {
      return Response.json({ error: 'Invalid time entry' }, { status: 400 });
    }

    // Verifica se feature è abilitata
    const companySettings = await base44.asServiceRole.entities.CompanySettings.filter({
      company_id: timeEntry.company_id
    });
    
    const settings = companySettings[0];
    if (!settings?.geofence_alerts_enabled) {
      console.log('Geofence alerts disabled for this company');
      return Response.json({ skipped: true });
    }

    // Solo per check_in (è la richiesta)
    if (timeEntry.type !== 'check_in') {
      return Response.json({ processed: false, reason: 'Not a check_in' });
    }

    // Ottieni location primaria
    const locations = await base44.asServiceRole.entities.CompanyLocation.filter({
      company_id: timeEntry.company_id,
      is_primary: true
    });

    if (!locations[0]) {
      console.log('No primary location found');
      return Response.json({ processed: false });
    }

    const location = locations[0];

    // Ottieni geofence
    const geofences = await base44.asServiceRole.entities.LocationGeofence.filter({
      location_id: location.id
    });

    if (!geofences[0]) {
      return Response.json({ processed: false, reason: 'No geofence' });
    }

    const geofence = geofences[0];
    const empLat = timeEntry.latitude;
    const empLng = timeEntry.longitude;

    // Calcola distanza (semplificato - usa formula approssimata)
    let distanceMeters = 0;
    let isInsideGeofence = false;

    if (geofence.geofence_type === 'circle' && geofence.circle_center) {
      distanceMeters = getDistance(
        empLat,
        empLng,
        geofence.circle_center.latitude,
        geofence.circle_center.longitude
      );
      isInsideGeofence = distanceMeters <= geofence.circle_radius_meters;
    } else if (geofence.geofence_type === 'polygon' && geofence.polygon_coordinates) {
      isInsideGeofence = isPointInPolygon(empLat, empLng, geofence.polygon_coordinates);
      distanceMeters = isInsideGeofence ? 0 : 50; // Approssimativo
    }

    // Se è dentro geofence, niente alert
    if (isInsideGeofence) {
      return Response.json({ processed: true, outside_geofence: false });
    }

    // È FUORI GEOFENCE - crea alert
    const severity = distanceMeters > 1000 ? 'high' : distanceMeters > 500 ? 'medium' : 'low';

    const alert = await base44.asServiceRole.entities.OutOfGeofenceAlert.create({
      company_id: timeEntry.company_id,
      employee_id: timeEntry.employee_id,
      employee_email: timeEntry.user_email,
      employee_name: timeEntry.employee_name,
      location_id: location.id,
      location_name: location.name,
      clock_type: 'check_in',
      employee_latitude: empLat,
      employee_longitude: empLng,
      distance_from_geofence_meters: Math.round(distanceMeters),
      severity,
      status: 'pending',
      timestamp: new Date().toISOString(),
      alert_sent_to: []
    });

    // Inizia workflow di approvazione
    const workflowDefs = await base44.asServiceRole.entities.WorkflowDefinition.filter({
      company_id: timeEntry.company_id,
      request_type: 'geofence_alert'
    });

    let workflowId = null;
    if (workflowDefs[0]) {
      const workflow = await base44.asServiceRole.entities.WorkflowApproval.create({
        company_id: timeEntry.company_id,
        workflow_definition_id: workflowDefs[0].id,
        request_type: 'geofence_alert',
        request_id: alert.id,
        requester_email: timeEntry.user_email,
        requester_name: timeEntry.employee_name,
        current_step: 1,
        total_steps: workflowDefs[0].approval_steps?.length || 1,
        status: 'pending',
        request_data: {
          alert_id: alert.id,
          distance_meters: distanceMeters,
          severity,
          location: location.name
        },
        initiated_at: new Date().toISOString()
      });
      workflowId = workflow.id;
      
      // Aggiorna alert con workflow ID
      await base44.asServiceRole.entities.OutOfGeofenceAlert.update(alert.id, {
        workflow_approval_id: workflowId
      });
    }

    // Invia notifiche all'HR team
    await base44.asServiceRole.functions.invoke('notifyHRGeofenceAlert', {
      alert_id: alert.id,
      employee_name: timeEntry.employee_name,
      location_name: location.name,
      distance_meters: distanceMeters,
      severity,
      workflow_approval_id: workflowId
    });

    console.log(`⚠️ Out-of-geofence alert created: ${alert.id} (${distanceMeters}m away)`);
    return Response.json({ 
      processed: true, 
      outside_geofence: true, 
      alert_id: alert.id,
      workflow_id: workflowId
    });

  } catch (error) {
    console.error('❌ Error in detectOutOfGeofenceClockIn:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Haversine formula - calcola distanza tra due coordinate
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Raggio Terra in metri
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Point-in-polygon test (ray casting)
 */
function isPointInPolygon(lat, lng, coords) {
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i].latitude;
    const yi = coords[i].longitude;
    const xj = coords[j].latitude;
    const yj = coords[j].longitude;

    const intersect = (yi > lng) !== (yj > lng) && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
/**
 * Utility per validazione geofence GPS
 */

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Raggio della Terra in metri
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(rad1) * Math.cos(rad2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distanza in metri
};

export const isPointInPolygon = (point, polygon) => {
  const { latitude, longitude } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;
    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;

    const intersect =
      yi > longitude !== yj > longitude &&
      latitude < ((xj - xi) * (longitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

export const isPointInGeofence = (position, geofence) => {
  if (!geofence || !geofence.is_active) {
    return { valid: false, reason: "no_geofence", distance: null };
  }

  if (geofence.geofence_type === "circle") {
    if (!geofence.circle_center) {
      return { valid: false, reason: "geofence_invalid", distance: null };
    }

    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      geofence.circle_center.latitude,
      geofence.circle_center.longitude
    );

    const valid = distance <= geofence.circle_radius_meters;
    return {
      valid,
      reason: valid ? null : "outside_geofence",
      distance: Math.round(distance)
    };
  }

  if (geofence.geofence_type === "polygon") {
    if (!geofence.polygon_coordinates || geofence.polygon_coordinates.length < 3) {
      return { valid: false, reason: "geofence_invalid", distance: null };
    }

    const valid = isPointInPolygon(position, geofence.polygon_coordinates);
    return {
      valid,
      reason: valid ? null : "outside_geofence",
      distance: null
    };
  }

  return { valid: false, reason: "geofence_invalid", distance: null };
};
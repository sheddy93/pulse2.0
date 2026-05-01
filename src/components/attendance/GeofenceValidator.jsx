import { useState, useEffect } from "react";
import { AlertCircle, MapPin, CheckCircle } from "lucide-react";

/**
 * Valida se una posizione è dentro un geofence (poligono o cerchio)
 * Utilizza ray casting per poligoni e formula Haversine per cerchi
 */
export default function GeofenceValidator({ geofence, location, onValidated, disabled = false }) {
  const [validating, setValidating] = useState(false);
  const [position, setPosition] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  // Calcola distanza tra due coordinate (formula Haversine)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Raggio della Terra in metri
    const rad1 = (lat1 * Math.PI) / 180;
    const rad2 = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(rad1) * Math.cos(rad2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Point in Polygon (Ray Casting Algorithm)
  const isPointInPolygon = (point, polygon) => {
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

  // Valida la posizione
  const validatePosition = (pos) => {
    if (!geofence || !pos) return;

    let valid = false;

    if (geofence.geofence_type === "circle") {
      if (!geofence.circle_center) {
        setError("Configurazione geofence incompleta");
        setIsValid(false);
        return;
      }

      const dist = calculateDistance(
        pos.latitude,
        pos.longitude,
        geofence.circle_center.latitude,
        geofence.circle_center.longitude
      );

      setDistance(Math.round(dist));
      valid = dist <= geofence.circle_radius_meters;
      setIsValid(valid);
      if (!valid) {
        setError(
          `Sei a ${Math.round(dist)}m dal perimetro consentito (${geofence.circle_radius_meters}m)`
        );
      } else {
        setError(null);
      }
    } else if (geofence.geofence_type === "polygon") {
      if (!geofence.polygon_coordinates || geofence.polygon_coordinates.length < 3) {
        setError("Geofence poligono non valido");
        setIsValid(false);
        return;
      }

      valid = isPointInPolygon(pos, geofence.polygon_coordinates);
      setIsValid(valid);
      if (!valid) {
        setError("Sei fuori dal perimetro consentito della sede");
      } else {
        setError(null);
      }
    }

    onValidated(valid ? pos : null);
  };

  // Richiedi posizione GPS
  const requestLocation = async () => {
    if (disabled) return;
    setValidating(true);

    try {
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        (geo) => {
          const pos = {
            latitude: geo.coords.latitude,
            longitude: geo.coords.longitude,
            accuracy: geo.coords.accuracy,
          };
          setPosition(pos);
          validatePosition(pos);
          setError(null);
        },
        (err) => {
          setError(`Errore GPS: ${err.message}`);
          setIsValid(false);
          onValidated(null);
        },
        geoOptions
      );
    } catch (e) {
      setError("Posizionamento geografico non disponibile");
      setIsValid(false);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    if (!geofence) return;
    requestLocation();
  }, [geofence?.id]);

  if (!geofence || !geofence.is_active) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Verifica Posizione Geografica</h3>
          <p className="text-xs text-slate-500 mt-1">Sede: {geofence.location_name}</p>
        </div>
        <button
          onClick={requestLocation}
          disabled={disabled || validating}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {validating ? "Posizionamento..." : "Richiedi Posizione"}
        </button>
      </div>

      {/* Stato */}
      {isValid !== null && (
        <div
          className={`p-3 rounded-lg border flex items-start gap-3 ${
            isValid
              ? "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {isValid ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Posizione Verificata</p>
                <p className="text-sm text-emerald-700 mt-1">
                  Sei all'interno del perimetro consentito.
                  {distance && ` (${distance}m dal centro)`}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Posizione Non Consentita</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Coordinate */}
      {position && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 mb-2">
            <span className="font-semibold">Coordinate Attuali:</span>
          </p>
          <p className="text-xs font-mono text-slate-700">
            {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
            {position.accuracy && (
              <span className="text-slate-500 ml-2">(±{Math.round(position.accuracy)}m)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
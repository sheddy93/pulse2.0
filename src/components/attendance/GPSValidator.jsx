import { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { requestGPSLocation, validateLocation } from '@/lib/gps-utils';

export default function GPSValidator({ location, onValidated, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGetLocation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const position = await requestGPSLocation();
      
      const validation = validateLocation(
        position.latitude,
        position.longitude,
        location.latitude,
        location.longitude,
        location.radius_meters
      );

      setResult({
        ...validation,
        position,
        location: location.name
      });

      onValidated(validation.isValid ? position : null);
    } catch (err) {
      setError(err.message);
      onValidated(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Verifica posizione</h3>
      </div>

      <p className="text-sm text-slate-600">
        Sede: <strong>{location.name}</strong> (raggio consentito: {location.radius_meters}m)
      </p>

      <button
        onClick={handleGetLocation}
        disabled={loading || disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Rilevamento posizione...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            Abilita GPS
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className={`flex items-start gap-2 p-3 rounded-lg ${
          result.isValid 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-orange-50 border border-orange-200'
        }`}>
          {result.isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${result.isValid ? 'text-emerald-700' : 'text-orange-700'}`}>
              {result.message}
            </p>
            {result.position && (
              <p className="text-xs text-slate-500 mt-1">
                Coordinate: {result.position.latitude.toFixed(6)}, {result.position.longitude.toFixed(6)}
                {result.position.accuracy && ` (±${Math.round(result.position.accuracy)}m)`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function GeofenceEditor({ initialGeofence = null, onSave, loading = false }) {
  const [type, setType] = useState(initialGeofence?.geofence_type || "polygon");
  const [coordinates, setCoordinates] = useState(
    initialGeofence?.polygon_coordinates || []
  );
  const [circleCenter, setCircleCenter] = useState(
    initialGeofence?.circle_center || { latitude: 0, longitude: 0 }
  );
  const [radius, setRadius] = useState(initialGeofence?.circle_radius_meters || 500);

  const addCoordinate = () => {
    setCoordinates([
      ...coordinates,
      { latitude: 0, longitude: 0 }
    ]);
  };

  const updateCoordinate = (idx, field, value) => {
    const updated = [...coordinates];
    updated[idx] = { ...updated[idx], [field]: parseFloat(value) || 0 };
    setCoordinates(updated);
  };

  const removeCoordinate = (idx) => {
    setCoordinates(coordinates.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (type === "polygon") {
      if (coordinates.length < 3) {
        toast.error("Un poligono deve avere almeno 3 punti");
        return;
      }
    } else if (type === "circle") {
      if (radius <= 0) {
        toast.error("Il raggio deve essere maggiore di 0");
        return;
      }
    }

    const geofenceData = {
      geofence_type: type,
      polygon_coordinates: type === "polygon" ? coordinates : undefined,
      circle_center: type === "circle" ? circleCenter : undefined,
      circle_radius_meters: type === "circle" ? radius : undefined,
    };

    onSave(geofenceData);
  };

  return (
    <div className="space-y-5">
      {/* Tipo Geofence */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Tipo di Geofence
        </label>
        <div className="flex gap-4">
          {["polygon", "circle"].map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="geofence_type"
                value={t}
                checked={type === t}
                onChange={(e) => setType(e.target.value)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700 capitalize">{t === "polygon" ? "Poligono" : "Cerchio"}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Poligono */}
      {type === "polygon" && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800">Vertici Poligono ({coordinates.length})</p>
            <button
              onClick={addCoordinate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Aggiungi Punto
            </button>
          </div>

          <div className="space-y-2">
            {coordinates.map((coord, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-slate-600 font-semibold">Latitudine</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={coord.latitude}
                    onChange={(e) => updateCoordinate(idx, "latitude", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. 45.46427"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-600 font-semibold">Longitudine</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={coord.longitude}
                    onChange={(e) => updateCoordinate(idx, "longitude", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. 9.18951"
                  />
                </div>
                <button
                  onClick={() => removeCoordinate(idx)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
            <p>
              <strong>💡 Tip:</strong> Inserisci le coordinate in ordine (orario o antiorario).
              Usa Google Maps per ottenere le coordinate.
            </p>
          </div>
        </div>
      )}

      {/* Cerchio */}
      {type === "circle" && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Centro - Latitudine
              </label>
              <input
                type="number"
                step="0.0001"
                value={circleCenter.latitude}
                onChange={(e) =>
                  setCircleCenter({
                    ...circleCenter,
                    latitude: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="es. 45.46427"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Centro - Longitudine
              </label>
              <input
                type="number"
                step="0.0001"
                value={circleCenter.longitude}
                onChange={(e) =>
                  setCircleCenter({
                    ...circleCenter,
                    longitude: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="es. 9.18951"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Raggio (metri)
            </label>
            <input
              type="number"
              min="10"
              step="50"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="es. 500"
            />
            <p className="text-xs text-slate-600 mt-2">Raggio attuale: <strong>{radius}m</strong></p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
      >
        {loading ? "Salvataggio..." : "Salva Geofence"}
      </button>
    </div>
  );
}
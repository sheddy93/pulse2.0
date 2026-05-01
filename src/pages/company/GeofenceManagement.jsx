import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { MapPin, Edit2, Trash2, Plus, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import GeofenceEditor from "@/components/attendance/GeofenceEditor";

export default function GeofenceManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingGeofence, setEditingGeofence] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failureLogs, setFailureLogs] = useState([]);
  const [showFailureLogs, setShowFailureLogs] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (!me || !["company_owner", "company_admin", "hr_manager"].includes(me.role)) {
        window.location.href = "/";
        return;
      }
      
      setUser(me);

      // Fetch company data
      const [locs, geofenceList, logs] = await Promise.all([
        base44.entities.CompanyLocation.filter({ is_deleted: false }),
        base44.entities.LocationGeofence.filter({}),
        base44.entities.AttendanceFailureLog.filter({}),
      ]);

      setLocations(locs);
      setGeofences(geofenceList);
      setFailureLogs(logs.sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at)));
      
      if (locs.length > 0) {
        setSelectedLocation(locs[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const getGeofenceForLocation = (locationId) => {
    return geofences.find(g => g.location_id === locationId);
  };

  const handleSaveGeofence = async (geofenceData) => {
    if (!selectedLocation) return;

    setSaving(true);
    try {
      const existing = getGeofenceForLocation(selectedLocation.id);

      const payload = {
        ...geofenceData,
        location_id: selectedLocation.id,
        location_name: selectedLocation.name,
      };

      if (existing) {
        await base44.entities.LocationGeofence.update(existing.id, payload);
        toast.success("Geofence aggiornato");
        setGeofences(prev =>
          prev.map(g => g.id === existing.id ? { ...g, ...payload } : g)
        );
      } else {
        const created = await base44.entities.LocationGeofence.create(payload);
        toast.success("Geofence creato");
        setGeofences(prev => [...prev, created]);
      }

      setShowEditor(false);
      setEditingGeofence(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGeofence = async (id) => {
    if (!window.confirm("Eliminare questo geofence?")) return;

    try {
      await base44.entities.LocationGeofence.delete(id);
      toast.success("Geofence eliminato");
      setGeofences(prev => prev.filter(g => g.id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <PageLoader />;

  const currentGeofence = selectedLocation ? getGeofenceForLocation(selectedLocation.id) : null;
  const locationFailures = selectedLocation
    ? failureLogs.filter(l => l.location_id === selectedLocation.id)
    : [];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestione Geofence GPS</h1>
          <p className="text-slate-600">Definisci perimetri geografici per ogni sede lavorativa</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Locations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-bold text-slate-900">Sedi Aziendali</h2>
              {locations.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Nessuna sede configurata</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locations.map(loc => {
                    const hasGeofence = getGeofenceForLocation(loc.id);
                    return (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedLocation?.id === loc.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{loc.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{loc.address}</p>
                        {hasGeofence && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-semibold">
                            ✓ Geofence attivo
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedLocation && (
              <>
                {/* Geofence Editor */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900">{selectedLocation.name}</h2>
                        <p className="text-xs text-slate-600">{selectedLocation.address}</p>
                      </div>
                    </div>
                    {!showEditor && (
                      <button
                        onClick={() => {
                          setEditingGeofence(currentGeofence);
                          setShowEditor(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                      >
                        {currentGeofence ? (
                          <>
                            <Edit2 className="w-4 h-4" />
                            Modifica Geofence
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Crea Geofence
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {showEditor ? (
                    <>
                      <GeofenceEditor
                        initialGeofence={editingGeofence}
                        onSave={handleSaveGeofence}
                        loading={saving}
                      />
                      <button
                        onClick={() => {
                          setShowEditor(false);
                          setEditingGeofence(null);
                        }}
                        className="w-full mt-4 px-4 py-2 border border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                      >
                        Annulla
                      </button>
                    </>
                  ) : currentGeofence ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-sm font-semibold text-emerald-900 mb-3">
                          ✓ Geofence Configurato
                        </p>
                        <div className="text-sm text-emerald-700 space-y-1">
                          <p>
                            <strong>Tipo:</strong>{" "}
                            {currentGeofence.geofence_type === "polygon"
                              ? "Poligono"
                              : "Cerchio"}
                          </p>
                          {currentGeofence.geofence_type === "polygon" && (
                            <p>
                              <strong>Vertici:</strong>{" "}
                              {currentGeofence.polygon_coordinates?.length || 0}
                            </p>
                          )}
                          {currentGeofence.geofence_type === "circle" && (
                            <p>
                              <strong>Raggio:</strong> {currentGeofence.circle_radius_meters}m
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleDeleteGeofence(currentGeofence.id)
                        }
                        className="w-full px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina Geofence
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">Nessun geofence configurato</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Clicca su "Crea Geofence" per iniziare
                      </p>
                    </div>
                  )}
                </div>

                {/* Failure Logs */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-900">
                      Tentativi Falliti ({locationFailures.length})
                    </h2>
                    <button
                      onClick={() => setShowFailureLogs(!showFailureLogs)}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <Eye className="w-4 h-4" />
                      {showFailureLogs ? "Nascondi" : "Mostra"}
                    </button>
                  </div>

                  {showFailureLogs && (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {locationFailures.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Nessun tentativo fallito
                        </p>
                      ) : (
                        locationFailures.slice(0, 20).map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-slate-50 rounded border border-slate-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 text-sm">
                                <p className="font-semibold text-slate-900">
                                  {log.employee_name}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                  Tentativo: <strong>{log.attempt_type}</strong> •{" "}
                                  <strong>{log.failure_reason}</strong>
                                </p>
                                {log.distance_from_location_meters && (
                                  <p className="text-xs text-slate-600 mt-1">
                                    Distanza: {Math.round(log.distance_from_location_meters)}m
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(log.attempted_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
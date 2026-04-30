"use client";

import { useState } from "react";
import { Crosshair, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocationCheckinCard() {
  const [status, setStatus] = useState("Posizione non rilevata");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  function detectLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocalizzazione non supportata");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude.toFixed(5),
          longitude: position.coords.longitude.toFixed(5),
        });
        setStatus("Posizione pronta per la timbratura");
        setLoading(false);
      },
      () => {
        setStatus("Impossibile leggere la posizione");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Timbratura con posizione</div>
          <div className="mt-1 text-sm text-slate-500">Utile per una verifica più forte su smartphone.</div>
        </div>
        <div className="rounded-2xl bg-violet-50 p-2 text-violet-700">
          <MapPin className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
        {coords ? (
          <div className="space-y-1">
            <div className="font-medium text-slate-900">{status}</div>
            <div>Lat: {coords.latitude}</div>
            <div>Lng: {coords.longitude}</div>
          </div>
        ) : (
          status
        )}
      </div>

      <Button className="mt-4 w-full rounded-2xl" onClick={detectLocation} disabled={loading}>
        <Navigation className="mr-2 h-4 w-4" />
        {loading ? "Rilevazione..." : "Rileva posizione"}
      </Button>
    </div>
  );
}

export default LocationCheckinCard;

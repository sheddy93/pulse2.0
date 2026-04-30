"use client";

import { useEffect, useState } from "react";
import { Bell, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobilePermissionsOnboarding() {
  const [notificationState, setNotificationState] = useState("default");
  const [geoState, setGeoState] = useState("idle");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationState(Notification.permission);
    }
  }, []);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationState(permission);
  }

  function checkLocation() {
    if (!navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setGeoState("granted"),
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const cards = [
    {
      title: "Notifiche push",
      description: notificationState === "granted" ? "Attive sul dispositivo." : "Attiva avvisi per busta paga, ferie e timbrature.",
      icon: Bell,
      action: notificationState === "granted" ? "Attive" : "Attiva",
      onClick: enableNotifications,
      disabled: notificationState === "granted",
    },
    {
      title: "Posizione",
      description: geoState === "granted" ? "Posizione disponibile per timbratura." : "Consenti la geolocalizzazione per check-in più sicuri.",
      icon: MapPin,
      action: geoState === "granted" ? "Abilitata" : "Verifica",
      onClick: checkLocation,
      disabled: geoState === "granted",
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <ShieldCheck className="h-4 w-4 text-violet-600" />
        Setup rapido smartphone
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Due autorizzazioni utili per avere un’esperienza più simile a una app nativa.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-white p-2 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={card.onClick} disabled={card.disabled}>
                  {card.action}
                </Button>
              </div>
              <div className="mt-3 font-medium text-slate-900">{card.title}</div>
              <div className="mt-1 text-sm text-slate-500">{card.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MobilePermissionsOnboarding;

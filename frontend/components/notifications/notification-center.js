"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";

function NotificationPill({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1 text-[11px] font-semibold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function NotificationCenter() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [notifications, count] = await Promise.all([
        apiRequest("/notifications/"),
        apiRequest("/notifications/unread_count/"),
      ]);
      setItems(Array.isArray(notifications) ? notifications.slice(0, 8) : []);
      setUnreadCount(count?.unread_count || 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    try {
      setBusy(true);
      await apiRequest("/notifications/mark_all_read/", { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dropdown
      align="end"
      trigger={
        <div className="relative">
          <Button type="button" variant="outline" className="rounded-2xl">
            <Bell className="h-4 w-4" />
          </Button>
          <NotificationPill count={unreadCount} />
        </div>
      }
    >
      <div className="w-[360px] p-1">
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Notifiche</div>
            <div className="text-xs text-slate-500">Eventi utili e azioni da completare</div>
          </div>
          <Button size="sm" variant="ghost" disabled={busy || !unreadCount} onClick={markAllRead} className="rounded-xl">
            <CheckCheck className="mr-1 h-4 w-4" />
            Segna tutte lette
          </Button>
        </div>
        <div className="max-h-[420px] overflow-y-auto px-1 py-1">
          {items.length ? items.map((item) => (
            <div key={item.id} className="mb-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-slate-900">{item.title}</div>
                    {!item.is_read ? <span className="h-2 w-2 rounded-full bg-violet-600" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <div className="mt-2 text-xs text-slate-400">{item.time_ago}</div>
                </div>
                {item.action_url ? (
                  <a href={item.action_url} className="text-slate-400 hover:text-slate-700">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          )) : (
            <div className="px-3 py-10 text-center text-sm text-slate-500">Nessuna notifica disponibile.</div>
          )}
        </div>
      </div>
    </Dropdown>
  );
}

export default NotificationCenter;

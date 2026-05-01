import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Bell, Check, X, Settings } from "lucide-react";

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    
    loadNotifications();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.employee_email === user.email) {
        setNotifications(prev => [event.data, ...prev]);
      } else if (event.type === 'update' && event.data?.employee_email === user.email) {
        setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
      }
    });

    return unsubscribe;
  }, [user?.email]);

  const loadNotifications = async () => {
    if (!user?.email) return;
    const notifs = await base44.entities.Notification.filter({
      employee_email: user.email
    }, '-created_date', 50);
    setNotifications(notifs);
    setLoading(false);
  };

  const markAsRead = async (id) => {
    await base44.entities.Notification.update(id, {
      is_read: true,
      read_at: new Date().toISOString()
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const statusIcon = (type) => {
    if (type.includes('approved')) return <Check className="w-4 h-4 text-emerald-600" />;
    if (type.includes('rejected')) return <X className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-40 max-h-96 overflow-y-auto">
            <div className="sticky top-0 px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Notifiche</h3>
              <Link
                to="/dashboard/employee/notification-settings"
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Preferenze notifiche"
              >
                <Settings className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Caricamento...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">Nessuna notifica</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      !notif.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {statusIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-800">{notif.title}</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(notif.created_date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
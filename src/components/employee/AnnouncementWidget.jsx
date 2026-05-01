import { useState, useEffect } from "react";
// All base44 references removed - announcements via service layer
import { Bell, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const PRIORITY_COLOR = {
  low: "bg-slate-50 border-slate-200",
  normal: "bg-blue-50 border-blue-200",
  high: "bg-orange-50 border-orange-200",
  urgent: "bg-red-50 border-red-200"
};

export default function AnnouncementWidget({ companyId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const announces = await base44.entities.Announcement.filter(
        { company_id: companyId },
        '-is_pinned,-created_date'
      );
      // Filter active announcements
      const active = announces.filter(a => !a.expires_at || a.expires_at >= today);
      setAnnouncements(active);
      setLoading(false);
    };

    loadAnnouncements();

    const unsubscribe = base44.entities.Announcement.subscribe((event) => {
      if (event.data?.company_id === companyId) {
        loadAnnouncements();
      }
    });

    return unsubscribe;
  }, [companyId]);

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  if (loading) return null;
  if (visibleAnnouncements.length === 0) return null;

  const pinned = visibleAnnouncements.filter(a => a.is_pinned);
  const recent = visibleAnnouncements.filter(a => !a.is_pinned).slice(0, 2);

  return (
    <div className="space-y-3">
      {pinned.length > 0 && (
        <div className="space-y-2">
          {pinned.map(ann => (
            <div key={ann.id} className={`border-l-4 border-l-amber-400 ${PRIORITY_COLOR[ann.priority]} rounded-lg p-3 space-y-1`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{ann.title}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{ann.content}</p>
                </div>
                <button onClick={() => setDismissed(d => new Set([...d, ann.id]))} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div className="space-y-2">
          {recent.map(ann => (
            <div key={ann.id} className={`${PRIORITY_COLOR[ann.priority]} border rounded-lg p-3 space-y-1`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{ann.title}</p>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{ann.content}</p>
                </div>
                <button onClick={() => setDismissed(d => new Set([...d, ann.id]))} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
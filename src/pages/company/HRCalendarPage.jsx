import { useState, useEffect } from "react";
import { authService } from '@/services/authService';
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import HRCalendar from "@/components/calendar/HRCalendar";
import { Calendar } from "lucide-react";

export default function HRCalendarPage() {
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await authService.me();
      setUser(me);
      if (me?.company_id) {
        setCompanyId(me.company_id);
      } else if (me?.role === "consultant") {
        // TODO: Replace with service call for consultant company links
        setCompanyId(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Calendario HR</h1>
            <p className="text-sm text-slate-500">Scadenze, ferie e note aziendali</p>
          </div>
        </div>

        {!companyId ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-slate-600 font-medium">Nessuna azienda associata al tuo account.</p>
          </div>
        ) : (
          <HRCalendar
            companyId={companyId}
            userRole={user?.role}
            userEmail={user?.email}
          />
        )}
      </div>
    </AppShell>
  );
}
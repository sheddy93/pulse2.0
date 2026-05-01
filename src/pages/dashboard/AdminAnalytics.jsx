import { useState, useEffect } from "react";
import { authService } from '@/services/authService';
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Building2, Briefcase, AlertCircle, MessageSquare, TrendingUp, Calendar } from "lucide-react";

const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];

export default function AdminAnalytics() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [bugReports, setBugReports] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await authService.me();
      setUser(me);

      if (me?.role !== "super_admin" && me?.role !== "admin") {
        setLoading(false);
        return;
      }

      // TODO: Replace with service calls for companies, users, bugs, feedbacks
      setStats({ totalCompanies: 0, totalEmployees: 0, totalConsultants: 0, totalUsers: 0, avgRating: "N/A", openBugs: 0, newFeedback: 0 });
      setBugReports([]);
      setFeedback([]);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <PageLoader color="red" />;

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return (
      <AppShell user={user}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <p className="text-red-800 font-semibold">Accesso riservato agli amministratori</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const roleDistribution = [
    { name: "Dipendenti", value: stats.totalEmployees, color: "#3B82F6" },
    { name: "Consulenti", value: stats.totalConsultants, color: "#8B5CF6" },
    { name: "Aziende", value: stats.totalCompanies, color: "#10B981" }
  ];

  const bugSeverity = bugReports.reduce((acc, bug) => {
    const sev = bug.severity || "medium";
    const existing = acc.find(b => b.name === sev);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: sev, value: 1 });
    }
    return acc;
  }, []);

  const feedbackCategories = feedback.reduce((acc, f) => {
    const cat = f.category || "other";
    const existing = acc.find(b => b.name === cat);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: cat, value: 1 });
    }
    return acc;
  }, []);

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics & Amministrazione</h1>
          <p className="text-slate-600 mt-2">Panoramica completa della piattaforma PulseHR</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Aziende</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalCompanies}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Dipendenti</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Consulenti</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalConsultants}</p>
              </div>
              <Briefcase className="w-8 h-8 text-violet-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Valutazione Media</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.avgRating}/5</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Alert Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Bug Reports Aperti</h3>
                <p className="text-2xl font-bold text-red-700 mt-1">{stats.openBugs}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Feedback Nuovi</h3>
                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.newFeedback}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuzione Ruoli */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Distribuzione Utenti</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Bug */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Severity Bug Reports</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bugSeverity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabelle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bug Reports Recenti */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Bug Reports Recenti</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {bugReports.slice(0, 10).map(bug => (
                <div key={bug.id} className="px-6 py-3 border-b border-slate-100 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{bug.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{bug.user_email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                      bug.severity === "critical" ? "bg-red-100 text-red-700" :
                      bug.severity === "high" ? "bg-orange-100 text-orange-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {bug.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Recente */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Feedback Recente</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {feedback.slice(0, 10).map(f => (
                <div key={f.id} className="px-6 py-3 border-b border-slate-100 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm line-clamp-2">{f.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{f.user_email}</span>
                        <span className="text-xs font-bold text-yellow-600">{"⭐".repeat(f.rating)}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                      f.status === "new" ? "bg-blue-100 text-blue-700" :
                      f.status === "reviewed" ? "bg-yellow-100 text-yellow-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
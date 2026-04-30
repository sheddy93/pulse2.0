import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Award, BarChart3 } from "lucide-react";

export default function HRAnalytics() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hiringTrend, setHiringTrend] = useState([]);
  const [skillsDistribution, setSkillsDistribution] = useState([]);
  const [turnoverData, setTurnoverData] = useState(null);
  const [performanceAvg, setPerformanceAvg] = useState(0);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }

      const [companies, employees, applications, skills, reviews] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id }),
        base44.entities.JobApplication.filter({ company_id: me.company_id }),
        base44.entities.EmployeeSkill.filter({ company_id: me.company_id }),
        base44.entities.PerformanceReview.filter({ company_id: me.company_id })
      ]);

      setCompany(companies[0]);

      // Trend assunzioni (ultimi 6 mesi)
      const monthsData = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthsData[monthKey] = 0;
      }
      applications.forEach(app => {
        const monthKey = app.created_date?.substring(0, 7);
        if (monthKey && monthsData.hasOwnProperty(monthKey)) {
          monthsData[monthKey]++;
        }
      });
      setHiringTrend(Object.entries(monthsData).map(([month, count]) => ({ month, applications: count })));

      // Distribuzione competenze
      const skillCounts = {};
      skills.forEach(skill => {
        skillCounts[skill.skill_name] = (skillCounts[skill.skill_name] || 0) + 1;
      });
      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, value: count }));
      setSkillsDistribution(topSkills);

      // Turnover (attivi vs inattivi)
      const active = employees.filter(e => e.status === 'active').length;
      const inactive = employees.filter(e => e.status === 'inactive').length;
      const turnoverRate = employees.length > 0 ? ((inactive / (active + inactive)) * 100).toFixed(1) : 0;
      setTurnoverData({
        active,
        inactive,
        total: employees.length,
        turnoverRate
      });

      // Media performance 360°
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length;
        setPerformanceAvg(avgRating.toFixed(1));
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">HR Analytics</h1>
          <p className="text-sm text-slate-500">{company?.name}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Dipendenti Attivi</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{turnoverData?.active || 0}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-200" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Turnover Rate</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{turnoverData?.turnoverRate || 0}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-red-200" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Performance Avg</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{performanceAvg}/5</p>
              </div>
              <Award className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Top Skills</p>
                <p className="text-3xl font-bold text-violet-600 mt-1">{skillsDistribution.length}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-violet-200" />
            </div>
          </div>
        </div>

        {/* Grafici */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Assunzioni */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Andamento Assunzioni (Ultimi 6 Mesi)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hiringTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Candidature"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distribuzione Competenze */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Top 8 Competenze</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillsDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#1e293b' }}
                  formatter={(value) => [value, 'Dipendenti']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribuzione Dipendenti */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Stato Dipendenti</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Attivi', value: turnoverData?.active || 0 },
                    { name: 'Inattivi', value: turnoverData?.inactive || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Riepilogo */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Riepilogo KPI</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-700">Dipendenti Totali</p>
                <p className="font-bold text-slate-800">{turnoverData?.total || 0}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-700">Attivi</p>
                <p className="font-bold text-emerald-600">{turnoverData?.active || 0}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-700">Inattivi</p>
                <p className="font-bold text-red-600">{turnoverData?.inactive || 0}</p>
              </div>
              <div className="border-t border-slate-300 pt-3 flex items-center justify-between">
                <p className="text-slate-700">Turnover Rate</p>
                <p className="font-bold text-red-600">{turnoverData?.turnoverRate || 0}%</p>
              </div>
              <div className="border-t border-slate-300 pt-3 flex items-center justify-between">
                <p className="text-slate-700">Performance Media</p>
                <p className="font-bold text-blue-600">{performanceAvg}/5 ⭐</p>
              </div>
              <div className="border-t border-slate-300 pt-3 flex items-center justify-between">
                <p className="text-slate-700">Competenze Uniche</p>
                <p className="font-bold text-violet-600">{skillsDistribution.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
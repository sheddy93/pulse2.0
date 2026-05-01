/**
 * Team Analytics Component
 * Dashboard analitico per manager
 */
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export default function TeamAnalytics({ managerId, companyId }) {
  const [data, setData] = useState({
    teamSize: 0,
    attendanceData: [],
    leaveData: [],
    performanceScore: 0,
    teamHealth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamAnalytics();
  }, [managerId, companyId]);

  const loadTeamAnalytics = async () => {
    try {
      // Carica team del manager
      const employees = await base44.entities.EmployeeProfile.filter({
        company_id: companyId,
        manager: managerId,
        status: 'active'
      });

      // Dati presenza ultimi 7 giorni
      const attendance = await base44.entities.AttendanceEntry.filter({
        company_id: companyId,
        employee_id: { $in: employees.map(e => e.id) }
      });

      // Dati ferie
      const leaves = await base44.entities.LeaveRequest.filter({
        company_id: companyId,
        status: 'approved'
      });

      // Aggregga dati per grafico
      const attendanceByDay = {};
      attendance.forEach(a => {
        const date = a.attendance_date;
        attendanceByDay[date] = (attendanceByDay[date] || 0) + 1;
      });

      const attendanceData = Object.entries(attendanceByDay)
        .sort()
        .slice(-7)
        .map(([date, count]) => ({
          date,
          presenti: count,
          atteso: employees.length
        }));

      const leaveData = leaves.reduce((acc, leave) => {
        const type = leave.leave_type;
        const existing = acc.find(l => l.name === type);
        if (existing) existing.value++;
        else acc.push({ name: type, value: 1 });
        return acc;
      }, []);

      setData({
        teamSize: employees.length,
        attendanceData,
        leaveData,
        performanceScore: 85,
        teamHealth: 78
      });
    } catch (error) {
      console.error('Failed to load team analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Caricamento...</div>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Team Size</p>
              <p className="text-3xl font-bold text-blue-600">{data.teamSize}</p>
            </div>
            <Users className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tasso Presenza</p>
              <p className="text-3xl font-bold text-emerald-600">
                {data.attendanceData[data.attendanceData.length - 1]
                  ? Math.round((data.attendanceData[data.attendanceData.length - 1].presenti / data.teamSize) * 100)
                  : 0}%
              </p>
            </div>
            <Clock className="w-10 h-10 text-emerald-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Performance</p>
              <p className="text-3xl font-bold text-purple-600">{data.performanceScore}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Team Health</p>
              <p className="text-3xl font-bold text-orange-600">{data.teamHealth}%</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Grafici */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Presence Trend */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Tendenza Presenze (7 giorni)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="presenti" stroke="#3b82f6" name="Presenti" />
              <Line type="monotone" dataKey="atteso" stroke="#e5e7eb" name="Atteso" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Types */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Tipi di Ferie</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.leaveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" name="Giorni" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, company_id } = await req.json();
    if (!query || !company_id) return Response.json({ error: 'Missing query or company_id' }, { status: 400 });

    // Fetch all relevant data in parallel
    const [employees, leaveRequests, overtimeRequests, skills, timeEntries] = await Promise.all([
      base44.asServiceRole.entities.EmployeeProfile.filter({ company_id }),
      base44.asServiceRole.entities.LeaveRequest.filter({ company_id }),
      base44.asServiceRole.entities.OvertimeRequest.filter({ company_id }),
      base44.asServiceRole.entities.EmployeeSkill.filter({ company_id }),
      base44.asServiceRole.entities.TimeEntry.filter({ company_id }),
    ]);

    // Build a compact data summary for the LLM
    const now = new Date();

    // Leave trend last 6 months
    const leaveTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7);
      const monthName = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      const count = leaveRequests.filter(l => l.start_date?.startsWith(monthKey)).length;
      const totalDays = leaveRequests.filter(l => l.start_date?.startsWith(monthKey)).reduce((s, l) => s + (l.days_count || 0), 0);
      leaveTrend.push({ month: monthKey, label: monthName, requests: count, days: totalDays });
    }

    // Skills distribution
    const skillMap = {};
    skills.forEach(s => { skillMap[s.skill_name] = (skillMap[s.skill_name] || 0) + 1; });
    const skillsDistrib = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));

    // Department distribution
    const deptMap = {};
    employees.forEach(e => { const d = e.department || 'N/D'; deptMap[d] = (deptMap[d] || 0) + 1; });
    const deptDistrib = Object.entries(deptMap).map(([dept, count]) => ({ dept, count }));

    // Leave type breakdown
    const leaveTypeMap = {};
    leaveRequests.forEach(l => { leaveTypeMap[l.leave_type] = (leaveTypeMap[l.leave_type] || 0) + 1; });

    // Overtime trend last 6 months
    const overtimeTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7);
      const monthName = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      const hours = overtimeRequests.filter(o => o.date?.startsWith(monthKey)).reduce((s, o) => s + (o.hours || 0), 0);
      overtimeTrend.push({ month: monthKey, label: monthName, hours: Math.round(hours) });
    }

    // Attendance trend (check-ins per month last 6 months)
    const attendanceTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7);
      const monthName = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      const checkIns = timeEntries.filter(e => e.type === 'check_in' && e.timestamp?.startsWith(monthKey)).length;
      attendanceTrend.push({ month: monthKey, label: monthName, presenze: checkIns });
    }

    // Status breakdown
    const activeEmps = employees.filter(e => e.status === 'active').length;
    const inactiveEmps = employees.filter(e => e.status === 'inactive').length;
    const onboardingEmps = employees.filter(e => e.status === 'onboarding').length;

    const dataContext = {
      summary: {
        total_employees: employees.length,
        active: activeEmps,
        inactive: inactiveEmps,
        onboarding: onboardingEmps,
        total_leave_requests: leaveRequests.length,
        pending_leaves: leaveRequests.filter(l => l.status === 'pending').length,
        approved_leaves: leaveRequests.filter(l => l.status === 'approved').length,
        total_overtime_hours: Math.round(overtimeRequests.reduce((s, o) => s + (o.hours || 0), 0)),
        unique_skills: Object.keys(skillMap).length,
      },
      leave_trend_6months: leaveTrend,
      overtime_trend_6months: overtimeTrend,
      attendance_trend_6months: attendanceTrend,
      skills_distribution: skillsDistrib,
      department_distribution: deptDistrib,
      leave_type_breakdown: leaveTypeMap,
    };

    const prompt = `Sei un analista HR esperto che lavora con PulseHR, un sistema di gestione delle risorse umane.

L'utente ha fatto questa domanda: "${query}"

Ecco i dati reali dell'azienda:
${JSON.stringify(dataContext, null, 2)}

Rispondi in italiano. Fornisci:
1. Una risposta sintetica e professionale alla domanda (2-4 paragrafi)
2. Indica quale/i grafici mostrare tra quelli disponibili: "leave_trend", "overtime_trend", "attendance_trend", "skills_distribution", "department_distribution", "leave_type_breakdown"
3. 2-3 insight chiave o raccomandazioni pratiche

Struttura la risposta come JSON con:
- "analysis": testo dell'analisi in markdown
- "charts": array dei nomi dei grafici da mostrare (max 3, scegli i più rilevanti per la domanda)
- "insights": array di 2-3 oggetti con "icon" (emoji), "title" e "text"
- "title": titolo breve dell'analisi (max 60 caratteri)`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          analysis: { type: "string" },
          charts: { type: "array", items: { type: "string" } },
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                icon: { type: "string" },
                title: { type: "string" },
                text: { type: "string" }
              }
            }
          },
          title: { type: "string" }
        }
      }
    });

    return Response.json({
      ...result,
      raw_data: dataContext,
    });

  } catch (error) {
    console.error('aiAnalytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
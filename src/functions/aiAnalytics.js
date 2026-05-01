/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, company_id } = await req.json();
    if (!query || !company_id) {
      return Response.json({ error: 'Missing query or company_id' }, { status: 400 });
    }

    // Fetch all HR data for analysis
    const [employees, leaves, overtime, timeEntries, skills, announcements] = await Promise.all([
      base44.entities.EmployeeProfile.filter({ company_id }),
      base44.entities.LeaveRequest.filter({ company_id }),
      base44.entities.OvertimeRequest.filter({ company_id }),
      base44.entities.TimeEntry.filter({}), // Gets all, filter by user later
      base44.entities.EmployeeSkill.filter({}),
      base44.entities.Announcement.filter({ company_id }),
    ]);

    // Calculate aggregate metrics
    const summary = {
      total_employees: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      inactive: employees.filter(e => e.status === 'inactive').length,
      total_leave_requests: leaves.length,
      approved_leaves: leaves.filter(l => l.status === 'approved').length,
      pending_leaves: leaves.filter(l => l.status === 'pending').length,
      total_overtime_hours: overtime.reduce((sum, o) => sum + (o.hours || 0), 0),
    };

    // Analyze leave trends (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const leaveTrend = {};
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthKey = date.toLocaleString('it-IT', { month: 'short', year: 'numeric' });
      const monthLeaves = leaves.filter(l => {
        const leaveDate = new Date(l.start_date);
        return leaveDate.getMonth() === date.getMonth() && leaveDate.getFullYear() === date.getFullYear();
      });
      leaveTrend[monthKey] = {
        label: monthKey,
        requests: monthLeaves.length,
        days: monthLeaves.reduce((sum, l) => sum + (l.days_count || 0), 0),
      };
    }
    const leave_trend_6months = Object.values(leaveTrend);

    // Overtime trend
    const overtimeTrend = {};
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthKey = date.toLocaleString('it-IT', { month: 'short', year: 'numeric' });
      const monthOT = overtime.filter(o => {
        const otDate = new Date(o.request_date);
        return otDate.getMonth() === date.getMonth() && otDate.getFullYear() === date.getFullYear();
      });
      overtimeTrend[monthKey] = {
        label: monthKey,
        hours: monthOT.reduce((sum, o) => sum + (o.hours || 0), 0),
      };
    }
    const overtime_trend_6months = Object.values(overtimeTrend);

    // Attendance trend
    const attendance_trend_6months = leave_trend_6months.map(month => ({
      label: month.label,
      presenze: summary.active * 20 - month.requests, // Simplified calculation
    }));

    // Skills distribution
    const skillCounts = {};
    skills.forEach(s => {
      skillCounts[s.skill_name] = (skillCounts[s.skill_name] || 0) + 1;
    });
    const skills_distribution = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Department distribution
    const deptCounts = {};
    employees.forEach(e => {
      const dept = e.department || 'Senza reparto';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const department_distribution = Object.entries(deptCounts).map(([dept, count]) => ({ dept, count }));

    // Leave type breakdown
    const leave_type_breakdown = {};
    leaves.forEach(l => {
      const type = l.leave_type || 'extra';
      leave_type_breakdown[type] = (leave_type_breakdown[type] || 0) + 1;
    });

    // Raw data for charts
    const raw_data = {
      summary,
      leave_trend_6months,
      overtime_trend_6months,
      attendance_trend_6months,
      skills_distribution,
      department_distribution,
      leave_type_breakdown,
    };

    // Use AI to analyze and generate insights
    const analysisPrompt = `
Sei un esperto di HR Analytics. Analizza i seguenti dati HR di un'azienda italiana e rispondi a questa domanda: "${query}"

DATI AZIENDALI:
- Dipendenti totali: ${summary.total_employees}
- Dipendenti attivi: ${summary.active}
- Dipendenti inattivi: ${summary.inactive}
- Richieste ferie totali: ${summary.total_leave_requests}
- Ferie approvate: ${summary.approved_leaves}
- Ferie in sospeso: ${summary.pending_leaves}
- Ore straordinari totali: ${summary.total_overtime_hours}

TREND ASSENZE (ultimi 6 mesi):
${leave_trend_6months.map(m => `${m.label}: ${m.requests} richieste, ${m.days} giorni`).join('\n')}

TREND STRAORDINARI (ultimi 6 mesi):
${overtime_trend_6months.map(m => `${m.label}: ${m.hours} ore`).join('\n')}

COMPETENZE AZIENDALI:
${skills_distribution.slice(0, 10).map(s => `${s.name}: ${s.count} dipendenti`).join('\n')}

DIPENDENTI PER REPARTO:
${department_distribution.map(d => `${d.dept}: ${d.count} dipendenti`).join('\n')}

RIPARTIZIONE ASSENZE:
${Object.entries(leave_type_breakdown).map(([type, count]) => `${type}: ${count} richieste`).join('\n')}

Per favore:
1. Analizza la domanda dell'utente in relazione ai dati forniti
2. Identifica trend significativi (aumenti/diminuzioni, pattern anomali)
3. Suggerisci 2-3 azioni concrete di miglioramento
4. Usa un tono professionale ma accessibile
5. Formatta la risposta in markdown con sezioni chiare

Includi insights sui seguenti aspetti se rilevanti:
- Trend assenze (aumento/diminuzione anomale)
- Distribuzione del carico di lavoro (straordinari eccessivi?)
- Gaps di competenze nel team
- Equilibrio tra i reparti
`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      model: 'gemini_3_flash',
    });

    // Generate insights from AI response
    const insights = [
      {
        icon: '📊',
        title: 'Trend Assenze',
        text: `${summary.approved_leaves} ferie approvate, ${summary.pending_leaves} in attesa. Media ${(summary.total_leave_requests / 6).toFixed(1)} richieste/mese.`,
      },
      {
        icon: '⏰',
        title: 'Straordinari',
        text: `${summary.total_overtime_hours.toFixed(0)} ore totali negli ultimi 6 mesi. Media ${(summary.total_overtime_hours / 6).toFixed(1)} ore/mese.`,
      },
      {
        icon: '👥',
        title: 'Team Composition',
        text: `${summary.active} dipendenti attivi su ${summary.total_employees}. ${department_distribution.length} reparti identificati.`,
      },
    ];

    // Generate proactive recommendations based on data analysis
    const recommendations = [];
    
    // Check for excessive overtime
    const avgOT = summary.total_overtime_hours / 6;
    if (avgOT > 40) {
      recommendations.push(`⚠️ Straordinari eccessivi: media ${avgOT.toFixed(1)} ore/mese. Considera di assegnare più risorse o distribuire il carico.`);
    }

    // Check for high leave requests
    const avgLeaves = summary.total_leave_requests / 6;
    if (avgLeaves > summary.active * 0.5) {
      recommendations.push(`📅 Molte richieste di ferie in sospeso (${summary.pending_leaves}). Accelera il processo di approvazione.`);
    }

    // Check for skill gaps
    if (skills_distribution.length < summary.active * 0.5) {
      recommendations.push(`🎯 Competenze non mappate: solo ${skills_distribution.length} competenze registrate. Considera un audit delle skill aziendali.`);
    }

    // Check for unbalanced departments
    const avgDeptSize = summary.active / department_distribution.length;
    const unbalanced = department_distribution.filter(d => Math.abs(d.count - avgDeptSize) > avgDeptSize * 0.5);
    if (unbalanced.length > 0) {
      recommendations.push(`⚖️ Sbilanciamento nei reparti: considera un riassetto organizzativo per migliore efficienza.`);
    }

    // Check for inactive employees
    if (summary.inactive > 0) {
      recommendations.push(`👤 ${summary.inactive} dipendenti inattivi nel sistema. Aggiorna le loro posizioni o archiviali.`);
    }

    // Default recommendation if no issues found
    if (recommendations.length === 0) {
      recommendations.push(`✅ Il team è ben bilanciato. Continua a monitorare gli indicatori HR principali.`);
    }

    // Determine which charts to show based on query
    const charts = [];
    const queryLower = query.toLowerCase();
    if (queryLower.includes('assenz') || queryLower.includes('ferie') || queryLower.includes('permesso')) {
      charts.push('leave_trend', 'leave_type_breakdown');
    }
    if (queryLower.includes('straordinari') || queryLower.includes('overtime')) {
      charts.push('overtime_trend');
    }
    if (queryLower.includes('competenz') || queryLower.includes('skill')) {
      charts.push('skills_distribution');
    }
    if (queryLower.includes('reparto') || queryLower.includes('dipartimento') || queryLower.includes('department')) {
      charts.push('department_distribution');
    }
    if (queryLower.includes('presenz') || queryLower.includes('attendance')) {
      charts.push('attendance_trend');
    }
    // Default charts if query is generic
    if (charts.length === 0) {
      charts.push('leave_trend', 'overtime_trend', 'department_distribution');
    }

    return Response.json({
      title: 'Analisi IA - ' + (query.substring(0, 40) + (query.length > 40 ? '...' : '')),
      analysis: aiResponse,
      insights,
      recommendations,
      charts: [...new Set(charts)], // Remove duplicates
      raw_data,
    });
  } catch (error) {
    console.error('AI Analytics error:', error);
    return Response.json({
      error: 'Errore durante l\'analisi: ' + error.message,
    }, { status: 500 });
  }
});
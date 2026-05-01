/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

function drawBarChart(doc, data, x, y, width, height, title, color = [59, 130, 246]) {
  if (!data || data.length === 0) return;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(title, x, y - 4);

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = (width - (data.length - 1) * 4) / data.length;

  data.forEach((item, i) => {
    const barHeight = (item.value / maxVal) * height;
    const bx = x + i * (barWidth + 4);
    const by = y + height - barHeight;

    doc.setFillColor(...color);
    doc.rect(bx, by, barWidth, barHeight, 'F');

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(String(item.value), bx + barWidth / 2, by - 2, { align: 'center' });
    doc.text(item.label, bx + barWidth / 2, y + height + 6, { align: 'center' });
  });
}

function drawPieChart(doc, data, cx, cy, radius, title) {
  if (!data || data.length === 0) return;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(title, cx - radius, cy - radius - 6);

  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = [
    [59, 130, 246], [16, 185, 129], [245, 158, 11],
    [239, 68, 68], [139, 92, 246], [20, 184, 166]
  ];

  let startAngle = -Math.PI / 2;
  data.forEach((item, i) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;

    // Draw slice approximation with lines
    doc.setFillColor(...colors[i % colors.length]);
    const steps = Math.max(8, Math.floor(sliceAngle * 20));
    const points = [[cx, cy]];
    for (let s = 0; s <= steps; s++) {
      const a = startAngle + (sliceAngle * s) / steps;
      points.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
    }
    doc.polygon(points, 'F');

    // Label
    const lx = cx + Math.cos(midAngle) * (radius * 1.35);
    const ly = cy + Math.sin(midAngle) * (radius * 1.35);
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text(`${item.label} (${Math.round((item.value / total) * 100)}%)`, lx, ly, { align: 'center' });

    startAngle = endAngle;
  });
}

function addHeader(doc, title, subtitle, pageWidth) {
  // Blue gradient header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text(subtitle, 14, 28);

  // PulseHR branding top right
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('PulseHR', pageWidth - 14, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(147, 197, 253);
  doc.text('Report generato automaticamente', pageWidth - 14, 28, { align: 'right' });
}

function addFooter(doc, pageNum, totalPages, pageWidth, pageHeight) {
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} | PulseHR HR Platform`, 14, pageHeight - 5);
  doc.text(`Pagina ${pageNum} di ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
}

function addSection(doc, title, y) {
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(title, 17, y + 5.5);
  return y + 14;
}

function addKPIRow(doc, kpis, y) {
  const w = 182 / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = 14 + i * w;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w - 4, 24, 2, 2, 'FD');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(String(kpi.value), x + (w - 4) / 2, y + 13, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + (w - 4) / 2, y + 20, { align: 'center' });
  });
  return y + 30;
}

function addTable(doc, headers, rows, y, pageWidth, pageHeight) {
  const colWidth = 182 / headers.length;
  const rowH = 9;

  // Header row
  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 182, rowH, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  headers.forEach((h, i) => {
    doc.text(h, 16 + i * colWidth, y + 6);
  });
  y += rowH;

  rows.forEach((row, ri) => {
    if (y > pageHeight - 30) return; // skip if out of bounds
    doc.setFillColor(ri % 2 === 0 ? 255 : 248, ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 255 : 252);
    doc.rect(14, y, 182, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + rowH, 196, y + rowH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    row.forEach((cell, ci) => {
      const text = String(cell || '—');
      doc.text(text.substring(0, 22), 16 + ci * colWidth, y + 6);
    });
    y += rowH;
  });

  return y + 4;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_type, company_id, employee_id, date_from, date_to } = await req.json();

    const pageWidth = 210;
    const pageHeight = 297;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const now = new Date();

    if (report_type === 'company_hr') {
      // === COMPANY HR REPORT ===
      const [employees, leaveRequests, overtimeRequests, shifts] = await Promise.all([
        base44.asServiceRole.entities.EmployeeProfile.filter({ company_id }),
        base44.asServiceRole.entities.LeaveRequest.filter({ company_id }),
        base44.asServiceRole.entities.OvertimeRequest.filter({ company_id }),
        base44.asServiceRole.entities.Shift.filter({ company_id }),
      ]);

      const company = (await base44.asServiceRole.entities.Company.filter({ id: company_id }))[0];

      addHeader(doc, 'Report HR Aziendale', `${company?.name || 'Azienda'} • ${now.toLocaleDateString('it-IT')}`, pageWidth);

      let y = 46;

      // KPIs
      y = addSection(doc, '📊 Metriche Principali', y);
      const activeEmp = employees.filter(e => e.status === 'active').length;
      const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
      const approvedLeaves = leaveRequests.filter(l => l.status === 'approved').length;
      const totalOvt = overtimeRequests.reduce((s, o) => s + (o.hours || 0), 0);
      y = addKPIRow(doc, [
        { label: 'Dipendenti Attivi', value: activeEmp },
        { label: 'Ferie in Attesa', value: pendingLeaves },
        { label: 'Ferie Approvate', value: approvedLeaves },
        { label: 'Ore Straordinari', value: Math.round(totalOvt) },
      ], y);

      // Bar chart: employees by department
      y = addSection(doc, '📈 Dipendenti per Reparto', y);
      const deptMap = {};
      employees.forEach(e => {
        const d = e.department || 'N/D';
        deptMap[d] = (deptMap[d] || 0) + 1;
      });
      const deptData = Object.entries(deptMap).slice(0, 8).map(([label, value]) => ({ label, value }));
      drawBarChart(doc, deptData, 14, y + 8, 182, 40, '', [59, 130, 246]);
      y += 58;

      // Leave breakdown pie
      y = addSection(doc, '🏖 Distribuzione Ferie per Tipo', y);
      const leaveTypeMap = {};
      leaveRequests.forEach(l => {
        leaveTypeMap[l.leave_type] = (leaveTypeMap[l.leave_type] || 0) + 1;
      });
      const leaveData = Object.entries(leaveTypeMap).map(([label, value]) => ({
        label: label === 'ferie' ? 'Ferie' : label === 'permesso' ? 'Permesso' : label === 'malattia' ? 'Malattia' : 'Extra',
        value
      }));
      if (leaveData.length > 0) {
        drawPieChart(doc, leaveData, 70, y + 28, 22, '');
      }
      y += 62;

      // Employee table
      y = addSection(doc, '👥 Elenco Dipendenti', y);
      const empRows = employees.slice(0, 15).map(e => [
        `${e.first_name} ${e.last_name}`,
        e.job_title || '—',
        e.department || '—',
        e.status === 'active' ? 'Attivo' : e.status === 'inactive' ? 'Inattivo' : 'Onboarding',
        e.hire_date || '—',
      ]);
      y = addTable(doc, ['Nome', 'Ruolo', 'Reparto', 'Stato', 'Data Assunzione'], empRows, y, pageWidth, pageHeight);

      addFooter(doc, 1, 1, pageWidth, pageHeight);

    } else if (report_type === 'employee_personal') {
      // === EMPLOYEE PERSONAL REPORT ===
      const [empArr, leaveRequests, overtimeRequests, timeEntries] = await Promise.all([
        base44.asServiceRole.entities.EmployeeProfile.filter({ id: employee_id }),
        base44.asServiceRole.entities.LeaveRequest.filter({ employee_id }),
        base44.asServiceRole.entities.OvertimeRequest.filter({ employee_id }),
        base44.asServiceRole.entities.TimeEntry.filter({ employee_id }),
      ]);

      const emp = empArr[0];
      if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

      addHeader(doc, 'Report Personale Dipendente', `${emp.first_name} ${emp.last_name} • ${now.toLocaleDateString('it-IT')}`, pageWidth);

      let y = 46;

      // Personal info
      y = addSection(doc, '👤 Informazioni Personali', y);
      const infoRows = [
        ['Nome completo', `${emp.first_name} ${emp.last_name}`, 'Matricola', emp.employee_code || '—'],
        ['Ruolo', emp.job_title || '—', 'Reparto', emp.department || '—'],
        ['Email', emp.email || '—', 'Sede', emp.location || '—'],
        ['Data assunzione', emp.hire_date || '—', 'Stato', emp.status || '—'],
      ];
      infoRows.forEach(row => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(row[0] + ':', 16, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(row[1], 60, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(row[2] + ':', 110, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(row[3], 150, y);
        y += 7;
      });
      y += 4;

      // KPIs
      y = addSection(doc, '📊 Riepilogo Attività', y);
      const approved = leaveRequests.filter(l => l.status === 'approved').length;
      const pending = leaveRequests.filter(l => l.status === 'pending').length;
      const totalOvtHours = overtimeRequests.reduce((s, o) => s + (o.hours || 0), 0);
      const checkIns = timeEntries.filter(e => e.type === 'check_in').length;
      y = addKPIRow(doc, [
        { label: 'Ferie Approvate', value: approved },
        { label: 'Richieste in Attesa', value: pending },
        { label: 'Ore Straordinari', value: Math.round(totalOvtHours) },
        { label: 'Timbrature Totali', value: checkIns },
      ], y);

      // Monthly attendance bar chart
      y = addSection(doc, '📅 Presenze Mensili (ultimi 6 mesi)', y);
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toISOString().substring(0, 7);
        const count = timeEntries.filter(e => e.type === 'check_in' && e.timestamp?.startsWith(monthStr)).length;
        monthlyData.push({
          label: d.toLocaleDateString('it-IT', { month: 'short' }),
          value: count
        });
      }
      drawBarChart(doc, monthlyData, 14, y + 8, 182, 36, '', [16, 185, 129]);
      y += 54;

      // Leave history table
      y = addSection(doc, '🏖 Storico Ferie e Permessi', y);
      const leaveRows = leaveRequests.slice(0, 12).map(l => [
        l.leave_type === 'ferie' ? 'Ferie' : l.leave_type === 'permesso' ? 'Permesso' : l.leave_type === 'malattia' ? 'Malattia' : 'Extra',
        l.start_date,
        l.end_date,
        `${l.days_count || 0} gg`,
        l.status === 'approved' ? 'Approvata' : l.status === 'pending' ? 'In attesa' : 'Rifiutata',
      ]);
      y = addTable(doc, ['Tipo', 'Dal', 'Al', 'Giorni', 'Stato'], leaveRows, y, pageWidth, pageHeight);

      // Overtime table
      if (y < pageHeight - 60) {
        y = addSection(doc, '⏰ Storico Straordinari', y);
        const ovtRows = overtimeRequests.slice(0, 8).map(o => [
          o.date,
          `${o.hours || 0}h`,
          o.reason || '—',
          o.status === 'approved' ? 'Approvato' : o.status === 'pending' ? 'In attesa' : 'Rifiutato',
        ]);
        addTable(doc, ['Data', 'Ore', 'Motivo', 'Stato'], ovtRows, y, pageWidth, pageHeight);
      }

      addFooter(doc, 1, 1, pageWidth, pageHeight);
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PulseHR_Report_${report_type}_${now.toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
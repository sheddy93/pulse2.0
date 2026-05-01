import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generate advanced HR reports
 * Types: Attendance, Leave, Turnover, Compensation, Performance, Training
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, startDate, endDate, departmentId } = await req.json();

    if (!reportType) {
      return Response.json({ error: 'Missing reportType' }, { status: 400 });
    }

    let reportData = {};

    // Attendance Report
    if (reportType === 'attendance') {
      const entries = await base44.entities.TimeEntry.filter({
        timestamp: { $gte: startDate, $lte: endDate }
      });

      reportData = {
        title: 'Attendance Report',
        period: `${startDate} to ${endDate}`,
        total_check_ins: entries.filter(e => e.type === 'check_in').length,
        total_check_outs: entries.filter(e => e.type === 'check_out').length,
        average_daily_attendance: Math.round((entries.filter(e => e.type === 'check_in').length / 
          Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))) * 100) + '%'
      };
    }

    // Leave Report
    if (reportType === 'leave') {
      const leaves = await base44.entities.LeaveRequest.filter({
        status: 'approved'
      });

      const approvedLeaves = leaves.filter(l => 
        new Date(l.start_date) >= new Date(startDate) &&
        new Date(l.start_date) <= new Date(endDate)
      );

      reportData = {
        title: 'Leave Report',
        period: `${startDate} to ${endDate}`,
        total_leave_requests: approvedLeaves.length,
        leave_by_type: {
          vacation: approvedLeaves.filter(l => l.type === 'vacation').length,
          sick: approvedLeaves.filter(l => l.type === 'sick').length,
          permission: approvedLeaves.filter(l => l.type === 'permission').length
        },
        pending_approvals: leaves.filter(l => l.status === 'pending').length
      };
    }

    // Turnover Report
    if (reportType === 'turnover') {
      const allEmployees = await base44.entities.EmployeeProfile.filter({});
      const departedEmployees = allEmployees.filter(e => e.end_date && 
        new Date(e.end_date) >= new Date(startDate) &&
        new Date(e.end_date) <= new Date(endDate)
      );

      const turnoverRate = allEmployees.length > 0 ? 
        ((departedEmployees.length / allEmployees.length) * 100).toFixed(2) : 0;

      reportData = {
        title: 'Turnover Report',
        period: `${startDate} to ${endDate}`,
        total_employees: allEmployees.length,
        departed_employees: departedEmployees.length,
        turnover_rate: `${turnoverRate}%`,
        departed_details: departedEmployees.map(e => ({
          name: `${e.first_name} ${e.last_name}`,
          role: e.job_title,
          end_date: e.end_date
        }))
      };
    }

    // Performance Report
    if (reportType === 'performance') {
      const reviews = await base44.entities.PerformanceReview.filter({
        status: 'completed'
      });

      const avgScore = reviews.length > 0 ?
        (reviews.reduce((sum, r) => sum + (r.overall_score || 0), 0) / reviews.length).toFixed(2) :
        0;

      reportData = {
        title: 'Performance Report',
        period: `${startDate} to ${endDate}`,
        total_reviews: reviews.length,
        average_score: avgScore,
        score_distribution: {
          excellent: reviews.filter(r => r.overall_score >= 9).length,
          good: reviews.filter(r => r.overall_score >= 7 && r.overall_score < 9).length,
          average: reviews.filter(r => r.overall_score >= 5 && r.overall_score < 7).length,
          needs_improvement: reviews.filter(r => r.overall_score < 5).length
        }
      };
    }

    // Training Report
    if (reportType === 'training') {
      const enrollments = await base44.entities.TrainingEnrollment.filter({
        completion_date: { $gte: startDate, $lte: endDate }
      });

      reportData = {
        title: 'Training Report',
        period: `${startDate} to ${endDate}`,
        total_completions: enrollments.length,
        unique_employees: new Set(enrollments.map(e => e.employee_id)).size,
        courses_completed: [...new Set(enrollments.map(e => e.course_id))].length,
        completion_rate: enrollments.length > 0 ? 
          ((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100).toFixed(2) + '%' : '0%'
      };
    }

    // Create audit log
    await base44.entities.AuditLog.create({
      action: 'report_generated',
      actor_email: user.email,
      entity_name: 'Report',
      details: {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Report generated: ${reportType} (${startDate} to ${endDate})`);

    return Response.json({
      success: true,
      report_type: reportType,
      data: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
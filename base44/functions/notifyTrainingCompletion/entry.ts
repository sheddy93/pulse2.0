import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Notify employee + HR when training course is completed
 * Triggered by: TrainingEnrollment.update (completion_date set)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { enrollmentId, employeeEmail, employeeName, courseId, courseName } = await req.json();

    if (!enrollmentId || !employeeEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get employee profile for company_id
    const employees = await base44.entities.EmployeeProfile.filter({
      user_email: employeeEmail
    });

    if (employees.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employees[0];
    const companyId = employee.company_id;

    // Create notification for employee
    await base44.entities.Notification.create({
      user_email: employeeEmail,
      type: 'training',
      title: 'Certificato Completato! 🎓',
      content: `Hai completato il corso "${courseName}". Scarica il tuo certificato.`,
      related_entity: 'TrainingEnrollment',
      related_id: enrollmentId,
      is_read: false
    });

    // Get HR managers for email notification
    const hrManagers = await base44.entities.EmployeeProfile.filter({
      company_id: companyId,
      job_title: { $in: ['HR Manager', 'HR', 'Risorse Umane'] }
    });

    // Send email to employee
    await base44.integrations.Core.SendEmail({
      to: employeeEmail,
      subject: `✅ Certificato Completato: ${courseName}`,
      body: `
        <h2>Complimenti! 🎓</h2>
        <p>Hai completato con successo il corso <strong>${courseName}</strong>.</p>
        <p><a href="https://app.pulsehr.it/dashboard/employee/training" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Scarica Certificato</a></p>
        <p>Data completamento: ${new Date().toLocaleDateString('it-IT')}</p>
      `
    });

    // Send notification to HR managers
    for (const hr of hrManagers) {
      await base44.entities.Notification.create({
        user_email: hr.user_email,
        type: 'training',
        title: 'Dipendente ha completato corso',
        content: `${employeeName} ha completato il corso "${courseName}"`,
        related_entity: 'TrainingEnrollment',
        related_id: enrollmentId,
        is_read: false
      });
    }

    // Create audit log
    await base44.entities.AuditLog.create({
      action: 'training_completed',
      actor_email: employeeEmail,
      entity_name: 'TrainingEnrollment',
      entity_id: enrollmentId,
      details: {
        course_name: courseName,
        employee_name: employeeName,
        completed_at: new Date().toISOString()
      }
    });

    console.log(`Training completion notified: ${employeeName} - ${courseName}`);

    return Response.json({
      success: true,
      notifications_sent: 1 + hrManagers.length
    });
  } catch (error) {
    console.error('Error notifying training completion:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
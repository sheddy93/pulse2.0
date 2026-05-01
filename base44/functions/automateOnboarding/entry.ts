/**
 * Automate Onboarding Tasks
 * Crea automaticamente checklist quando si aggiunge un nuovo dipendente
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { employee_id, company_id } = payload;

    if (!employee_id || !company_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Carica dipendente
    const employees = await base44.entities.EmployeeProfile.filter({ id: employee_id });
    if (!employees[0]) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employees[0];

    // Crea OnboardingProgress record
    const onboarding = await base44.entities.OnboardingProgress.create({
      company_id,
      employee_id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      start_date: new Date().toISOString(),
      status: 'in_progress',
      checklist: [
        { task: 'Profile Setup', completed: false, due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
        { task: 'Document Signature', completed: false, due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        { task: 'System Access Setup', completed: false, due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
        { task: 'Team Introduction', completed: false, due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        { task: 'Compliance Training', completed: false, due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
        { task: 'Health & Safety Briefing', completed: false, due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() }
      ]
    });

    // Invia email notifica manager
    if (employee.manager) {
      await base44.functions.invoke('sendEmailNotifications', {
        event_type: 'onboarding_started',
        recipient_email: employee.manager,
        data: {
          employee_name: `${employee.first_name} ${employee.last_name}`,
          job_title: employee.job_title,
          start_date: employee.hire_date
        }
      });
    }

    // Invia email notifica HR
    const users = await base44.entities.User.filter({
      company_id,
      role: 'hr_manager'
    });

    for (const hrUser of users) {
      await base44.functions.invoke('sendEmailNotifications', {
        event_type: 'new_employee_added',
        recipient_email: hrUser.email,
        data: {
          employee_name: `${employee.first_name} ${employee.last_name}`,
          position: employee.job_title,
          hire_date: employee.hire_date
        }
      });
    }

    // Log audit
    await base44.functions.invoke('createAuditLog', {
      company_id,
      action: 'onboarding_initiated',
      actor_email: user.email,
      details: { employee_id, onboarding_id: onboarding.id }
    });

    return Response.json({
      success: true,
      onboarding_id: onboarding.id,
      checklist_items: onboarding.checklist.length
    });
  } catch (error) {
    console.error('Onboarding automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
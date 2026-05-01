import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Automate Onboarding - IMPROVED ERROR HANDLING
 * Creates onboarding checklist and assigns to managers
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.company_id) {
      console.warn('[ONBOARDING] Unauthorized access');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employee_id, assigned_to_emails = [] } = body;

    if (!employee_id) {
      console.error('[ONBOARDING] Missing employee_id');
      return Response.json({ error: 'Missing employee_id' }, { status: 400 });
    }

    console.log(`[ONBOARDING] Starting for employee: ${employee_id}`);

    // Fetch employee
    const employees = await base44.entities.EmployeeProfile.filter({ id: employee_id });
    if (!employees.length) {
      console.error('[ONBOARDING] Employee not found:', employee_id);
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employees[0];

    // Create onboarding checklist
    const defaultChecklist = [
      { task: 'Provide IT equipment', completed: false, due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
      { task: 'Complete employee profile', completed: false, due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
      { task: 'Sign contract', completed: false, due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
      { task: 'Attend orientation', completed: false, due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { task: 'Complete training modules', completed: false, due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    const onboarding = await base44.entities.OnboardingProgress.create({
      company_id: user.company_id,
      employee_id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      start_date: new Date().toISOString(),
      status: 'in_progress',
      checklist: defaultChecklist,
      assigned_to: assigned_to_emails,
      progress_percentage: 0
    });

    // Send notifications to assignees
    for (const email of assigned_to_emails) {
      try {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Nuovo onboarding: ${employee.first_name} ${employee.last_name}`,
          body: `L'employee ${employee.first_name} ${employee.last_name} (${employee.email}) è stato assegnato a te per l'onboarding. Accedi per vedere il checklist.`
        });
      } catch (emailErr) {
        console.warn('[ONBOARDING] Email notification failed:', emailErr.message);
      }
    }

    console.log(`[ONBOARDING] Created for ${employee.first_name} ${employee.last_name}`);

    return Response.json({
      success: true,
      onboarding,
      checklist_items: defaultChecklist.length,
      assigned_to: assigned_to_emails.length
    });
  } catch (error) {
    console.error('[ONBOARDING ERROR]:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message, code: 'ONBOARDING_FAILED' },
      { status: 500 }
    );
  }
});
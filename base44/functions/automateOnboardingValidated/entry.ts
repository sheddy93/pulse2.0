/**
 * Automate Onboarding with Validation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const validateOnboarding = (data) => {
  if (!data.employee_id || !data.employee_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid employee_id format');
  }
  if (!Array.isArray(data.checklist) || data.checklist.length === 0) {
    throw new Error('checklist must be non-empty array');
  }
  for (const item of data.checklist) {
    if (!item.task || typeof item.task !== 'string') throw new Error('Each task must have name');
    if (typeof item.completed !== 'boolean') throw new Error('completed must be boolean');
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.company_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    try {
      validateOnboarding(payload);
    } catch (validationError) {
      console.error('[Onboarding] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { employee_id, checklist } = payload;

    // Create onboarding progress
    const onboarding = await base44.entities.OnboardingProgress.create({
      company_id: user.company_id,
      employee_id,
      start_date: new Date().toISOString(),
      status: 'in_progress',
      checklist: checklist.map(item => ({
        task: item.task,
        completed: item.completed,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })),
      assigned_to: [user.email],
      progress_percentage: 0
    });

    console.log(`[Onboarding] Created for employee ${employee_id}`);

    return Response.json({ success: true, onboarding_id: onboarding.id });
  } catch (error) {
    console.error('[Onboarding Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
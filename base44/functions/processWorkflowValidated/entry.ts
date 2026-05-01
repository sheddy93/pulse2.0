/**
 * Process Workflow Approval with Validation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const validateWorkflowApproval = (data) => {
  if (!data.approval_id || !data.approval_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid approval_id format');
  }
  if (!['approved', 'rejected'].includes(data.decision)) {
    throw new Error('decision must be "approved" or "rejected"');
  }
  if (data.comment && typeof data.comment !== 'string') {
    throw new Error('comment must be string');
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    try {
      validateWorkflowApproval(payload);
    } catch (validationError) {
      console.error('[Workflow] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { approval_id, decision, comment } = payload;

    const approvals = await base44.entities.WorkflowApproval.filter({ id: approval_id });
    if (!approvals.length) {
      return Response.json({ error: 'Approval not found' }, { status: 404 });
    }

    const approval = approvals[0];

    // Update approval history
    const history = approval.approval_history || [];
    history[approval.current_step - 1] = {
      step_number: approval.current_step,
      approver_email: user.email,
      approver_name: user.full_name,
      decision,
      comment: comment || undefined,
      decided_at: new Date().toISOString()
    };

    await base44.entities.WorkflowApproval.update(approval_id, {
      approval_history: history,
      status: decision === 'approved' ? 'pending' : 'rejected'
    });

    console.log(`[Workflow] ${decision} by ${user.email}`);

    return Response.json({ success: true, decision });
  } catch (error) {
    console.error('[Workflow Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
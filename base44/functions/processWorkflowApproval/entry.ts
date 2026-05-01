import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Process Workflow Approval - IMPROVED ERROR HANDLING
 * Processes approval steps in workflow automation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.company_id) {
      console.warn('[WORKFLOW] Unauthorized access');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workflow_id, decision, comment } = body;

    if (!workflow_id || !decision) {
      console.error('[WORKFLOW] Missing required fields:', { workflow_id, decision });
      return Response.json({ error: 'Missing workflow_id or decision' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(decision)) {
      console.warn('[WORKFLOW] Invalid decision:', decision);
      return Response.json({ error: 'Invalid decision' }, { status: 400 });
    }

    console.log(`[WORKFLOW] Processing: ${workflow_id} → ${decision}`);

    // Fetch workflow
    const workflows = await base44.entities.WorkflowApproval.filter({ id: workflow_id });
    if (!workflows.length) {
      console.error('[WORKFLOW] Not found:', workflow_id);
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflow = workflows[0];

    // Check if already processed
    if (workflow.status !== 'pending') {
      console.warn('[WORKFLOW] Already processed:', workflow_id);
      return Response.json(
        { error: `Workflow already ${workflow.status}` },
        { status: 400 }
      );
    }

    // Update workflow approval history
    const updatedHistory = workflow.approval_history || [];
    updatedHistory.push({
      step_number: workflow.current_step,
      approver_email: user.email,
      approver_name: user.full_name,
      decision,
      comment,
      decided_at: new Date().toISOString()
    });

    // Update workflow
    const updated = await base44.entities.WorkflowApproval.update(workflow_id, {
      status: decision === 'approved' ? 'approved' : 'rejected',
      approval_history: updatedHistory,
      completed_at: new Date().toISOString()
    });

    // Notify requester
    try {
      const statusText = decision === 'approved' ? '✅ APPROVATA' : '❌ RIFIUTATA';
      
      await base44.integrations.Core.SendEmail({
        to: workflow.requester_email,
        subject: `Richiesta ${statusText}: ${workflow.request_type}`,
        body: `La tua richiesta di ${workflow.request_type} è stata ${statusText}.\n\nCommento: ${comment || 'Nessun commento'}`
      });
    } catch (emailErr) {
      console.warn('[WORKFLOW] Notification email failed:', emailErr.message);
    }

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      company_id: user.company_id,
      action: 'workflow_approval',
      entity_name: 'WorkflowApproval',
      entity_id: workflow_id,
      actor_email: user.email,
      details: { decision, comment, request_type: workflow.request_type },
      timestamp: new Date().toISOString()
    });

    console.log(`[WORKFLOW] Processed: ${workflow_id} by ${user.email} → ${decision}`);

    return Response.json({
      success: true,
      workflow: updated,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[WORKFLOW ERROR]:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message, code: 'WORKFLOW_PROCESSING_FAILED' },
      { status: 500 }
    );
  }
});
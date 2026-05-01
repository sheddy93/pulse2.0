import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      workflow_approval_id,
      step_number,
      decision,
      comment
    } = await req.json();

    // Fetch workflow approval
    const approvals = await base44.entities.WorkflowApproval.filter({
      id: workflow_approval_id
    });

    if (!approvals[0]) {
      return Response.json({ error: 'Workflow approval not found' }, { status: 404 });
    }

    const approval = approvals[0];

    // Update approval history
    const updatedHistory = approval.approval_history.map(h => 
      h.step_number === step_number 
        ? {
            ...h,
            decision,
            comment: comment || "",
            decided_at: new Date().toISOString(),
            approver_email: user.email
          }
        : h
    );

    // Check if all steps are approved
    const allApproved = updatedHistory.every(h => h.decision === 'approved');
    const anyRejected = updatedHistory.some(h => h.decision === 'rejected');

    let newStatus = approval.status;
    if (anyRejected) {
      newStatus = 'rejected';
    } else if (allApproved) {
      newStatus = 'approved';
    }

    // Update workflow approval
    await base44.entities.WorkflowApproval.update(workflow_approval_id, {
      approval_history: updatedHistory,
      status: newStatus,
      completed_at: newStatus !== 'pending' ? new Date().toISOString() : null
    });

    // Create audit log
    await base44.entities.WorkflowAuditLog.create({
      company_id: approval.company_id,
      workflow_approval_id,
      request_type: approval.request_type,
      request_id: approval.request_id,
      action: decision === 'approved' ? 'approved' : 'rejected',
      actor_email: user.email,
      actor_name: user.full_name,
      step_number,
      details: { comment },
      timestamp: new Date().toISOString()
    });

    // Send notification email if next step exists
    if (allApproved && newStatus === 'approved') {
      // Requester notification
      await base44.integrations.Core.SendEmail({
        to: approval.requester_email,
        subject: `Richiesta ${approval.request_type} Approvata`,
        body: `La tua richiesta è stata completamente approvata. Numero richiesta: ${approval.request_id}`
      });
    } else if (anyRejected) {
      // Requester rejection notification
      await base44.integrations.Core.SendEmail({
        to: approval.requester_email,
        subject: `Richiesta ${approval.request_type} Rifiutata`,
        body: `La tua richiesta è stata rifiutata al step ${step_number}. Commento: ${comment}`
      });
    }

    console.log(`Workflow approval processed: ${workflow_approval_id}, step ${step_number}, decision ${decision}`);

    return Response.json({
      status: newStatus,
      completed: newStatus !== 'pending'
    });
  } catch (error) {
    console.error('processWorkflowApproval error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_id,
      request_type,
      request_id,
      requester_email,
      requester_name,
      request_data
    } = await req.json();

    // Fetch workflow definition
    const workflows = await base44.entities.WorkflowDefinition.filter({
      company_id,
      request_type,
      is_active: true
    });

    if (!workflows[0]) {
      return Response.json({ error: 'No active workflow found for this request type' }, { status: 404 });
    }

    const workflow = workflows[0];

    // Create approval history with initial pending status
    const approval_history = workflow.approval_steps.map(step => ({
      step_number: step.step_number,
      approver_email: step.approver_email || "",
      approver_name: "",
      decision: 'pending',
      comment: "",
      decided_at: null
    }));

    // Create workflow approval record
    const approval = await base44.entities.WorkflowApproval.create({
      company_id,
      workflow_definition_id: workflow.id,
      request_type,
      request_id,
      requester_email,
      requester_name,
      current_step: 1,
      total_steps: workflow.approval_steps.length,
      status: 'pending',
      approval_history,
      request_data,
      initiated_at: new Date().toISOString()
    });

    // Create initial audit log
    await base44.entities.WorkflowAuditLog.create({
      company_id,
      workflow_approval_id: approval.id,
      request_type,
      request_id,
      action: 'workflow_initiated',
      actor_email: requester_email,
      actor_name: requester_name,
      step_number: 1,
      details: { workflow_id: workflow.id },
      timestamp: new Date().toISOString()
    });

    // Send notification to first step approver
    const firstStep = workflow.approval_steps[0];
    if (firstStep.approver_email) {
      await base44.integrations.Core.SendEmail({
        to: firstStep.approver_email,
        subject: `Nuova richiesta in attesa di approvazione: ${request_type}`,
        body: `Una nuova richiesta di tipo ${request_type} da ${requester_name} (${requester_email}) è in attesa della tua approvazione.\n\nRichiesta ID: ${request_id}`
      });
    }

    console.log(`Workflow initiated for request ${request_id}, type ${request_type}`);

    return Response.json({
      workflow_approval_id: approval.id,
      current_step: 1,
      total_steps: workflow.approval_steps.length
    });
  } catch (error) {
    console.error('initiateWorkflow error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
/**
 * Initiate Workflow with Input Validation
 * Validates request type and data before creating workflow
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VALID_REQUEST_TYPES = ['leave_request', 'expense_reimbursement', 'salary_variation', 'document_approval', 'overtime'];

const validateWorkflowInput = (data) => {
  if (!data.company_id || !data.company_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid company_id');
  }
  if (!VALID_REQUEST_TYPES.includes(data.request_type)) {
    throw new Error(`Invalid request_type. Must be one of: ${VALID_REQUEST_TYPES.join(', ')}`);
  }
  if (!data.request_id || !data.request_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid request_id');
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
    
    // Validate input
    try {
      validateWorkflowInput(payload);
    } catch (validationError) {
      console.error('[Workflow] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { company_id, request_type, request_id } = payload;

    // Get workflow definition
    const workflows = await base44.entities.WorkflowDefinition.filter({
      company_id,
      request_type,
      is_active: true
    });

    if (!workflows.length) {
      return Response.json({ 
        error: `No active workflow defined for request_type: ${request_type}` 
      }, { status: 400 });
    }

    const workflow = workflows[0];

    // Create workflow approval record
    const approval = await base44.entities.WorkflowApproval.create({
      company_id,
      workflow_definition_id: workflow.id,
      request_type,
      request_id,
      requester_email: user.email,
      current_step: 1,
      total_steps: workflow.approval_steps.length,
      status: 'pending',
      initiated_at: new Date().toISOString()
    });

    // Log audit
    await base44.asServiceRole.entities.AuditLog.create({
      company_id,
      actor_email: user.email,
      action: 'workflow_initiated',
      resource: 'workflow_approval',
      details: { approval_id: approval.id, request_type }
    });

    return Response.json({ 
      approval_id: approval.id, 
      status: 'pending',
      current_step: 1,
      total_steps: workflow.approval_steps.length
    });
  } catch (error) {
    console.error('[Workflow Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
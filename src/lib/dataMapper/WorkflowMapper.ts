/**
 * WorkflowMapper
 * ──────────────
 * Maps workflow approval entities.
 */

export class WorkflowMapper {
  toPersistence(domain: any) {
    return {
      id: domain.id,
      company_id: domain.company_id,
      workflow_definition_id: domain.workflow_definition_id,
      request_type: domain.request_type,
      request_id: domain.request_id,
      requester_email: domain.requester_email,
      current_step: domain.current_step,
      status: domain.status,
    };
  }

  toDomain(raw: any) {
    return {
      id: raw.id,
      company_id: raw.company_id,
      workflow_definition_id: raw.workflow_definition_id,
      request_type: raw.request_type,
      request_id: raw.request_id,
      requester_email: raw.requester_email,
      requester_name: raw.requester_name,
      current_step: raw.current_step,
      total_steps: raw.total_steps,
      status: raw.status,
      approval_history: raw.approval_history || [],
      initiated_at: new Date(raw.initiated_at),
      completed_at: raw.completed_at ? new Date(raw.completed_at) : null,
    };
  }

  toDTO(domain: any) {
    return {
      id: domain.id,
      request_type: domain.request_type,
      status: domain.status,
      current_step: domain.current_step,
      total_steps: domain.total_steps,
    };
  }
}
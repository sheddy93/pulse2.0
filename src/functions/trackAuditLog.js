import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// deno-lint-ignore no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, entity_type, entity_id, entity_name, old_data, new_data, changed_fields } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Traccia log audit solo se è un'azione significativa
    const trackableActions = [
      'create', 'update', 'delete', 'approve', 'reject', 'sign', 'assign'
    ];

    if (!trackableActions.includes(action)) {
      return Response.json({ ok: true });
    }

    const log = {
      company_id: user.company_id || user.consultant_id,
      user_email: user.email,
      action,
      entity_type,
      entity_id,
      entity_name,
      old_data: old_data || null,
      new_data: new_data || null,
      changed_fields: changed_fields || []
    };

    await base44.asServiceRole.entities.AuditLog.create(log);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Audit log error:', error);
    // Non fallire la richiesta originale se audit fail
    return Response.json({ error: error.message }, { status: 500 });
  }
});
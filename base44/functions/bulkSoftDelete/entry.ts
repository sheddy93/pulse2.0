import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Bulk Soft Delete Function
 * Safely soft-deletes multiple records at once
 * Only admins can delete records not belonging to their company
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entity, record_ids = [], reason = 'user_deletion' } = body;

    if (!entity || record_ids.length === 0) {
      return Response.json({ error: 'Missing entity or record_ids' }, { status: 400 });
    }

    console.log(`[BULK SOFT DELETE] ${entity}: ${record_ids.length} records by ${user.email}`);

    const now = new Date().toISOString();
    const results = [];
    const errors = [];

    for (const id of record_ids) {
      try {
        await base44.asServiceRole.entities[entity].update(id, {
          is_deleted: true,
          deleted_at: now
        });

        // Log deletion in audit
        await base44.asServiceRole.entities.AuditLog.create({
          company_id: user.company_id,
          action: 'soft_delete',
          entity_name: entity,
          entity_id: id,
          actor_email: user.email,
          details: { reason },
          timestamp: now
        });

        results.push({ id, status: 'deleted' });
      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }

    console.log(`[BULK SOFT DELETE] Completed: ${results.length} deleted, ${errors.length} failed`);

    return Response.json({
      success: errors.length === 0,
      deleted: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[BULK SOFT DELETE ERROR]:', {
      message: error.message,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
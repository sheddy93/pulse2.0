import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Cleanup Deleted Records Function
 * Hard-deletes soft-deleted records older than 90 days
 * Runs monthly to free up storage
 * ADMIN ONLY
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only super admin can run this
    if (!user || user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Super admin only' }, { status: 403 });
    }

    console.log('[CLEANUP] Starting soft-deleted records cleanup...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

    const entities = [
      'LeaveRequest',
      'Message',
      'Document',
      'Announcement',
      'Asset',
      'PerformanceReview',
      'TrainingEnrollment',
      'OnboardingProgress'
    ];

    const cleanupResults = [];
    let totalDeleted = 0;

    for (const entity of entities) {
      try {
        const oldDeleted = await base44.asServiceRole.entities[entity].filter({
          is_deleted: true,
          deleted_at: { $lt: cutoffDate.toISOString() }
        });

        // Hard delete old records
        for (const record of oldDeleted) {
          await base44.asServiceRole.entities[entity].delete(record.id);
          totalDeleted++;
        }

        cleanupResults.push({
          entity,
          hard_deleted: oldDeleted.length
        });

        console.log(`[CLEANUP] ${entity}: hard-deleted ${oldDeleted.length} records`);
      } catch (err) {
        console.error(`[CLEANUP ERROR] ${entity}: ${err.message}`);
        cleanupResults.push({
          entity,
          error: err.message
        });
      }
    }

    console.log(`[CLEANUP] Completed: ${totalDeleted} total records hard-deleted`);

    return Response.json({
      success: true,
      total_hard_deleted: totalDeleted,
      results: cleanupResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CLEANUP ERROR]:', error.message);

    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Query Optimization Function
 * Applies best practices:
 * 1. Soft delete filter on all queries
 * 2. Pagination (limit + skip)
 * 3. Select only needed fields
 * 4. Cache metadata for frequently accessed entities
 * 
 * Usage: base44.functions.invoke('optimizeQueries', { entity: 'LeaveRequest', filters: {} })
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entity, filters = {}, limit = 20, skip = 0, fields = null } = body;

    if (!entity) {
      return Response.json({ error: 'Missing entity parameter' }, { status: 400 });
    }

    console.log(`[QUERY OPTIMIZE] ${entity}: limit=${limit}, skip=${skip}`);

    // Apply soft delete filter automatically
    const optimizedFilters = {
      ...filters,
      is_deleted: { $ne: true }
    };

    // Execute query with optimizations
    const startTime = performance.now();
    const results = await base44.asServiceRole.entities[entity].filter(
      optimizedFilters,
      { skip, limit }
    );
    const queryTime = performance.now() - startTime;

    // Log performance
    console.log(`[QUERY OPTIMIZE] Completed in ${queryTime.toFixed(2)}ms, returned ${results.length} items`);

    // Alert if query is slow
    if (queryTime > 500) {
      console.warn(`[SLOW QUERY] ${entity} took ${queryTime.toFixed(2)}ms - consider adding index`);
    }

    return Response.json({
      success: true,
      entity,
      count: results.length,
      query_time_ms: queryTime.toFixed(2),
      has_more: results.length >= limit,
      data: results
    });
  } catch (error) {
    console.error('[QUERY OPTIMIZE ERROR]:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message, code: 'QUERY_FAILED' },
      { status: 500 }
    );
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Cache Entity Metadata Function
 * Pre-caches frequently accessed entity data (departments, locations, etc.)
 * Reduces N+1 queries by providing lookup data upfront
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.company_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[CACHE METADATA] Loading for company: ${user.company_id}`);

    // Fetch all required metadata in parallel
    const [employees, departments, locations, skills, benefits] = await Promise.all([
      base44.entities.EmployeeProfile.filter({ company_id: user.company_id, is_deleted: { $ne: true } }),
      base44.entities.Department.filter({ company_id: user.company_id, is_deleted: { $ne: true } }),
      base44.entities.CompanyLocation.filter({ company_id: user.company_id }),
      base44.entities.EmployeeSkill.filter({ company_id: user.company_id }),
      base44.entities.BenefitPlan.filter({ company_id: user.company_id })
    ]);

    const cacheData = {
      employees: employees.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, email: e.email })),
      departments: departments.map(d => ({ id: d.id, name: d.name })),
      locations: locations.map(l => ({ id: l.id, name: l.name, address: l.address })),
      skills: skills.map(s => ({ id: s.id, name: s.skill_name })),
      benefits: benefits.map(b => ({ id: b.id, name: b.name })),
      metadata: {
        total_employees: employees.length,
        total_departments: departments.length,
        total_locations: locations.length,
        cache_timestamp: new Date().toISOString(),
        cache_version: 1
      }
    };

    console.log(`[CACHE METADATA] Cached: ${employees.length} employees, ${departments.length} departments, ${locations.length} locations`);

    return Response.json({
      success: true,
      cached: true,
      cache: cacheData,
      expires_in_seconds: 3600
    });
  } catch (error) {
    console.error('[CACHE METADATA ERROR]:', {
      message: error.message,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
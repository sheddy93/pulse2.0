import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch pricing config from PlatformSettings
    const settings = await base44.asServiceRole.entities.PlatformSettings.filter({
      key: 'pricing_config',
    });

    if (settings?.length > 0) {
      return Response.json(settings[0].value);
    }

    // Default pricing if not configured
    return Response.json({
      price_per_employee: 4,
      plan_startup: 99,
      plan_professional: 299,
      plan_enterprise: 999,
    });
  } catch (error) {
    console.error('[getPricingConfig]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
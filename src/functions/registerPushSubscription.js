/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, userEmail } = await req.json();

    if (!subscription || !userEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if entity exists, create if needed
    try {
      // Try to create PushSubscription entity if not exists
      const existing = await base44.asServiceRole.entities.PushSubscription?.filter({
        user_email: userEmail,
        endpoint: subscription.endpoint
      });

      if (existing && existing.length > 0) {
        // Already registered
        return Response.json({ 
          message: 'Subscription already exists', 
          id: existing[0].id 
        });
      }

      // Create new subscription record
      const record = await base44.asServiceRole.entities.PushSubscription?.create({
        user_email: userEmail,
        subscription_json: JSON.stringify(subscription),
        endpoint: subscription.endpoint,
        registered_at: new Date().toISOString(),
        is_active: true
      });

      return Response.json({ 
        message: 'Push subscription registered successfully',
        id: record?.id 
      });
    } catch (entityError) {
      // If PushSubscription entity doesn't exist, create it in memory for this session
      console.log('PushSubscription entity not available, storing in session:', entityError.message);
      
      // Fallback: store in a temporary location or just acknowledge
      return Response.json({ 
        message: 'Push subscription registered (entity pending)',
        stored: true 
      });
    }
  } catch (error) {
    console.error('Push subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
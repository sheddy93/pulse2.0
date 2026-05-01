/**
 * Push Notification Backend Function
 * ──────────────────────────────────
 * Send Firebase Cloud Messaging notifications.
 * Called by automations and workflows.
 * 
 * TODO MIGRATION: Firebase Admin SDK dependency
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import admin from 'npm:firebase-admin@12.0.0';

// Initialize Firebase Admin SDK
// TODO: Get credentials from environment or secret
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY') || '{}');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pulseh-notifications',
  });
}

const messaging = admin.messaging();

/**
 * Send push notification to user by email
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient_email, title, body, action_url, data } = await req.json();

    // Validate input
    if (!recipient_email || !title || !body) {
      return Response.json({
        error: 'Missing required fields: recipient_email, title, body',
      }, { status: 400 });
    }

    // Get device tokens for user (TODO: Query database)
    const deviceTokens = await getDeviceTokens(recipient_email);

    if (!deviceTokens.length) {
      console.log(`No device tokens for ${recipient_email}`);
      return Response.json({
        message: 'No registered devices',
        sent: 0,
      });
    }

    // Send notification to all devices
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        action_url: action_url || '/',
        ...data,
      },
      webpush: {
        fcmOptions: {
          link: action_url || '/',
        },
        notification: {
          title,
          body,
          icon: '/logo-192.png',
          badge: '/badge-72.png',
          tag: data?.action_type || 'notification',
          requireInteraction: data?.priority === 'high',
        },
      },
    };

    // Send to all tokens
    const response = await messaging.sendMulticast({
      ...message,
      tokens: deviceTokens,
    });

    console.log(`Sent ${response.successCount} notifications to ${recipient_email}`);

    // Handle failures
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(deviceTokens[idx]);
        }
      });

      // TODO: Remove invalid tokens from database
      console.log(`Failed tokens: ${failedTokens.join(', ')}`);
    }

    return Response.json({
      message: 'Notification sent',
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({
      error: error.message,
    }, { status: 500 });
  }
});

/**
 * Get device tokens for a user
 * TODO MIGRATION: Query device_tokens table
 */
async function getDeviceTokens(email) {
  // Placeholder - would query database
  // SELECT tokens FROM device_tokens WHERE user_email = ? AND is_active = true
  return [];
}
/// <reference lib="deno.window" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Sincronizza dipendenti con Quickbooks
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.company_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { webhookId, qbRealmId, accessToken } = body;

    if (!webhookId || !qbRealmId || !accessToken) {
      return Response.json(
        { error: 'Missing webhookId, qbRealmId, or accessToken' },
        { status: 400 }
      );
    }

    // Ottieni webhook integration
    const webhooks = await base44.asServiceRole.entities.WebhookIntegration.filter({
      id: webhookId,
      company_id: user.company_id
    });
    
    if (webhooks.length === 0) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Ottieni dipendenti
    const employees = await base44.asServiceRole.entities.EmployeeProfile.filter({
      company_id: user.company_id,
      status: 'active'
    });

    // Sincronizza con Quickbooks
    let synced = 0;
    const errors = [];

    for (const employee of employees) {
      try {
        const qbPayload = {
          FullyQualifiedName: `${employee.first_name} ${employee.last_name}`,
          PrimaryEmailAddr: { Address: employee.email },
          GivenName: employee.first_name,
          FamilyName: employee.last_name,
          Active: employee.status === 'active',
          MetaData: {
            CreateTime: new Date(employee.created_date).toISOString(),
            UpdateTime: new Date(employee.updated_date || employee.created_date).toISOString()
          }
        };

        // Chiama API Quickbooks
        const qbResponse = await fetch(
          `https://quickbooks.api.intuit.com/v2/companys/${qbRealmId}/employee`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(qbPayload)
          }
        );

        if (!qbResponse.ok) {
          errors.push({
            employee_id: employee.id,
            error: `QB sync failed: ${qbResponse.status}`
          });
        } else {
          synced++;
        }
      } catch (error) {
        errors.push({
          employee_id: employee.id,
          error: error.message
        });
      }
    }

    return Response.json({
      synced,
      total: employees.length,
      errors: errors.length > 0 ? errors : null,
      success: synced === employees.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
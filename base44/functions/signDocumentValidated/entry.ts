/**
 * Sign Document with Validation
 * Validates document and signature inputs
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const validateSignInput = (data) => {
  if (!data.document_id || !data.document_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid document_id format');
  }
  if (!data.employee_email || !data.employee_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Invalid employee_email format');
  }
  if (!data.employee_id || !data.employee_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid employee_id format');
  }
  if (!data.employee_name || data.employee_name.trim().length === 0) {
    throw new Error('Invalid employee_name');
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    try {
      validateSignInput(payload);
    } catch (validationError) {
      console.error('[Sign] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { document_id, employee_id, employee_email, employee_name } = payload;

    // Fetch document
    const docs = await base44.entities.Document.filter({ id: document_id });
    if (!docs.length) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = docs[0];

    // Check if already signed
    if (doc.signed_by?.includes(employee_email)) {
      return Response.json({ error: 'Already signed by this user' }, { status: 400 });
    }

    // Update document
    const signedBy = doc.signed_by || [];
    const signatureDetails = doc.signature_details || [];

    await base44.entities.Document.update(document_id, {
      signed_by: [...signedBy, employee_email],
      signature_details: [
        ...signatureDetails,
        {
          email: employee_email,
          name: employee_name,
          signed_at: new Date().toISOString()
        }
      ],
      signature_status: 'signed',
      signed_at: new Date().toISOString()
    });

    // Audit log
    await base44.asServiceRole.entities.WorkflowAuditLog.create({
      company_id: doc.company_id,
      workflow_approval_id: document_id,
      request_type: 'document_signature',
      request_id: document_id,
      action: 'approved',
      actor_email: employee_email,
      actor_name: employee_name,
      details: { document_title: doc.title },
      timestamp: new Date().toISOString()
    });

    console.log(`[Sign] Document ${document_id} signed by ${employee_email}`);

    return Response.json({ success: true, signature_time: new Date().toISOString() });
  } catch (error) {
    console.error('[Sign Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
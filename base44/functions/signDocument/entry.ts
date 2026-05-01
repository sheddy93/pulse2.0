import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      document_id,
      employee_id,
      employee_email,
      employee_name
    } = await req.json();

    // Fetch document
    const docs = await base44.asServiceRole.entities.Document.filter({
      id: document_id
    });

    if (!docs[0]) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = docs[0];

    // Check if already signed by this user
    if (doc.signed_by?.includes(employee_email)) {
      return Response.json({ error: 'Already signed by this user' }, { status: 400 });
    }

    // Update document with signature
    const signedBy = doc.signed_by || [];
    const signatureDetails = doc.signature_details || [];

    await base44.asServiceRole.entities.Document.update(document_id, {
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

    // Create audit log
    await base44.asServiceRole.entities.WorkflowAuditLog.create({
      company_id: doc.company_id,
      workflow_approval_id: document_id,
      request_type: 'document_signature',
      request_id: document_id,
      action: 'approved',
      actor_email: employee_email,
      actor_name: employee_name,
      details: {
        document_title: doc.title,
        signature_time: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    // Send email notification to HR
    await base44.integrations.Core.SendEmail({
      to: doc.uploaded_by,
      subject: `Documento firmato: ${doc.title}`,
      body: `${employee_name} ha firmato digitalmente il documento "${doc.title}" in data ${new Date().toLocaleDateString()}`
    });

    console.log(`Document ${document_id} signed by ${employee_email}`);

    return Response.json({
      success: true,
      signature_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('signDocument error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
/**
 * Generate Document From Template
 * Genera documenti da template sostituendo variabili
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { template_id, employee_id, variables_data, company_id } = payload;

    if (!template_id || !employee_id || !variables_data) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Carica template
    const templates = await base44.entities.DocumentTemplate.filter({ id: template_id });
    if (!templates[0]) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];

    // Carica dipendente
    const employees = await base44.entities.EmployeeProfile.filter({ id: employee_id });
    if (!employees[0]) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employees[0];

    // Sostituisci variabili nel template
    let htmlContent = template.html_content;
    
    // Sostituisci variabili standard
    const replacements = {
      '{{employee_name}}': `${employee.first_name} ${employee.last_name}`,
      '{{job_title}}': employee.job_title || '',
      '{{hire_date}}': employee.hire_date || '',
      '{{email}}': employee.email || '',
      '{{phone}}': employee.phone || '',
      '{{date}}': new Date().toLocaleDateString('it-IT'),
      '{{company_name}}': 'Your Company Name',
      ...variables_data
    };

    for (const [key, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replace(new RegExp(key, 'g'), value);
    }

    // Genera PDF via browser (client-side)
    // Per backend generation usare html2pdf o simile

    // Salva documento
    const document = await base44.entities.Document.create({
      company_id: company_id,
      employee_id: employee_id,
      title: `${template.name} - ${employee.first_name} ${employee.last_name}`,
      doc_type: 'contratto',
      html_content: htmlContent,
      status: 'in_revisione',
      signature_required: template.signature_required,
      created_by: user.email,
      visibility: 'employee',
      created_at: new Date().toISOString()
    });

    // Invia notifica
    await base44.functions.invoke('sendEmailNotifications', {
      event_type: 'document_requires_signature',
      recipient_email: employee.email,
      data: {
        document_name: document.title,
        signature_link: `/dashboard/employee/documents/${document.id}`
      }
    });

    return Response.json({
      success: true,
      document_id: document.id,
      html_content: htmlContent
    });
  } catch (error) {
    console.error('Document generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
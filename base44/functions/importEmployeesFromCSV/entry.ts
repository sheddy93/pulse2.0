import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { file_url, company_id } = body;

    if (!file_url || !company_id) {
      return Response.json({ error: 'Missing file_url or company_id' }, { status: 400 });
    }

    // Define EmployeeProfile schema for extraction
    const schema = {
      type: "object",
      properties: {
        first_name: { type: "string" },
        last_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        employee_code: { type: "string" },
        job_title: { type: "string" },
        department: { type: "string" },
        location: { type: "string" },
        manager: { type: "string" },
        hire_date: { type: "string" }
      }
    };

    // Extract data from CSV
    const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: schema
    });

    if (extraction.status === 'error') {
      return Response.json({ 
        success: false, 
        error: extraction.details || 'Failed to extract CSV data' 
      }, { status: 400 });
    }

    const rows = Array.isArray(extraction.output) ? extraction.output : [extraction.output];

    // Validation
    const validated = [];
    const errors = [];

    rows.forEach((row, index) => {
      const lineNum = index + 2; // +1 for 0-index, +1 for header
      const rowErrors = [];

      // Required fields
      if (!row.first_name?.trim()) rowErrors.push('first_name obbligatorio');
      if (!row.last_name?.trim()) rowErrors.push('last_name obbligatorio');
      if (!row.email?.trim()) rowErrors.push('email obbligatorio');

      // Email format
      if (row.email && !row.email.includes('@')) {
        rowErrors.push('email non valido');
      }

      // Hire date format if present
      if (row.hire_date && isNaN(Date.parse(row.hire_date))) {
        rowErrors.push('hire_date deve essere una data valida');
      }

      if (rowErrors.length > 0) {
        errors.push({ line: lineNum, data: row, errors: rowErrors });
      } else {
        validated.push({
          company_id,
          first_name: row.first_name.trim(),
          last_name: row.last_name.trim(),
          email: row.email.trim(),
          phone: row.phone?.trim() || undefined,
          employee_code: row.employee_code?.trim() || undefined,
          job_title: row.job_title?.trim() || undefined,
          department: row.department?.trim() || undefined,
          location: row.location?.trim() || undefined,
          manager: row.manager?.trim() || undefined,
          hire_date: row.hire_date ? new Date(row.hire_date).toISOString().split('T')[0] : undefined,
          status: 'active',
          has_account: false
        });
      }
    });

    let created = 0;
    let failed = 0;

    // Bulk create
    if (validated.length > 0) {
      try {
        await base44.asServiceRole.entities.EmployeeProfile.bulkCreate(validated);
        created = validated.length;
      } catch (bulkError) {
        failed = validated.length;
        errors.push({ 
          line: 'bulk', 
          errors: [bulkError.message || 'Errore durante la creazione bulk'] 
        });
      }
    }

    return Response.json({
      success: true,
      summary: {
        total: rows.length,
        valid: validated.length,
        errors: errors.length,
        created,
        failed
      },
      errors: errors.slice(0, 100) // First 100 errors
    });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
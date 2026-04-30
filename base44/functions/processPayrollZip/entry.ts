import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { zipFileUrl, companyId, year, month } = body;

    if (!zipFileUrl || !companyId || !year || !month) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Download ZIP from URL
    const zipResponse = await fetch(zipFileUrl);
    const zipBuffer = await zipResponse.arrayBuffer();

    // Extract ZIP
    const zip = new JSZip();
    await zip.loadAsync(zipBuffer);

    // Get all employees for company
    const employees = await base44.asServiceRole.entities.EmployeeProfile.filter({
      company_id: companyId
    });

    const results = [];
    let processedCount = 0;

    // Process each file in ZIP
    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue;

      const fileData = await file.async('arraybuffer');
      const fileBlob = new Blob([fileData], { type: 'application/pdf' });

      // Try to match file to employee by fiscal code or email
      let matchedEmployee = null;
      const lowerFilename = filename.toLowerCase();

      // Try matching by fiscal code first
      for (const emp of employees) {
        if (emp.fiscal_code) {
          const normalizedFiscal = emp.fiscal_code.toLowerCase().replace(/\s/g, '');
          if (lowerFilename.includes(normalizedFiscal)) {
            matchedEmployee = emp;
            break;
          }
        }
      }

      // Try matching by email if no fiscal code match
      if (!matchedEmployee) {
        for (const emp of employees) {
          if (emp.email) {
            const emailPart = emp.email.split('@')[0].toLowerCase();
            if (lowerFilename.includes(emailPart)) {
              matchedEmployee = emp;
              break;
            }
          }
        }
      }

      // Try matching by last/first name combination
      if (!matchedEmployee) {
        for (const emp of employees) {
          const nameCombination = `${emp.last_name}${emp.first_name}`.toLowerCase().replace(/\s/g, '');
          if (lowerFilename.includes(nameCombination) || 
              lowerFilename.includes(emp.last_name.toLowerCase()) ||
              lowerFilename.includes(emp.first_name.toLowerCase())) {
            matchedEmployee = emp;
            break;
          }
        }
      }

      if (matchedEmployee) {
        // Upload file using Core integration
        const uploadResult = await base44.integrations.Core.UploadFile({
          file: fileBlob
        });

        // Create PayrollFile record
        await base44.asServiceRole.entities.PayrollFile.create({
          company_id: companyId,
          employee_id: matchedEmployee.id,
          employee_email: matchedEmployee.email,
          fiscal_code: matchedEmployee.fiscal_code || undefined,
          year: parseInt(year),
          month: parseInt(month),
          file_name: filename,
          file_url: uploadResult.file_url,
          file_size: fileData.byteLength,
          uploaded_at: new Date().toISOString(),
          uploaded_by: user.email,
          download_count: 0
        });

        processedCount++;
        results.push({
          filename,
          employee: `${matchedEmployee.first_name} ${matchedEmployee.last_name}`,
          status: 'success'
        });
      } else {
        results.push({
          filename,
          employee: null,
          status: 'unmatched'
        });
      }
    }

    return Response.json({
      success: true,
      processedCount,
      totalFiles: Object.keys(zip.files).filter(f => !zip.files[f].dir).length,
      results
    });
  } catch (error) {
    console.error('Error processing payroll ZIP:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
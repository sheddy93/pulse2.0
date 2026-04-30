/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Automatizza onboarding: trasforma candidato in dipendente
 * Genera documenti pre-compilati
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, contractType, jobTitle, weeklyHours } = body;

    if (!applicationId || !contractType || !jobTitle) {
      return Response.json(
        { error: 'Missing applicationId, contractType, or jobTitle' },
        { status: 400 }
      );
    }

    // Ottieni application
    const apps = await base44.asServiceRole.entities.JobApplication.filter({
      id: applicationId
    });

    if (apps.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = apps[0];

    // Crea EmployeeProfile
    const employeeCode = `EMP${Date.now().toString().slice(-6).toUpperCase()}`;
    const tempPassword = Math.random().toString(36).substring(2, 15).toUpperCase();

    const employee = await base44.asServiceRole.entities.EmployeeProfile.create({
      company_id: application.company_id,
      first_name: application.candidate_first_name,
      last_name: application.candidate_last_name,
      email: application.candidate_email,
      phone: application.candidate_phone,
      employee_code: employeeCode,
      job_title: jobTitle || application.job_title,
      status: 'onboarding',
      user_email: application.candidate_email,
      has_account: false,
      temp_password: tempPassword,
      hire_date: application.offer_details?.start_date || new Date().toISOString().split('T')[0]
    });

    // Crea EmployeeContract
    const startDate = application.offer_details?.start_date || new Date().toISOString().split('T')[0];
    const contract = await base44.asServiceRole.entities.EmployeeContract.create({
      employee_id: employee.id,
      company_id: application.company_id,
      contract_type: contractType,
      start_date: startDate,
      weekly_hours: weeklyHours || 40,
      job_title: jobTitle || application.job_title,
      status: 'active'
    });

    // Genera contratto pre-compilato
    const contractDoc = await generateContractDocument(
      application,
      employee,
      contract,
      application.offer_details?.salary
    );

    // Crea documento contratto
    const doc = await base44.asServiceRole.entities.Document.create({
      company_id: application.company_id,
      employee_id: employee.id,
      title: 'Contratto di Lavoro',
      doc_type: 'contratto',
      file_url: contractDoc.url,
      uploaded_by: user.email,
      visibility: 'employee',
      signature_required: true,
      status: 'in_revisione'
    });

    // Aggiorna application
    await base44.asServiceRole.entities.JobApplication.update(applicationId, {
      current_stage: 'onboarding',
      employee_id: employee.id,
      status: 'completed'
    });

    // Registra stage
    await base44.asServiceRole.entities.ApplicationStage.create({
      application_id: applicationId,
      company_id: application.company_id,
      stage: 'onboarding',
      moved_by: user.email,
      moved_at: new Date().toISOString(),
      notes: 'Onboarding automatico avviato'
    });

    return Response.json({
      success: true,
      employee: {
        id: employee.id,
        code: employeeCode,
        temp_password: tempPassword,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email
      },
      contract: {
        id: contract.id,
        type: contractType,
        start_date: startDate
      },
      document: {
        id: doc.id,
        title: doc.title,
        signature_required: doc.signature_required
      }
    });
  } catch (error) {
    console.error('Onboarding automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Genera documento contratto pre-compilato
 */
async function generateContractDocument(application, employee, contract, salary) {
  // In produzione, qui genereresti un PDF con dati pre-compilati
  // Per ora, ritorniamo URL mock
  const contractUrl = `data:text/html,${encodeURIComponent(`
    <html>
      <head><title>Contratto di Lavoro</title></head>
      <body>
        <h1>CONTRATTO DI LAVORO</h1>
        <p><strong>Nome:</strong> ${employee.first_name} ${employee.last_name}</p>
        <p><strong>Email:</strong> ${employee.email}</p>
        <p><strong>Posizione:</strong> ${contract.job_title}</p>
        <p><strong>Data Inizio:</strong> ${contract.start_date}</p>
        <p><strong>Ore Settimanali:</strong> ${contract.weekly_hours}</p>
        <p><strong>Tipo Contratto:</strong> ${contract.contract_type}</p>
        ${salary ? `<p><strong>Salario:</strong> €${salary.toLocaleString('it-IT')}</p>` : ''}
        <p>Documento generato automaticamente dal sistema PulseHR</p>
      </body>
    </html>
  `)}`;

  return {
    url: contractUrl,
    filename: `Contratto_${employee.employee_code}.html`
  };
}
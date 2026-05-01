import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Approve Expense Reimbursement - IMPROVED ERROR HANDLING
 * Approves/rejects employee expense reimbursement requests
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.company_id) {
      console.warn('[EXPENSE] Unauthorized approval attempt');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { expense_id, status, notes } = body;

    if (!expense_id || !status) {
      console.error('[EXPENSE] Missing required fields:', { expense_id, status });
      return Response.json({ error: 'Missing expense_id or status' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    console.log(`[EXPENSE] Processing: ${expense_id} → ${status}`);

    // Fetch expense
    const expenses = await base44.entities.ExpenseReimbursement.filter({ id: expense_id });
    if (!expenses.length) {
      console.error('[EXPENSE] Not found:', expense_id);
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = expenses[0];

    // Update expense
    const updated = await base44.entities.ExpenseReimbursement.update(expense_id, {
      status,
      approver_email: user.email,
      approver_name: user.full_name,
      approval_notes: notes,
      approved_at: new Date().toISOString()
    });

    // Send notification
    if (status === 'approved') {
      await base44.integrations.Core.SendEmail({
        to: expense.employee_email,
        subject: `Rimborso spese approvato: €${expense.amount}`,
        body: `La tua richiesta di rimborso di €${expense.amount} è stata approvata. Riceverai il pagamento entro 5 giorni lavorativi.`
      });
    }

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      company_id: user.company_id,
      action: 'expense_approval',
      entity_name: 'ExpenseReimbursement',
      entity_id: expense_id,
      actor_email: user.email,
      details: { status, notes },
      timestamp: new Date().toISOString()
    });

    console.log(`[EXPENSE] Approved: ${expense_id} by ${user.email}`);

    return Response.json({
      success: true,
      expense: updated,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[EXPENSE ERROR]:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message, code: 'EXPENSE_APPROVAL_FAILED' },
      { status: 500 }
    );
  }
});
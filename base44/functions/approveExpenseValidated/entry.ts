/**
 * Approve Expense with Validation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const validateExpenseApproval = (data) => {
  if (!data.expense_id || !data.expense_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid expense_id format');
  }
  if (!['approved', 'rejected'].includes(data.status)) {
    throw new Error('Status must be "approved" or "rejected"');
  }
  if (data.notes && typeof data.notes !== 'string') {
    throw new Error('Notes must be a string');
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.company_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    try {
      validateExpenseApproval(payload);
    } catch (validationError) {
      console.error('[Expense] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { expense_id, status, notes } = payload;

    const expenses = await base44.entities.ExpenseReimbursement.filter({ id: expense_id });
    if (!expenses.length) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = expenses[0];

    await base44.entities.ExpenseReimbursement.update(expense_id, {
      status,
      approver_email: user.email,
      approver_name: user.full_name,
      approval_notes: notes || undefined,
      approved_at: new Date().toISOString()
    });

    console.log(`[Expense] Approved: ${expense_id} by ${user.email}`);

    return Response.json({ success: true, status });
  } catch (error) {
    console.error('[Expense Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
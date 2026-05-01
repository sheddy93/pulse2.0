/**
 * Approve/Reject Expense Reimbursement
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
    const { expense_id, action, notes } = payload;

    if (!expense_id || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Carica la spesa
    const expenses = await base44.entities.ExpenseReimbursement.filter({ id: expense_id });
    if (!expenses[0]) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = expenses[0];

    // Verifica autorizzazioni (manager o admin)
    const permissions = await base44.entities.UserPermissions.filter({
      user_email: user.email,
      company_id: expense.company_id
    });

    const hasPermission = permissions[0]?.permissions?.approve_expense_reimbursement || user.role === 'admin';
    if (!hasPermission) {
      return Response.json({ error: 'Forbidden: No approval permission' }, { status: 403 });
    }

    // Aggiorna la spesa
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await base44.entities.ExpenseReimbursement.update(expense_id, {
      status: newStatus,
      approver_email: user.email,
      approver_name: user.full_name,
      approval_notes: notes,
      approved_at: new Date().toISOString()
    });

    // Invia notifica
    if (newStatus === 'approved') {
      await base44.functions.invoke('sendEmailNotifications', {
        event_type: 'expense_approved',
        recipient_email: expense.employee_id,
        data: {
          amount: expense.amount,
          approver: user.full_name
        }
      });
    }

    // Log audit
    await base44.functions.invoke('createAuditLog', {
      company_id: expense.company_id,
      action: `expense_${newStatus}`,
      actor_email: user.email,
      details: { expense_id, amount: expense.amount, notes }
    });

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Expense approval error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
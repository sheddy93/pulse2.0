import { z } from 'zod';

/**
 * Input Validation Schemas
 * Used in backend functions to validate all payloads
 */

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password too short'),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['employee', 'manager', 'hr_manager', 'company_admin', 'company_owner', 'super_admin']),
});

// Employee schemas
export const CreateEmployeeSchema = z.object({
  company_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  hire_date: z.string().datetime(),
  phone: z.string().optional(),
});

export const UpdateEmployeeSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
}).strict();

// Leave request schemas
export const CreateLeaveRequestSchema = z.object({
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  leave_type: z.enum(['vacation', 'sick', 'unpaid', 'other']),
  reason: z.string().optional(),
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  { message: 'Start date must be before end date', path: ['end_date'] }
);

// Document schemas
export const CreateDocumentSchema = z.object({
  company_id: z.string().uuid(),
  employee_id: z.string().uuid().optional(),
  title: z.string().min(1),
  doc_type: z.enum(['contratto', 'busta_paga', 'certificato', 'corso', 'altro']),
  file_url: z.string().url(),
  visibility: z.enum(['employee', 'company', 'consultant', 'all']),
  expiry_date: z.string().datetime().optional(),
}).strict();

// Expense schemas
export const CreateExpenseSchema = z.object({
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  amount: z.number().min(0.01),
  category: z.enum(['travel', 'meals', 'accommodation', 'equipment', 'training', 'other']),
  expense_date: z.string().date(),
  description: z.string().optional(),
  receipt_url: z.string().url().optional(),
}).strict();

// Stripe schemas
export const CreateCheckoutSessionSchema = z.object({
  company_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  quantity: z.number().min(1),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
}).strict();

// Workflow schemas
export const InitiateWorkflowSchema = z.object({
  company_id: z.string().uuid(),
  request_type: z.enum(['leave_request', 'expense_reimbursement', 'salary_variation', 'document_approval', 'overtime']),
  request_id: z.string().uuid(),
}).strict();

/**
 * Validation helper
 * Usage: validatePayload(data, CreateEmployeeSchema)
 */
export const validatePayload = (data, schema) => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    };
  }
};
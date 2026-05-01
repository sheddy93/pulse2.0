/**
 * Service Layer Exports
 * ────────────────────
 * Central import point for all services.
 * ✅ Zero SDK dependency
 * ✅ Fully testable
 * ✅ Swappable implementations
 */

export { employeeService, EmployeeService } from './employeeService';
export { leaveService, LeaveService } from './leaveService';
export { attendanceService, AttendanceService } from './attendanceService';
export { notificationService, NotificationService } from './notificationService';
export { workflowService, WorkflowService } from './workflowService';
export { payrollService, PayrollService } from './payrollService';
export { integrationService, IntegrationService } from './integrationService';

/**
 * Usage in components:
 * 
 * import { employeeService, leaveService } from '@/services';
 * 
 * const employees = await employeeService.getEmployees(companyId);
 * const leave = await leaveService.createLeaveRequest({...});
 * 
 * TODO MIGRATION: Services will work unchanged with PostgreSQL
 * by replacing the repository implementation only.
 */
/**
 * api/client.js
 * Base client per comunicazione con backend
 * 
 * Oggi usa Base44 SDK
 * TODO MIGRATION: Domani sarà client HTTP con axios/fetch
 * 
 * Pattern:
 * - Ogni metodo espone un'interfaccia generica
 * - L'implementazione interna (Base44 vs REST) è isolata
 * - Il resto dell'app non conosce la sorgente dati
 */

import { base44 } from '@/api/base44Client';

class APIClient {
  // ========== Auth ==========
  async getMe() {
    // TODO MIGRATION: GET /api/auth/me/
    return await base44.auth.me();
  }

  async logout() {
    // TODO MIGRATION: POST /api/auth/logout/
    return await base44.auth.logout();
  }

  // ========== Companies ==========
  async getCompanies() {
    // TODO MIGRATION: GET /api/companies/
    return await base44.entities.Company.list();
  }

  async getCompany(id) {
    // TODO MIGRATION: GET /api/companies/:id/
    const companies = await base44.entities.Company.filter({ id });
    return companies[0] || null;
  }

  async createCompany(data) {
    // TODO MIGRATION: POST /api/companies/
    return await base44.entities.Company.create(data);
  }

  async updateCompany(id, data) {
    // TODO MIGRATION: PATCH /api/companies/:id/
    return await base44.entities.Company.update(id, data);
  }

  // ========== Employees ==========
  async getEmployees(filters = {}) {
    // TODO MIGRATION: GET /api/employees/?company_id=...
    return await base44.entities.Employee.filter(filters);
  }

  async getEmployee(id) {
    // TODO MIGRATION: GET /api/employees/:id/
    const employees = await base44.entities.Employee.filter({ id });
    return employees[0] || null;
  }

  async createEmployee(data) {
    // TODO MIGRATION: POST /api/employees/
    return await base44.entities.Employee.create(data);
  }

  async updateEmployee(id, data) {
    // TODO MIGRATION: PATCH /api/employees/:id/
    return await base44.entities.Employee.update(id, data);
  }

  async deleteEmployee(id) {
    // TODO MIGRATION: DELETE /api/employees/:id/
    return await base44.entities.Employee.delete(id);
  }

  // ========== Attendance ==========
  async getAttendanceEntries(filters = {}) {
    // TODO MIGRATION: GET /api/attendance/entries/?date=...&employee_id=...
    return await base44.entities.AttendanceEntry.filter(filters);
  }

  async createAttendanceEntry(data) {
    // TODO MIGRATION: POST /api/attendance/check-in/ oppure POST /api/attendance/check-out/
    return await base44.entities.AttendanceEntry.create(data);
  }

  async updateAttendanceEntry(id, data) {
    // TODO MIGRATION: PATCH /api/attendance/entries/:id/
    return await base44.entities.AttendanceEntry.update(id, data);
  }

  async getAttendanceDayReview(filters = {}) {
    // TODO MIGRATION: GET /api/attendance/day-reviews/
    return await base44.entities.AttendanceDayReview.filter(filters);
  }

  async approveAttendanceDayReview(id, data) {
    // TODO MIGRATION: PATCH /api/attendance/day-reviews/:id/approve/
    return await base44.entities.AttendanceDayReview.update(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      ...data,
    });
  }

  // ========== Leave ==========
  async getLeaveRequests(filters = {}) {
    // TODO MIGRATION: GET /api/leave/requests/?company_id=...
    return await base44.entities.LeaveRequest.filter(filters);
  }

  async createLeaveRequest(data) {
    // TODO MIGRATION: POST /api/leave/requests/
    return await base44.entities.LeaveRequest.create(data);
  }

  async approveLeaveRequest(id, data) {
    // TODO MIGRATION: PATCH /api/leave/requests/:id/approve/
    return await base44.entities.LeaveRequest.update(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      ...data,
    });
  }

  async rejectLeaveRequest(id, data) {
    // TODO MIGRATION: PATCH /api/leave/requests/:id/reject/
    return await base44.entities.LeaveRequest.update(id, {
      status: 'rejected',
      ...data,
    });
  }

  async getLeaveBalance(filters = {}) {
    // TODO MIGRATION: GET /api/leave/balances/?employee_id=...
    return await base44.entities.LeaveBalance.filter(filters);
  }

  // ========== Documents ==========
  async getDocuments(filters = {}) {
    // TODO MIGRATION: GET /api/documents/?company_id=...
    return await base44.entities.Document.filter(filters);
  }

  async createDocument(data) {
    // TODO MIGRATION: POST /api/documents/
    return await base44.entities.Document.create(data);
  }

  async updateDocument(id, data) {
    // TODO MIGRATION: PATCH /api/documents/:id/
    return await base44.entities.Document.update(id, data);
  }

  async archiveDocument(id) {
    // TODO MIGRATION: PATCH /api/documents/:id/archive/
    return await base44.entities.Document.update(id, { status: 'archived' });
  }

  // ========== Payroll ==========
  async getPayrollRuns(filters = {}) {
    // TODO MIGRATION: GET /api/payroll/runs/?company_id=...
    return await base44.entities.PayrollRun.filter(filters);
  }

  async createPayrollRun(data) {
    // TODO MIGRATION: POST /api/payroll/runs/
    return await base44.entities.PayrollRun.create(data);
  }

  async getPayrollDocuments(filters = {}) {
    // TODO MIGRATION: GET /api/payroll/documents/?payroll_run_id=...
    return await base44.entities.PayrollDocument.filter(filters);
  }

  // ========== Departments ==========
  async getDepartments(filters = {}) {
    // TODO MIGRATION: GET /api/departments/?company_id=...
    return await base44.entities.Department.filter(filters);
  }

  async createDepartment(data) {
    // TODO MIGRATION: POST /api/departments/
    return await base44.entities.Department.create(data);
  }

  // ========== Consultants ==========
  async getConsultantLinks(filters = {}) {
    // TODO MIGRATION: GET /api/consultants/companies/?consultant_user_id=...
    return await base44.entities.ConsultantCompanyLink.filter(filters);
  }

  async createConsultantLink(data) {
    // TODO MIGRATION: POST /api/consultants/companies/link/
    return await base44.entities.ConsultantCompanyLink.create(data);
  }

  async approveConsultantLink(id, data) {
    // TODO MIGRATION: PATCH /api/consultants/companies/:id/approve/
    return await base44.entities.ConsultantCompanyLink.update(id, {
      status: 'active',
      approved_at: new Date().toISOString(),
      ...data,
    });
  }

  // ========== Notifications ==========
  async getNotifications(filters = {}) {
    // TODO MIGRATION: GET /api/notifications/?user_id=...
    return await base44.entities.Notification.filter(filters);
  }

  async markNotificationAsRead(id) {
    // TODO MIGRATION: PATCH /api/notifications/:id/read/
    return await base44.entities.Notification.update(id, {
      is_read: true,
      read_at: new Date().toISOString(),
    });
  }

  // ========== Subscriptions ==========
  async getSubscription(filters = {}) {
    // TODO MIGRATION: GET /api/billing/status/
    const subs = await base44.entities.Subscription.filter(filters);
    return subs[0] || null;
  }

  async createSubscription(data) {
    // TODO MIGRATION: POST /api/billing/create-checkout-session/
    return await base44.entities.Subscription.create(data);
  }

  // ========== Audit Logs ==========
  async getAuditLogs(filters = {}) {
    // TODO MIGRATION: GET /api/admin/audit-logs/
    return await base44.entities.AuditLog.filter(filters);
  }
}

export const apiClient = new APIClient();
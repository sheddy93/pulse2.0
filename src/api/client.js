/**
 * src/api/client.js
 * =================
 * Unified API client - routes all requests to REST backend
 */

import { restAdapter } from '@/api/adapters/restAdapter';

class APIClient {
  // ========== Auth ==========
  async getMe() {
    return restAdapter.getPath('/auth/me');
  }

  async logout() {
    return restAdapter.postPath('/auth/logout', {});
  }

  async login(email, password) {
    return restAdapter.postPath('/auth/login', { email, password });
  }

  // ========== Employees ==========
  async listEmployees(companyId, query = {}) {
    return restAdapter.list('employees', { company_id: companyId, ...query });
  }

  async getEmployee(id) {
    return restAdapter.get('employees', id);
  }

  async createEmployee(data) {
    return restAdapter.post('employees', data);
  }

  async updateEmployee(id, data) {
    return restAdapter.patch('employees', id, data);
  }

  async deleteEmployee(id) {
    return restAdapter.delete('employees', id);
  }

  // ========== Attendance ==========
  async checkIn(employeeId, data) {
    return restAdapter.postPath('/attendance/check-in', { employee_id: employeeId, ...data });
  }

  async checkOut(employeeId, data) {
    return restAdapter.postPath('/attendance/check-out', { employee_id: employeeId, ...data });
  }

  async getAttendanceEntries(employeeId, date) {
    return restAdapter.getPath(`/attendance/entries?employee_id=${employeeId}&date=${date}`);
  }

  async getAttendanceSummary(employeeId, date) {
    return restAdapter.getPath(`/attendance/summary?employee_id=${employeeId}&date=${date}`);
  }

  // ========== Leave ==========
  async getLeaveRequests(companyId, query = {}) {
    return restAdapter.list('leave/requests', { company_id: companyId, ...query });
  }

  async createLeaveRequest(data) {
    return restAdapter.post('leave/requests', data);
  }

  async approveLeaveRequest(id, notes) {
    return restAdapter.postPath(`/leave/${id}/approve`, { notes });
  }

  async rejectLeaveRequest(id, reason) {
    return restAdapter.postPath(`/leave/${id}/reject`, { reason });
  }

  async getLeaveBalance(employeeId) {
    return restAdapter.getPath(`/leave/balances?employee_id=${employeeId}`);
  }

  // ========== Billing ==========
  async getSubscriptionStatus(companyId) {
    return restAdapter.getPath(`/billing/status?company_id=${companyId}`);
  }

  async getPlans() {
    return restAdapter.getPath('/billing/plans');
  }

  async createCheckoutSession(data) {
    return restAdapter.postPath('/billing/checkout', data);
  }

  async cancelSubscription(companyId, reason) {
    return restAdapter.postPath('/billing/cancel', { company_id: companyId, reason });
  }

  // ========== Documents ==========
  async getDocuments(companyId, query = {}) {
    return restAdapter.list('documents', { company_id: companyId, ...query });
  }

  async createDocument(data) {
    return restAdapter.post('documents', data);
  }

  async updateDocument(id, data) {
    return restAdapter.patch('documents', id, data);
  }

  async deleteDocument(id) {
    return restAdapter.delete('documents', id);
  }

  // ========== Companies ==========
  async listCompanies(query = {}) {
    return restAdapter.list('companies', query);
  }

  async getCompany(id) {
    return restAdapter.get('companies', id);
  }

  async createCompany(data) {
    return restAdapter.post('companies', data);
  }

  async updateCompany(id, data) {
    return restAdapter.patch('companies', id, data);
  }

  // ========== Files ==========
  async uploadFile(file) {
    return restAdapter.uploadFile(file);
  }

  // ========== Functions ==========
  async invokeFunction(functionName, payload) {
    return restAdapter.invoke(functionName, payload);
  }

  // ========== Generic Methods (for services compatibility) ==========
  async get(path, options = {}) {
    return restAdapter.getPath(path, options);
  }

  async post(path, data, options = {}) {
    return restAdapter.postPath(path, data, options);
  }

  async patch(path, data, options = {}) {
    return restAdapter.patchPath(path, data, options);
  }

  async delete(path, options = {}) {
    return restAdapter.deletePath(path, options);
  }

  async getPath(path, options = {}) {
    return restAdapter.getPath(path, options);
  }

  async postPath(path, data, options = {}) {
    return restAdapter.postPath(path, data, options);
  }

  async patchPath(path, data, options = {}) {
    return restAdapter.patchPath(path, data, options);
  }

  async deletePath(path, options = {}) {
    return restAdapter.deletePath(path, options);
  }

  async list(entity, query = {}) {
    return restAdapter.list(entity, query);
  }

  async invoke(functionName, payload) {
    return restAdapter.invoke(functionName, payload);
  }
}

export const apiClient = new APIClient();
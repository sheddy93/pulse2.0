/**
 * src/services/leaveService.ts
 * ============================
 * Business logic per Leave Requests
 * 
 * TODO MIGRATION: migrare a NestJS
 */

import { leaveApi } from '@/api/leaveApi';
import { leaveMapper } from '@/mappers/leaveMapper';
import { permissionService } from './permissionService';

export const leaveService = {
  async createLeaveRequest(data: any, currentUser: any) {
    if (!permissionService.can(currentUser, 'create_leave_request')) {
      throw new Error('Permission denied');
    }

    const validation = leaveService.validateLeaveForm(data);
    if (!validation.valid) {
      throw new Error(validation.errors?.join(', '));
    }

    // Calcola giorni e valida saldo
    const leaveDays = leaveService.calculateLeaveDays(
      data.start_date,
      data.end_date
    );

    const balance = await leaveService.getLeaveBalance(currentUser.employee_id);
    if (balance && leaveDays > balance.available_leave) {
      throw new Error(
        `Not enough leave balance. Available: ${balance.available_leave}, Requested: ${leaveDays}`
      );
    }

    const payload = leaveMapper.toApiPayload({
      employee_id: currentUser.employee_id,
      company_id: currentUser.company_id,
      total_days: leaveDays,
      status: 'pending',
      ...data,
    });

    const leave = await leaveApi.createRequest(payload);
    return leaveMapper.toViewModel(leave);
  },

  async approveLeaveRequest(id: string, currentUser: any) {
    if (!permissionService.can(currentUser, 'approve_leave_request')) {
      throw new Error('Permission denied');
    }

    const leave = await leaveApi.approveRequest(id);
    return leaveMapper.toViewModel(leave);
  },

  async rejectLeaveRequest(id: string, reason: string, currentUser: any) {
    if (!permissionService.can(currentUser, 'approve_leave_request')) {
      throw new Error('Permission denied');
    }

    const leave = await leaveApi.rejectRequest(id, reason);
    return leaveMapper.toViewModel(leave);
  },

  calculateLeaveDays(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  },

  async getLeaveBalance(employeeId: string) {
    const balance = await leaveApi.getBalance(employeeId);
    if (!balance) return null;

    return leaveMapper.balanceToViewModel(balance);
  },

  validateLeaveForm(data: any) {
    const errors: string[] = [];

    if (!data.start_date) {
      errors.push('Start date is required');
    }

    if (!data.end_date) {
      errors.push('End date is required');
    }

    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        errors.push('Start date must be before end date');
      }

      if (new Date(data.start_date) < new Date()) {
        errors.push('Cannot request leave in the past');
      }
    }

    if (!data.leave_type) {
      errors.push('Leave type is required');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
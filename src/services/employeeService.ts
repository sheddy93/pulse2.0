/**
 * src/services/employeeService.ts
 * ===============================
 * Business logic per Employees
 * 
 * Layer tra UI e API
 * Tutta la logica business qui, non nelle pagine
 * 
 * TODO MIGRATION: migrare logica a NestJS service
 */

import { employeesApi } from '@/api/employeesApi';
import { employeeMapper } from '@/mappers/employeeMapper';
import { permissionService } from './permissionService';

export const employeeService = {
  async listEmployees(companyId: string, filters?: any) {
    const employees = await employeesApi.list({
      company_id: companyId,
      is_deleted: false,
      ...filters,
    });
    
    return employees.map(emp => employeeMapper.toViewModel(emp));
  },

  async getEmployee(id: string) {
    const employee = await employeesApi.get(id);
    if (!employee) return null;
    
    return employeeMapper.toViewModel(employee);
  },

  async createEmployee(companyId: string, formData: any, currentUser: any) {
    // Validazione permessi
    if (!permissionService.can(currentUser, 'create_employee')) {
      throw new Error('Permission denied');
    }

    // Validazione form
    const validation = employeeService.validateEmployeeForm(formData);
    if (!validation.valid) {
      throw new Error(validation.errors?.join(', '));
    }

    const payload = employeeMapper.toApiPayload({
      company_id: companyId,
      ...formData,
    });

    const employee = await employeesApi.create(payload);
    return employeeMapper.toViewModel(employee);
  },

  async updateEmployee(id: string, formData: any, currentUser: any) {
    // Validazione permessi
    if (!permissionService.can(currentUser, 'update_employee')) {
      throw new Error('Permission denied');
    }

    const validation = employeeService.validateEmployeeForm(formData);
    if (!validation.valid) {
      throw new Error(validation.errors?.join(', '));
    }

    const payload = employeeMapper.toApiPayload(formData);
    const employee = await employeesApi.update(id, payload);
    
    return employeeMapper.toViewModel(employee);
  },

  async deleteEmployee(id: string, currentUser: any) {
    if (!permissionService.can(currentUser, 'delete_employee')) {
      throw new Error('Permission denied');
    }

    return employeesApi.delete(id);
  },

  async archiveEmployee(id: string, currentUser: any) {
    if (!permissionService.can(currentUser, 'delete_employee')) {
      throw new Error('Permission denied');
    }

    return employeesApi.update(id, { is_deleted: true });
  },

  validateEmployeeForm(data: any) {
    const errors: string[] = [];

    if (!data.full_name?.trim()) {
      errors.push('Full name is required');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email is invalid');
    }

    if (data.phone && !/^[+\d\s()-]{10,}$/.test(data.phone)) {
      errors.push('Phone format is invalid');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  canManageEmployee(currentUser: any, employee: any) {
    if (currentUser.company_id !== employee.company_id) {
      return false;
    }

    return permissionService.can(currentUser, 'manage_employees');
  },
};
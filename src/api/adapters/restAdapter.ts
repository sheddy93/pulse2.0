import { employeesService } from '@/services/employees.service';
import { leaveService } from '@/services/leave.service';
import { attendanceService } from '@/services/attendance.service';
import { companiesService } from '@/services/companies.service';
import { documentsService } from '@/services/documents.service';

/**
 * Adapter pattern per migrazione progressiva da base44 a REST API
 * Ogni entità ha metodi standard: list, get, create, update, delete, filter
 */
export const restAdapter = {
  entities: {
    Employee: {
      list: (companyId: string) => employeesService.list(companyId),
      get: (id: string) => employeesService.get(id),
      create: (payload: any) => employeesService.create(payload),
      update: (id: string, payload: any) => employeesService.update(id, payload),
      delete: (id: string) => employeesService.delete(id),
      filter: (companyId: string, filters?: any) => employeesService.filter(companyId, filters),
    },

    LeaveRequest: {
      list: (companyId: string) => leaveService.listRequests(companyId),
      get: (id: string) => leaveService.getRequest(id),
      create: (payload: any) => leaveService.createRequest(payload),
      update: (id: string, payload: any) => leaveService.updateRequest(id, payload),
      delete: (id: string) => leaveService.deleteRequest(id),
      filter: (companyId: string) => leaveService.listRequests(companyId),
    },

    AttendanceEntry: {
      list: (companyId: string) => attendanceService.listEntries(companyId),
      create: (payload: any) => attendanceService.checkIn(payload),
      delete: (id: string) => attendanceService.deleteEntry(id),
      getByEmployee: (employeeId: string) => attendanceService.getByEmployee(employeeId),
      getByDate: (companyId: string, date: string) => attendanceService.getByDate(companyId, date),
    },

    Company: {
      list: () => companiesService.list(),
      get: (id: string) => companiesService.get(id),
      create: (payload: any) => companiesService.create(payload),
      update: (id: string, payload: any) => companiesService.update(id, payload),
      delete: (id: string) => companiesService.delete(id),
      filter: (ownerId: string) => companiesService.getByOwner(ownerId),
    },

    Document: {
      list: (companyId: string) => documentsService.list(companyId),
      get: (id: string) => documentsService.get(id),
      create: (payload: any) => documentsService.create(payload),
      update: (id: string, payload: any) => documentsService.update(id, payload),
      delete: (id: string) => documentsService.delete(id),
      getByEmployee: (employeeId: string) => documentsService.getByEmployee(employeeId),
    },

    LeaveBalance: {
      get: (employeeId: string) => leaveService.getBalance(employeeId),
      update: (employeeId: string, payload: any) => leaveService.updateBalance(employeeId, payload),
    },
  },
};
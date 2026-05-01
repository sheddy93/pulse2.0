import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async createRequest(data: any) {
    return this.prisma.leaveRequest.create({ data });
  }

  async findAllRequests(companyId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { company_id: companyId },
    });
  }

  async findRequestById(id: string) {
    return this.prisma.leaveRequest.findUnique({ where: { id } });
  }

  async updateRequest(id: string, data: any) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data,
    });
  }

  async deleteRequest(id: string) {
    return this.prisma.leaveRequest.delete({ where: { id } });
  }

  async getLeaveBalance(employeeId: string) {
    return this.prisma.leaveBalance.findFirst({
      where: { employee_id: employeeId },
    });
  }

  async updateLeaveBalance(employeeId: string, data: any) {
    return this.prisma.leaveBalance.update({
      where: { employee_id: employeeId },
      data,
    });
  }
}
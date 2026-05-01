import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async createRequest(companyId: string, employeeId: string, data: any) {
    const durationDays = Math.ceil(
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

    return this.prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId,
        durationDays,
        ...data,
      },
    });
  }

  async getEmployeeRequests(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRequests(companyId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { companyId, status: 'pending' },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRequest(id: string, approvedBy: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async rejectRequest(id: string, rejectedReason: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedReason,
      },
    });
  }

  async getLeaveBalance(employeeId: string, year: number) {
    return this.prisma.leaveBalance.findFirst({
      where: { employeeId, year },
    });
  }

  async initializeLeaveBalance(employeeId: string, companyId: string) {
    const year = new Date().getFullYear();
    return this.prisma.leaveBalance.create({
      data: {
        employeeId,
        companyId,
        year,
      },
    });
  }
}
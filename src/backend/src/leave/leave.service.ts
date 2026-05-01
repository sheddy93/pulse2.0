import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  getRequests(query: any) {
    return this.prisma.leaveRequest.findMany({
      where: {
        company_id: query.company_id,
        status: query.status || 'pending',
      },
      orderBy: { created_at: 'desc' },
    });
  }

  createRequest(userId: string, data: any) {
    return this.prisma.leaveRequest.create({
      data: {
        employee_id: userId,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        leave_type: data.leave_type,
        reason: data.reason,
        status: 'pending',
      },
    });
  }

  getBalance(query: any) {
    return this.prisma.leaveBalance.findFirst({
      where: {
        employee_id: query.employee_id,
        year: query.year || new Date().getFullYear(),
      },
    });
  }

  approve(id: string, data: any) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'approved', notes: data.notes },
    });
  }

  reject(id: string, data: any) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'rejected', notes: data.reason },
    });
  }
}
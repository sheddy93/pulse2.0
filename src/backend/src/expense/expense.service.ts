import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, employeeId: string, data: any) {
    return this.prisma.expenseReimbursement.create({
      data: {
        companyId,
        employeeId,
        status: 'draft',
        ...data,
      },
    });
  }

  async getEmployeeExpenses(employeeId: string) {
    return this.prisma.expenseReimbursement.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingByStatus(companyId: string, status: string) {
    return this.prisma.expenseReimbursement.findMany({
      where: { companyId, status },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, approverEmail: string, notes?: string) {
    return this.prisma.expenseReimbursement.update({
      where: { id },
      data: {
        status: 'approved',
        approverEmail,
        approvedAt: new Date(),
        approvalNotes: notes,
      },
    });
  }

  async reject(id: string, notes: string) {
    return this.prisma.expenseReimbursement.update({
      where: { id },
      data: {
        status: 'rejected',
        approvalNotes: notes,
      },
    });
  }

  async markAsPaid(id: string) {
    return this.prisma.expenseReimbursement.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });
  }

  async getCompanyTotal(companyId: string, month: Date) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const expenses = await this.prisma.expenseReimbursement.findMany({
      where: {
        companyId,
        expenseDate: { gte: startOfMonth, lte: endOfMonth },
        status: 'approved',
      },
    });

    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }
}
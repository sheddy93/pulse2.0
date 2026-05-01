import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    return this.prisma.employee.create({
      data: { companyId, ...data },
    });
  }

  async findByCompany(companyId: string, skip = 0, take = 50) {
    return this.prisma.employee.findMany({
      where: { companyId },
      include: { dept: true, leaveBalance: true },
      skip,
      take,
    });
  }

  async findById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        dept: true,
        attendances: { orderBy: { timestamp: 'desc' }, take: 30 },
        leaveBalance: true,
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }

  async search(companyId: string, query: string) {
    return this.prisma.employee.findMany({
      where: {
        companyId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }
}
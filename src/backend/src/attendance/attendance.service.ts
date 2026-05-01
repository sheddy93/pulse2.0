import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async createEntry(data: any) {
    return this.prisma.attendanceEntry.create({ data });
  }

  async findAllEntries(companyId: string) {
    return this.prisma.attendanceEntry.findMany({
      where: { company_id: companyId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findEntriesByEmployee(employeeId: string) {
    return this.prisma.attendanceEntry.findMany({
      where: { employee_id: employeeId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findEntriesByDate(companyId: string, date: string) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.attendanceEntry.findMany({
      where: {
        company_id: companyId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async deleteEntry(id: string) {
    return this.prisma.attendanceEntry.delete({ where: { id } });
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async clockIn(employeeId: string, companyId: string, data: any) {
    return this.prisma.attendanceEntry.create({
      data: {
        companyId,
        employeeId,
        type: 'clock_in',
        timestamp: new Date(),
        ...data,
      },
    });
  }

  async clockOut(employeeId: string, companyId: string, data: any) {
    return this.prisma.attendanceEntry.create({
      data: {
        companyId,
        employeeId,
        type: 'clock_out',
        timestamp: new Date(),
        ...data,
      },
    });
  }

  async getTodayAttendance(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendanceEntry.findMany({
      where: {
        employeeId,
        timestamp: { gte: today, lt: tomorrow },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getEmployeeAttendance(employeeId: string, daysBack = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return this.prisma.attendanceEntry.findMany({
      where: {
        employeeId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getCompanyAttendance(companyId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.attendanceEntry.findMany({
      where: {
        companyId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      include: { employee: true },
      orderBy: { timestamp: 'desc' },
    });
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(userId: string, data: any) {
    return this.prisma.attendanceEntry.create({
      data: {
        employee_id: userId,
        type: 'check_in',
        timestamp: new Date(data.timestamp),
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'pending',
      },
    });
  }

  async checkOut(userId: string, data: any) {
    return this.prisma.attendanceEntry.create({
      data: {
        employee_id: userId,
        type: 'check_out',
        timestamp: new Date(data.timestamp),
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'pending',
      },
    });
  }

  getEntries(query: any) {
    return this.prisma.attendanceEntry.findMany({
      where: {
        employee_id: query.employee_id,
        timestamp: query.date
          ? {
              gte: new Date(query.date),
              lt: new Date(new Date(query.date).getTime() + 86400000),
            }
          : undefined,
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getSummary(query: any) {
    const entries = await this.prisma.attendanceEntry.findMany({
      where: {
        employee_id: query.employee_id,
        timestamp: {
          gte: new Date(query.date),
          lt: new Date(new Date(query.date).getTime() + 86400000),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const checkIn = entries.find((e) => e.type === 'check_in');
    const checkOut = entries.find((e) => e.type === 'check_out');

    const hours = checkIn && checkOut
      ? (new Date(checkOut.timestamp).getTime() - new Date(checkIn.timestamp).getTime()) / 3600000
      : 0;

    return { checkIn, checkOut, total_hours: hours };
  }
}
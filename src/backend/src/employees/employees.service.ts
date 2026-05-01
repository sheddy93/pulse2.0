import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  list(query: any) {
    return this.prisma.employee.findMany({
      where: {
        company_id: query.company_id,
        status: query.status || 'active',
      },
      skip: query.skip ? parseInt(query.skip) : 0,
      take: query.limit ? parseInt(query.limit) : 50,
    });
  }

  get(id: string) {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  create(data: any) {
    return this.prisma.employee.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.employee.create({ data });
  }

  async findAll(companyId: string) {
    return this.prisma.employee.findMany({
      where: { company_id: companyId },
    });
  }

  async findOne(id: string) {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }

  async filterByCompany(companyId: string, filters: any = {}) {
    return this.prisma.employee.findMany({
      where: {
        company_id: companyId,
        ...filters,
      },
    });
  }
}
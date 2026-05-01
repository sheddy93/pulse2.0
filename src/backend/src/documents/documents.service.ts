import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.document.create({ data });
  }

  async findAll(companyId: string) {
    return this.prisma.document.findMany({
      where: { company_id: companyId },
    });
  }

  async findOne(id: string) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.document.delete({ where: { id } });
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.document.findMany({
      where: { employee_id: employeeId },
    });
  }
}
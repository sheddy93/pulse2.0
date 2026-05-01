import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.company.create({ data });
  }

  async findAll(skip = 0, take = 50) {
    return this.prisma.company.findMany({ skip, take });
  }

  async findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: { users: true, employees: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.company.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }
}
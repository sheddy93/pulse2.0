import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.company.create({ data });
  }

  async findAll() {
    return this.prisma.company.findMany();
  }

  async findOne(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }

  async findByOwnerId(ownerId: string) {
    return this.prisma.company.findMany({
      where: { owner_id: ownerId },
    });
  }
}
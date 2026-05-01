import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  list(query: any) {
    return this.prisma.company.findMany({
      skip: query.skip ? parseInt(query.skip) : 0,
      take: query.limit ? parseInt(query.limit) : 50,
    });
  }

  get(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  create(data: any) {
    return this.prisma.company.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.company.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.company.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
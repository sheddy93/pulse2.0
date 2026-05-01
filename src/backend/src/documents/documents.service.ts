import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  list(query: any) {
    return this.prisma.document.findMany({
      where: {
        company_id: query.company_id,
        status: query.status || 'active',
      },
    });
  }

  get(id: string) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  create(data: any) {
    return this.prisma.document.create({ data });
  }
}
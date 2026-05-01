import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    return this.prisma.document.create({
      data: {
        companyId,
        uploadedBy: data.uploadedBy,
        ...data,
      },
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.document.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findExpiring(companyId: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.prisma.document.findMany({
      where: {
        companyId,
        expiryDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
        status: 'active',
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async sign(id: string, signedBy: string, signatureUrl: string) {
    return this.prisma.document.update({
      where: { id },
      data: {
        signedBy,
        signatureUrl,
        signedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }
}
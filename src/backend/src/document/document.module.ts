import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';

@Module({
  imports: [PrismaModule],
  providers: [DocumentService],
  controllers: [DocumentController],
})
export class DocumentModule {}
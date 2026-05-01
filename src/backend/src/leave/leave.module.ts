import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';

@Module({
  imports: [PrismaModule],
  providers: [LeaveService],
  controllers: [LeaveController],
})
export class LeaveModule {}
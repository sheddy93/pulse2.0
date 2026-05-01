import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [PrismaModule],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
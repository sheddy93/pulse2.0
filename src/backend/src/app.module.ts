import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { LeaveModule } from './leave/leave.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CompaniesModule } from './companies/companies.module';
import { DocumentsModule } from './documents/documents.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmployeesModule,
    LeaveModule,
    AttendanceModule,
    CompaniesModule,
    DocumentsModule,
  ],
})
export class AppModule {}
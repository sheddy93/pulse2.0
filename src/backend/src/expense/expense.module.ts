import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';

@Module({
  imports: [PrismaModule],
  providers: [ExpenseService],
  controllers: [ExpenseController],
})
export class ExpenseModule {}
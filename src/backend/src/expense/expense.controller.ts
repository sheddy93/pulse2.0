import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.expenseService.create(
      req.user.companyId,
      body.employeeId,
      body,
    );
  }

  @Get('employee/:employeeId')
  async getEmployeeExpenses(@Param('employeeId') employeeId: string) {
    return this.expenseService.getEmployeeExpenses(employeeId);
  }

  @Get('pending/:status')
  async getPendingByStatus(
    @Param('status') status: string,
    @Request() req: any,
  ) {
    return this.expenseService.getPendingByStatus(req.user.companyId, status);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.expenseService.approve(id, req.user.email, body.notes);
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { notes: string }) {
    return this.expenseService.reject(id, body.notes);
  }

  @Put(':id/pay')
  async markAsPaid(@Param('id') id: string) {
    return this.expenseService.markAsPaid(id);
  }

  @Get('company/total')
  async getCompanyTotal(@Query('month') month: string, @Request() req: any) {
    return this.expenseService.getCompanyTotal(
      req.user.companyId,
      new Date(month),
    );
  }
}
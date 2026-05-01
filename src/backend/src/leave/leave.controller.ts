import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post('request')
  async createRequest(@Body() body: any, @Request() req: any) {
    return this.leaveService.createRequest(
      req.user.companyId,
      body.employeeId,
      body,
    );
  }

  @Get('employee/:employeeId')
  async getEmployeeRequests(@Param('employeeId') employeeId: string) {
    return this.leaveService.getEmployeeRequests(employeeId);
  }

  @Get('pending')
  async getPendingRequests(@Request() req: any) {
    return this.leaveService.getPendingRequests(req.user.companyId);
  }

  @Put(':id/approve')
  async approveRequest(@Param('id') id: string, @Request() req: any) {
    return this.leaveService.approveRequest(id, req.user.email);
  }

  @Put(':id/reject')
  async rejectRequest(
    @Param('id') id: string,
    @Body() body: { rejectedReason: string },
  ) {
    return this.leaveService.rejectRequest(id, body.rejectedReason);
  }

  @Get('balance/:employeeId')
  async getLeaveBalance(
    @Param('employeeId') employeeId: string,
  ) {
    const year = new Date().getFullYear();
    return this.leaveService.getLeaveBalance(employeeId, year);
  }
}
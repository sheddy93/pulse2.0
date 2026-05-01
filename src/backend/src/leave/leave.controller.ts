import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leave')
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  async createRequest(@Body() createLeaveDto: any) {
    return this.leaveService.createRequest(createLeaveDto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  async findAllRequests(@Query('company_id') companyId: string) {
    return this.leaveService.findAllRequests(companyId);
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  async findRequestById(@Param('id') id: string) {
    return this.leaveService.findRequestById(id);
  }

  @Patch('requests/:id')
  @UseGuards(JwtAuthGuard)
  async updateRequest(@Param('id') id: string, @Body() updateLeaveDto: any) {
    return this.leaveService.updateRequest(id, updateLeaveDto);
  }

  @Delete('requests/:id')
  @UseGuards(JwtAuthGuard)
  async deleteRequest(@Param('id') id: string) {
    return this.leaveService.deleteRequest(id);
  }

  @Get('balance/:employeeId')
  @UseGuards(JwtAuthGuard)
  async getLeaveBalance(@Param('employeeId') employeeId: string) {
    return this.leaveService.getLeaveBalance(employeeId);
  }

  @Patch('balance/:employeeId')
  @UseGuards(JwtAuthGuard)
  async updateLeaveBalance(@Param('employeeId') employeeId: string, @Body() data: any) {
    return this.leaveService.updateLeaveBalance(employeeId, data);
  }
}
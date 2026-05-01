import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Get('requests')
  getRequests(@Query() query: any) {
    return this.leaveService.getRequests(query);
  }

  @Post('requests')
  createRequest(@Body() data: any, @Request() req: any) {
    return this.leaveService.createRequest(req.user.id, data);
  }

  @Get('balances')
  getBalance(@Query() query: any) {
    return this.leaveService.getBalance(query);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() data: any) {
    return this.leaveService.approve(id, data);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() data: any) {
    return this.leaveService.reject(id, data);
  }
}
import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() data: any, @Request() req: any) {
    return this.attendanceService.checkIn(req.user.id, data);
  }

  @Post('check-out')
  checkOut(@Body() data: any, @Request() req: any) {
    return this.attendanceService.checkOut(req.user.id, data);
  }

  @Get('entries')
  getEntries(@Query() query: any) {
    return this.attendanceService.getEntries(query);
  }

  @Get('summary')
  getSummary(@Query() query: any) {
    return this.attendanceService.getSummary(query);
  }
}
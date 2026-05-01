import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Body() body: any, @Request() req: any) {
    return this.attendanceService.clockIn(
      body.employeeId,
      req.user.companyId,
      body,
    );
  }

  @Post('clock-out')
  async clockOut(@Body() body: any, @Request() req: any) {
    return this.attendanceService.clockOut(
      body.employeeId,
      req.user.companyId,
      body,
    );
  }

  @Get('today/:employeeId')
  async getTodayAttendance(@Param('employeeId') employeeId: string) {
    return this.attendanceService.getTodayAttendance(employeeId);
  }

  @Get('employee/:employeeId')
  async getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query('daysBack') daysBack = 30,
  ) {
    return this.attendanceService.getEmployeeAttendance(employeeId, daysBack);
  }

  @Get('company/date/:date')
  async getCompanyAttendance(
    @Param('date') date: string,
    @Request() req: any,
  ) {
    return this.attendanceService.getCompanyAttendance(
      req.user.companyId,
      new Date(date),
    );
  }
}
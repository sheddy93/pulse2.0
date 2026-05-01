import { Controller, Get, Post, Body, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  @UseGuards(JwtAuthGuard)
  async checkIn(@Body() checkInDto: any) {
    return this.attendanceService.createEntry({
      ...checkInDto,
      type: 'check_in',
      timestamp: new Date(),
    });
  }

  @Post('check-out')
  @UseGuards(JwtAuthGuard)
  async checkOut(@Body() checkOutDto: any) {
    return this.attendanceService.createEntry({
      ...checkOutDto,
      type: 'check_out',
      timestamp: new Date(),
    });
  }

  @Get('entries')
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('company_id') companyId: string) {
    return this.attendanceService.findAllEntries(companyId);
  }

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  async findByEmployee(@Param('employeeId') employeeId: string) {
    return this.attendanceService.findEntriesByEmployee(employeeId);
  }

  @Get('date')
  @UseGuards(JwtAuthGuard)
  async findByDate(@Query('company_id') companyId: string, @Query('date') date: string) {
    return this.attendanceService.findEntriesByDate(companyId, date);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteEntry(@Param('id') id: string) {
    return this.attendanceService.deleteEntry(id);
  }
}
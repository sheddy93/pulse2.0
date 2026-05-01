import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createEmployeeDto: any) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('company_id') companyId: string) {
    return this.employeesService.findAll(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateEmployeeDto: any) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }

  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard)
  async filterByCompany(@Param('companyId') companyId: string) {
    return this.employeesService.filterByCompany(companyId);
  }
}
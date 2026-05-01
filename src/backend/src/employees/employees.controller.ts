import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.employeesService.create(req.user.companyId, body);
  }

  @Get()
  async findByCompany(@Request() req: any, @Query('skip') skip = 0, @Query('take') take = 50) {
    return this.employeesService.findByCompany(req.user.companyId, skip, take);
  }

  @Get('search')
  async search(@Query('q') query: string, @Request() req: any) {
    return this.employeesService.search(req.user.companyId, query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.employeesService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }
}
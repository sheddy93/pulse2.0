import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  list(@Query() query: any) {
    return this.companiesService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.companiesService.get(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.companiesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.companiesService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.companiesService.delete(id);
  }
}
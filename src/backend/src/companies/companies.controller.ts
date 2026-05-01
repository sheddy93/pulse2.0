import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCompanyDto: any) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  async findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateCompanyDto: any) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.companiesService.delete(id);
  }

  @Get('owner/:ownerId')
  @UseGuards(JwtAuthGuard)
  async findByOwner(@Param('ownerId') ownerId: string) {
    return this.companiesService.findByOwnerId(ownerId);
  }
}
import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDocumentDto: any) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('company_id') companyId: string) {
    return this.documentsService.findAll(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateDocumentDto: any) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  async findByEmployee(@Param('employeeId') employeeId: string) {
    return this.documentsService.findByEmployee(employeeId);
  }
}
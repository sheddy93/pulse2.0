import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  list(@Query() query: any) {
    return this.documentsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.documentsService.get(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.documentsService.create(data);
  }
}
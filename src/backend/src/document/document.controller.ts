import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.documentService.create(req.user.companyId, {
      ...body,
      uploadedBy: req.user.email,
    });
  }

  @Get('company')
  async findByCompany(@Request() req: any) {
    return this.documentService.findByCompany(req.user.companyId);
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string) {
    return this.documentService.findByEmployee(employeeId);
  }

  @Get('expiring')
  async findExpiring(@Request() req: any) {
    return this.documentService.findExpiring(req.user.companyId);
  }

  @Put(':id/sign')
  async sign(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.documentService.sign(id, req.user.email, body.signatureUrl);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.documentService.updateStatus(id, body.status);
  }
}
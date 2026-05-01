import { Controller, Get, Post, Body, UseGuards, Query, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('status')
  getStatus(@Query() query: any) {
    return this.billingService.getStatus(query.company_id);
  }

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Post('checkout')
  createCheckoutSession(@Body() data: any, @Request() req: any) {
    return this.billingService.createCheckoutSession(req.user.company_id, data);
  }

  @Post('cancel')
  cancelSubscription(@Body() data: any, @Request() req: any) {
    return this.billingService.cancelSubscription(req.user.company_id, data);
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  constructor(private prisma: PrismaService) {}

  async getStatus(companyId: string) {
    return this.prisma.subscription.findFirst({
      where: { company_id: companyId },
    });
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: { price_monthly: 'asc' },
    });
  }

  async createCheckoutSession(companyId: string, data: any) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: data.plan_id },
    });

    if (!plan) throw new Error('Plan not found');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: {
        company_id: companyId,
        plan_id: plan.id,
      },
    });

    return { session_id: session.id, url: session.url };
  }

  async cancelSubscription(companyId: string, data: any) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { company_id: companyId },
    });

    if (!subscription) throw new Error('Subscription not found');

    await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return { success: true };
  }
}
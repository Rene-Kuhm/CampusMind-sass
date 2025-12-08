import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  PlanType,
  PaymentProvider,
  SubscriptionStatus,
  UsageType,
  PaymentStatus,
} from '@prisma/client';
import { PLANS, TRIAL_DAYS, getPlanLimits } from '../constants/plans.constant';
import { MercadoPagoProvider } from '../providers/mercadopago.provider';
import { LemonSqueezyProvider } from '../providers/lemonsqueezy.provider';
import {
  CreateCheckoutDto,
  CancelSubscriptionDto,
  ChangePlanDto,
  SubscriptionResponseDto,
  CheckoutResponseDto,
  UsageResponseDto,
} from '../dto/billing.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private mercadoPago: MercadoPagoProvider,
    private lemonSqueezy: LemonSqueezyProvider,
  ) {}

  async getOrCreateSubscription(userId: string) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: PlanType.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });
      this.logger.log(`Created FREE subscription for user ${userId}`);
    }

    return subscription;
  }

  async getSubscription(userId: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.getOrCreateSubscription(userId);

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      provider: subscription.provider || undefined,
      currentPeriodStart: subscription.currentPeriodStart || undefined,
      currentPeriodEnd: subscription.currentPeriodEnd || undefined,
      trialEndsAt: subscription.trialEndsAt || undefined,
      createdAt: subscription.createdAt,
    };
  }

  async createCheckout(
    userId: string,
    dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.plan === PlanType.FREE) {
      throw new BadRequestException('Cannot checkout for free plan');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = dto.successUrl || `${baseUrl}/app/settings/billing?success=true`;
    const cancelUrl = dto.cancelUrl || `${baseUrl}/app/settings/billing?cancelled=true`;

    if (dto.provider === PaymentProvider.MERCADOPAGO) {
      const result = await this.mercadoPago.createSubscription({
        userId,
        email: user.email,
        plan: dto.plan,
        billingPeriod: dto.billingPeriod || 'monthly',
        successUrl,
        failureUrl: cancelUrl,
        pendingUrl: `${baseUrl}/app/settings/billing?pending=true`,
      });

      return {
        checkoutUrl: result.initPoint,
        provider: PaymentProvider.MERCADOPAGO,
        externalId: result.subscriptionId,
      };
    } else if (dto.provider === PaymentProvider.LEMONSQUEEZY) {
      const result = await this.lemonSqueezy.createCheckout({
        userId,
        email: user.email,
        name: user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : undefined,
        plan: dto.plan,
        billingPeriod: dto.billingPeriod || 'monthly',
        successUrl,
        cancelUrl,
      });

      return {
        checkoutUrl: result.checkoutUrl,
        provider: PaymentProvider.LEMONSQUEEZY,
        externalId: result.checkoutId,
      };
    }

    throw new BadRequestException('Invalid payment provider');
  }

  async cancelSubscription(
    userId: string,
    dto: CancelSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.plan === PlanType.FREE) {
      throw new BadRequestException('Cannot cancel free plan');
    }

    // Cancel with the payment provider
    if (subscription.provider === PaymentProvider.MERCADOPAGO && subscription.providerSubscriptionId) {
      await this.mercadoPago.cancelSubscription(subscription.providerSubscriptionId);
    } else if (subscription.provider === PaymentProvider.LEMONSQUEEZY && subscription.providerSubscriptionId) {
      await this.lemonSqueezy.cancelSubscription(subscription.providerSubscriptionId);
    }

    // Update local subscription
    const updatedSubscription = await this.prisma.subscription.update({
      where: { userId },
      data: dto.cancelAtPeriodEnd
        ? { cancelAtPeriodEnd: true }
        : { status: SubscriptionStatus.CANCELLED },
    });

    this.logger.log(`Cancelled subscription for user ${userId}`);

    return {
      id: updatedSubscription.id,
      plan: updatedSubscription.plan,
      status: updatedSubscription.status,
      provider: updatedSubscription.provider || undefined,
      currentPeriodStart: updatedSubscription.currentPeriodStart || undefined,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd || undefined,
      trialEndsAt: updatedSubscription.trialEndsAt || undefined,
      createdAt: updatedSubscription.createdAt,
    };
  }

  async changePlan(
    userId: string,
    dto: ChangePlanDto,
  ): Promise<CheckoutResponseDto | SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // If downgrading to free
    if (dto.newPlan === PlanType.FREE) {
      return this.cancelSubscription(userId, { cancelAtPeriodEnd: true });
    }

    // If upgrading from free, create new checkout
    if (subscription.plan === PlanType.FREE) {
      return this.createCheckout(userId, {
        plan: dto.newPlan,
        provider: PaymentProvider.MERCADOPAGO, // Default to MP for Argentina
        billingPeriod: 'monthly',
      });
    }

    // For plan changes with existing subscription, redirect to provider portal
    throw new BadRequestException(
      'Para cambiar de plan, por favor usa el portal de pagos',
    );
  }

  async activateSubscription(
    userId: string,
    plan: PlanType,
    provider: PaymentProvider,
    providerSubscriptionId: string,
    providerCustomerId?: string,
  ): Promise<void> {
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        provider,
        providerSubscriptionId,
        providerCustomerId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        provider,
        providerSubscriptionId,
        providerCustomerId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Reset usage for new period
    await this.resetUsageForNewPeriod(userId, now, periodEnd);

    this.logger.log(`Activated ${plan} subscription for user ${userId}`);
  }

  async getUsage(userId: string): Promise<UsageResponseDto> {
    const subscription = await this.getOrCreateSubscription(userId);
    const limits = getPlanLimits(subscription.plan);

    const now = new Date();
    const periodStart = subscription.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = subscription.currentPeriodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get usage records
    const usageRecords = await this.prisma.usageRecord.findMany({
      where: {
        subscriptionId: subscription.id,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    const getUsage = (type: UsageType) => {
      const record = usageRecords.find((r) => r.type === type);
      return record?.count || 0;
    };

    // Count actual resources
    const [subjectsCount, flashcardsCount] = await Promise.all([
      this.prisma.subject.count({
        where: { userId, isArchived: false },
      }),
      this.prisma.flashcard.count({
        where: { deck: { userId } },
      }),
    ]);

    return {
      ragQueries: {
        used: getUsage(UsageType.RAG_QUERIES),
        limit: limits.ragQueriesPerMonth,
      },
      flashcards: {
        used: flashcardsCount,
        limit: limits.flashcardsTotal,
      },
      storageMb: {
        used: getUsage(UsageType.STORAGE_MB),
        limit: limits.storageMb,
      },
      subjects: {
        used: subjectsCount,
        limit: limits.subjectsActive,
      },
      quizzes: {
        used: getUsage(UsageType.SUBJECTS), // Reusing for quizzes
        limit: limits.quizzesPerMonth,
      },
      periodStart,
      periodEnd,
    };
  }

  async incrementUsage(userId: string, type: UsageType, amount: number = 1): Promise<void> {
    const subscription = await this.getOrCreateSubscription(userId);

    const now = new Date();
    const periodStart = subscription.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = subscription.currentPeriodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await this.prisma.usageRecord.upsert({
      where: {
        subscriptionId_type_periodStart: {
          subscriptionId: subscription.id,
          type,
          periodStart,
        },
      },
      update: {
        count: { increment: amount },
      },
      create: {
        subscriptionId: subscription.id,
        type,
        count: amount,
        periodStart,
        periodEnd,
      },
    });
  }

  async checkLimit(userId: string, type: UsageType): Promise<boolean> {
    const subscription = await this.getOrCreateSubscription(userId);
    const limits = getPlanLimits(subscription.plan);

    let limitValue: number;
    switch (type) {
      case UsageType.RAG_QUERIES:
        limitValue = limits.ragQueriesPerMonth;
        break;
      case UsageType.FLASHCARDS:
        limitValue = limits.flashcardsTotal;
        break;
      case UsageType.STORAGE_MB:
        limitValue = limits.storageMb;
        break;
      case UsageType.SUBJECTS:
        limitValue = limits.subjectsActive;
        break;
      default:
        return true;
    }

    if (limitValue === -1) return true; // Unlimited

    const usage = await this.getUsage(userId);

    switch (type) {
      case UsageType.RAG_QUERIES:
        return usage.ragQueries.used < limitValue;
      case UsageType.FLASHCARDS:
        return usage.flashcards.used < limitValue;
      case UsageType.STORAGE_MB:
        return usage.storageMb.used < limitValue;
      case UsageType.SUBJECTS:
        return usage.subjects.used < limitValue;
      default:
        return true;
    }
  }

  private async resetUsageForNewPeriod(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return;

    // Create new usage records for the period
    const usageTypes = [UsageType.RAG_QUERIES, UsageType.STORAGE_MB, UsageType.SUBJECTS];

    for (const type of usageTypes) {
      await this.prisma.usageRecord.upsert({
        where: {
          subscriptionId_type_periodStart: {
            subscriptionId: subscription.id,
            type,
            periodStart,
          },
        },
        update: {},
        create: {
          subscriptionId: subscription.id,
          type,
          count: 0,
          periodStart,
          periodEnd,
        },
      });
    }
  }

  async recordPayment(
    subscriptionId: string,
    provider: PaymentProvider,
    amount: number,
    currency: string,
    providerPaymentId: string,
    status: PaymentStatus = PaymentStatus.SUCCEEDED,
  ): Promise<void> {
    await this.prisma.payment.create({
      data: {
        subscriptionId,
        provider,
        amount,
        currency,
        providerPaymentId,
        status,
        paidAt: status === PaymentStatus.SUCCEEDED ? new Date() : null,
      },
    });
  }

  async getPaymentHistory(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return [];
    }

    return this.prisma.payment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getBillingPortalUrl(userId: string): Promise<string> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.providerCustomerId) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.provider === PaymentProvider.LEMONSQUEEZY) {
      return this.lemonSqueezy.getCustomerPortalUrl(subscription.providerCustomerId);
    }

    // Mercado Pago doesn't have a customer portal, return settings page
    throw new BadRequestException(
      'Mercado Pago no tiene portal de cliente. Gestiona tu suscripción desde la configuración.',
    );
  }

  getPlans() {
    return Object.values(PLANS);
  }
}

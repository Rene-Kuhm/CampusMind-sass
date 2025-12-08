import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, PreApproval, Payment } from 'mercadopago';
import { PlanType } from '@prisma/client';
import { PLANS } from '../constants/plans.constant';

export interface MercadoPagoCheckoutResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface MercadoPagoSubscriptionResult {
  subscriptionId: string;
  initPoint: string;
  status: string;
}

@Injectable()
export class MercadoPagoProvider {
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private client!: MercadoPagoConfig;
  private preference!: Preference;
  private preApproval!: PreApproval;
  private payment!: Payment;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');

    if (accessToken) {
      this.client = new MercadoPagoConfig({
        accessToken,
        options: { timeout: 5000 },
      });
      this.preference = new Preference(this.client);
      this.preApproval = new PreApproval(this.client);
      this.payment = new Payment(this.client);
    }
  }

  private isConfigured(): boolean {
    return !!this.client;
  }

  async createSubscription(params: {
    userId: string;
    email: string;
    plan: PlanType;
    billingPeriod: 'monthly' | 'yearly';
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
  }): Promise<MercadoPagoSubscriptionResult> {
    if (!this.isConfigured()) {
      throw new Error('MercadoPago is not configured');
    }

    const planConfig = PLANS[params.plan];
    const price = params.billingPeriod === 'monthly'
      ? planConfig.pricing.monthly.ars
      : planConfig.pricing.yearly.ars;

    const frequency = params.billingPeriod === 'monthly' ? 1 : 12;
    const frequencyType = 'months';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    try {
      const response = await this.preApproval.create({
        body: {
          reason: `CampusMind ${planConfig.name} - ${params.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}`,
          payer_email: params.email,
          auto_recurring: {
            frequency,
            frequency_type: frequencyType,
            transaction_amount: price,
            currency_id: 'ARS',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          },
          back_url: params.successUrl,
          external_reference: `${params.userId}|${params.plan}|${params.billingPeriod}`,
          status: 'pending',
        },
      });

      this.logger.log(`Created MP subscription: ${response.id}`);

      return {
        subscriptionId: response.id || '',
        initPoint: response.init_point || '',
        status: response.status || '',
      };
    } catch (error) {
      this.logger.error('Failed to create MP subscription', error);
      throw error;
    }
  }

  async createOneTimePayment(params: {
    userId: string;
    email: string;
    plan: PlanType;
    billingPeriod: 'monthly' | 'yearly';
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
  }): Promise<MercadoPagoCheckoutResult> {
    if (!this.isConfigured()) {
      throw new Error('MercadoPago is not configured');
    }

    const planConfig = PLANS[params.plan];
    const price = params.billingPeriod === 'monthly'
      ? planConfig.pricing.monthly.ars
      : planConfig.pricing.yearly.ars;

    const notificationUrl = this.configService.get<string>('API_URL') + '/api/v1/billing/webhooks/mercadopago';

    try {
      const response = await this.preference.create({
        body: {
          items: [
            {
              id: `plan-${params.plan}-${params.billingPeriod}`,
              title: `CampusMind ${planConfig.name} - ${params.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}`,
              quantity: 1,
              unit_price: price,
              currency_id: 'ARS',
            },
          ],
          payer: {
            email: params.email,
          },
          back_urls: {
            success: params.successUrl,
            failure: params.failureUrl,
            pending: params.pendingUrl,
          },
          auto_return: 'approved',
          notification_url: notificationUrl,
          external_reference: `${params.userId}|${params.plan}|${params.billingPeriod}`,
          statement_descriptor: 'CAMPUSMIND',
        },
      });

      this.logger.log(`Created MP preference: ${response.id}`);

      return {
        preferenceId: response.id || '',
        initPoint: response.init_point || '',
        sandboxInitPoint: response.sandbox_init_point || '',
      };
    } catch (error) {
      this.logger.error('Failed to create MP preference', error);
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    if (!this.isConfigured()) {
      throw new Error('MercadoPago is not configured');
    }

    try {
      const response = await this.payment.get({ id: paymentId });
      return response;
    } catch (error) {
      this.logger.error(`Failed to get payment ${paymentId}`, error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      throw new Error('MercadoPago is not configured');
    }

    try {
      const response = await this.preApproval.get({ id: subscriptionId });
      return response;
    } catch (error) {
      this.logger.error(`Failed to get subscription ${subscriptionId}`, error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    if (!this.isConfigured()) {
      throw new Error('MercadoPago is not configured');
    }

    try {
      const response = await this.preApproval.update({
        id: subscriptionId,
        body: {
          status: 'cancelled',
        },
      });
      this.logger.log(`Cancelled MP subscription: ${subscriptionId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to cancel subscription ${subscriptionId}`, error);
      throw error;
    }
  }

  parseExternalReference(externalReference: string): {
    userId: string;
    plan: PlanType;
    billingPeriod: 'monthly' | 'yearly';
  } {
    const [userId, plan, billingPeriod] = externalReference.split('|');
    return {
      userId,
      plan: plan as PlanType,
      billingPeriod: billingPeriod as 'monthly' | 'yearly',
    };
  }
}

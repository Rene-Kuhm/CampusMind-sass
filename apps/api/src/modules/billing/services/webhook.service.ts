import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import {
  PaymentProvider,
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@prisma/client";
import { MercadoPagoProvider } from "../providers/mercadopago.provider";
import { LemonSqueezyProvider } from "../providers/lemonsqueezy.provider";
import { SubscriptionService } from "./subscription.service";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

interface MercadoPagoWebhookPayload {
  action: string;
  api_version: string;
  data: { id: string };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      plan?: string;
      billing_period?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, any>;
  };
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mercadoPago: MercadoPagoProvider,
    private lemonSqueezy: LemonSqueezyProvider,
    private subscriptionService: SubscriptionService,
  ) {}

  async handleMercadoPagoWebhook(
    payload: MercadoPagoWebhookPayload,
  ): Promise<void> {
    this.logger.log(`MP Webhook received: ${payload.type} - ${payload.action}`);

    try {
      switch (payload.type) {
        case "payment":
          await this.handleMPPayment(payload.data.id);
          break;
        case "subscription_preapproval":
        case "preapproval":
          await this.handleMPSubscription(payload.data.id);
          break;
        case "subscription_authorized_payment":
          await this.handleMPAuthorizedPayment(payload.data.id);
          break;
        default:
          this.logger.log(`Unhandled MP webhook type: ${payload.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing MP webhook: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async handleMPPayment(paymentId: string): Promise<void> {
    const payment = await this.mercadoPago.getPayment(paymentId);

    if (!payment.external_reference) {
      this.logger.warn(`MP payment ${paymentId} has no external reference`);
      return;
    }

    const { userId, plan, billingPeriod } =
      this.mercadoPago.parseExternalReference(payment.external_reference);

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      this.logger.warn(`No subscription found for user ${userId}`);
      return;
    }

    // Map MP payment status to our status
    let paymentStatus: PaymentStatus;
    switch (payment.status) {
      case "approved":
        paymentStatus = PaymentStatus.SUCCEEDED;
        break;
      case "pending":
      case "in_process":
        paymentStatus = PaymentStatus.PROCESSING;
        break;
      case "rejected":
      case "cancelled":
        paymentStatus = PaymentStatus.FAILED;
        break;
      case "refunded":
        paymentStatus = PaymentStatus.REFUNDED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    // Record the payment
    await this.subscriptionService.recordPayment(
      subscription.id,
      PaymentProvider.MERCADOPAGO,
      Math.round((payment.transaction_amount || 0) * 100), // Convert to cents
      payment.currency_id || "ARS",
      paymentId,
      paymentStatus,
    );

    // Activate subscription if payment succeeded
    if (paymentStatus === PaymentStatus.SUCCEEDED) {
      await this.subscriptionService.activateSubscription(
        userId,
        plan,
        PaymentProvider.MERCADOPAGO,
        (payment.id || "").toString(),
        payment.payer?.id?.toString(),
      );
    }
  }

  private async handleMPSubscription(subscriptionId: string): Promise<void> {
    const mpSubscription =
      await this.mercadoPago.getSubscription(subscriptionId);

    if (!mpSubscription.external_reference) {
      this.logger.warn(
        `MP subscription ${subscriptionId} has no external reference`,
      );
      return;
    }

    const { userId, plan } = this.mercadoPago.parseExternalReference(
      mpSubscription.external_reference,
    );

    // Map MP subscription status to our status
    let status: SubscriptionStatus;
    switch (mpSubscription.status) {
      case "authorized":
      case "active":
        status = SubscriptionStatus.ACTIVE;
        break;
      case "paused":
        status = SubscriptionStatus.PAUSED;
        break;
      case "cancelled":
        status = SubscriptionStatus.CANCELLED;
        break;
      default:
        status = SubscriptionStatus.ACTIVE;
    }

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status,
        provider: PaymentProvider.MERCADOPAGO,
        providerSubscriptionId: subscriptionId,
        providerCustomerId: mpSubscription.payer_id?.toString(),
      },
      create: {
        userId,
        plan,
        status,
        provider: PaymentProvider.MERCADOPAGO,
        providerSubscriptionId: subscriptionId,
        providerCustomerId: mpSubscription.payer_id?.toString(),
      },
    });

    this.logger.log(`Updated subscription for user ${userId}: ${status}`);
  }

  private async handleMPAuthorizedPayment(paymentId: string): Promise<void> {
    // Handle recurring payment from subscription
    await this.handleMPPayment(paymentId);
  }

  async handleLemonSqueezyWebhook(
    payload: LemonSqueezyWebhookPayload,
    signature: string,
    rawBody: string,
  ): Promise<void> {
    // Verify webhook signature
    if (!this.lemonSqueezy.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException("Invalid webhook signature");
    }

    const eventName = payload.meta.event_name;
    this.logger.log(`LS Webhook received: ${eventName}`);

    try {
      switch (eventName) {
        case "subscription_created":
          await this.handleLSSubscriptionCreated(payload);
          break;
        case "subscription_updated":
          await this.handleLSSubscriptionUpdated(payload);
          break;
        case "subscription_cancelled":
          await this.handleLSSubscriptionCancelled(payload);
          break;
        case "subscription_resumed":
          await this.handleLSSubscriptionResumed(payload);
          break;
        case "subscription_expired":
          await this.handleLSSubscriptionExpired(payload);
          break;
        case "subscription_payment_success":
          await this.handleLSPaymentSuccess(payload);
          break;
        case "subscription_payment_failed":
          await this.handleLSPaymentFailed(payload);
          break;
        case "order_created":
          await this.handleLSOrderCreated(payload);
          break;
        default:
          this.logger.log(`Unhandled LS webhook event: ${eventName}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing LS webhook: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async handleLSSubscriptionCreated(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    const { data, meta } = payload;
    const userId = meta.custom_data?.user_id;
    const plan = (meta.custom_data?.plan as PlanType) || PlanType.PRO;

    if (!userId) {
      this.logger.warn("LS subscription created without user_id");
      return;
    }

    const attrs = data.attributes;

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: this.mapLSStatus(attrs.status),
        provider: PaymentProvider.LEMONSQUEEZY,
        providerSubscriptionId: data.id,
        providerCustomerId: attrs.customer_id?.toString(),
        currentPeriodStart: attrs.created_at
          ? new Date(attrs.created_at)
          : new Date(),
        currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
        trialEndsAt: attrs.trial_ends_at ? new Date(attrs.trial_ends_at) : null,
      },
      create: {
        userId,
        plan,
        status: this.mapLSStatus(attrs.status),
        provider: PaymentProvider.LEMONSQUEEZY,
        providerSubscriptionId: data.id,
        providerCustomerId: attrs.customer_id?.toString(),
        currentPeriodStart: attrs.created_at
          ? new Date(attrs.created_at)
          : new Date(),
        currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
        trialEndsAt: attrs.trial_ends_at ? new Date(attrs.trial_ends_at) : null,
      },
    });

    this.logger.log(`Created LS subscription for user ${userId}`);
  }

  private async handleLSSubscriptionUpdated(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    const { data } = payload;
    const attrs = data.attributes;

    const subscription = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: data.id },
    });

    if (!subscription) {
      this.logger.warn(`No subscription found for LS ID ${data.id}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: this.mapLSStatus(attrs.status),
        currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
        cancelAtPeriodEnd: attrs.cancelled || false,
      },
    });

    this.logger.log(`Updated LS subscription ${data.id}`);
  }

  private async handleLSSubscriptionCancelled(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    const { data } = payload;
    const attrs = data.attributes;

    await this.prisma.subscription.updateMany({
      where: { providerSubscriptionId: data.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: attrs.ends_at ? new Date(attrs.ends_at) : null,
      },
    });

    this.logger.log(`Cancelled LS subscription ${data.id}`);
  }

  private async handleLSSubscriptionResumed(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    const { data } = payload;

    await this.prisma.subscription.updateMany({
      where: { providerSubscriptionId: data.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
      },
    });

    this.logger.log(`Resumed LS subscription ${data.id}`);
  }

  private async handleLSSubscriptionExpired(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    const { data } = payload;

    await this.prisma.subscription.updateMany({
      where: { providerSubscriptionId: data.id },
      data: {
        status: SubscriptionStatus.EXPIRED,
        plan: PlanType.FREE, // Downgrade to free
      },
    });

    this.logger.log(`Expired LS subscription ${data.id}`);
  }

  private async handleLSPaymentSuccess(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    const { data } = payload;
    const attrs = data.attributes;

    const subscription = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: attrs.subscription_id?.toString() },
    });

    if (subscription) {
      await this.subscriptionService.recordPayment(
        subscription.id,
        PaymentProvider.LEMONSQUEEZY,
        attrs.total || 0,
        attrs.currency || "USD",
        data.id,
        PaymentStatus.SUCCEEDED,
      );

      // Update period dates
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          currentPeriodStart: new Date(),
          currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }

    this.logger.log(`Recorded LS payment success for invoice ${data.id}`);
  }

  private async handleLSPaymentFailed(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    const { data } = payload;
    const attrs = data.attributes;

    const subscription = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: attrs.subscription_id?.toString() },
    });

    if (subscription) {
      await this.subscriptionService.recordPayment(
        subscription.id,
        PaymentProvider.LEMONSQUEEZY,
        attrs.total || 0,
        attrs.currency || "USD",
        data.id,
        PaymentStatus.FAILED,
      );

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    }

    this.logger.log(`Recorded LS payment failure for invoice ${data.id}`);
  }

  private async handleLSOrderCreated(
    payload: LemonSqueezyWebhookPayload,
  ): Promise<void> {
    // Handle one-time purchases if needed
    this.logger.log(`LS order created: ${payload.data.id}`);
  }

  private mapLSStatus(status: string): SubscriptionStatus {
    switch (status) {
      case "active":
        return SubscriptionStatus.ACTIVE;
      case "on_trial":
        return SubscriptionStatus.TRIALING;
      case "paused":
        return SubscriptionStatus.PAUSED;
      case "past_due":
      case "unpaid":
        return SubscriptionStatus.PAST_DUE;
      case "cancelled":
        return SubscriptionStatus.CANCELLED;
      case "expired":
        return SubscriptionStatus.EXPIRED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  verifyMercadoPagoSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
  ): boolean {
    const secret = this.configService.get<string>("MERCADOPAGO_WEBHOOK_SECRET");
    if (!secret) {
      this.logger.warn("MP webhook secret not configured");
      return true; // Allow in development
    }

    // Parse x-signature header
    const parts = xSignature.split(",");
    let ts: string = "",
      v1: string = "";

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "ts") ts = value;
      if (key === "v1") v1 = value;
    }

    if (!ts || !v1) return false;

    // Build manifest
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Calculate HMAC
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const hash = hmac.digest("hex");

    return hash === v1;
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PlanType } from "@prisma/client";
import { PLANS } from "../constants/plans.constant";

export interface LemonSqueezyCheckoutResult {
  checkoutId: string;
  checkoutUrl: string;
}

export interface LemonSqueezySubscription {
  id: string;
  status: string;
  customerId: string;
  productId: string;
  variantId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
}

@Injectable()
export class LemonSqueezyProvider {
  private readonly logger = new Logger(LemonSqueezyProvider.name);
  private readonly apiUrl = "https://api.lemonsqueezy.com/v1";
  private apiKey: string;
  private storeId: string;

  // Variant IDs from Lemon Squeezy dashboard - these should be configured
  private variantIds: Record<PlanType, Record<"monthly" | "yearly", string>>;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("LEMONSQUEEZY_API_KEY") || "";
    this.storeId =
      this.configService.get<string>("LEMONSQUEEZY_STORE_ID") || "";

    // These IDs should be set from your Lemon Squeezy dashboard
    this.variantIds = {
      [PlanType.FREE]: { monthly: "", yearly: "" }, // Free plan doesn't need variants
      [PlanType.PRO]: {
        monthly: this.configService.get<string>(
          "LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID",
          "",
        ),
        yearly: this.configService.get<string>(
          "LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID",
          "",
        ),
      },
      [PlanType.PREMIUM]: {
        monthly: this.configService.get<string>(
          "LEMONSQUEEZY_PREMIUM_MONTHLY_VARIANT_ID",
          "",
        ),
        yearly: this.configService.get<string>(
          "LEMONSQUEEZY_PREMIUM_YEARLY_VARIANT_ID",
          "",
        ),
      },
    };
  }

  private isConfigured(): boolean {
    return !!this.apiKey && !!this.storeId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Lemon Squeezy API error: ${error}`);
      throw new Error(`Lemon Squeezy API error: ${response.status}`);
    }

    return response.json();
  }

  async createCheckout(params: {
    userId: string;
    email: string;
    name?: string;
    plan: PlanType;
    billingPeriod: "monthly" | "yearly";
    successUrl: string;
    cancelUrl?: string;
  }): Promise<LemonSqueezyCheckoutResult> {
    if (!this.isConfigured()) {
      throw new Error("Lemon Squeezy is not configured");
    }

    const variantId = this.variantIds[params.plan]?.[params.billingPeriod];
    if (!variantId) {
      throw new Error(
        `No variant ID configured for ${params.plan} ${params.billingPeriod}`,
      );
    }

    const planConfig = PLANS[params.plan];

    try {
      const response = await this.request<any>("/checkouts", {
        method: "POST",
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              product_options: {
                name: `CampusMind ${planConfig.name}`,
                description: planConfig.description,
                redirect_url: params.successUrl,
                receipt_thank_you_note: "Gracias por suscribirte a CampusMind!",
              },
              checkout_options: {
                embed: false,
                media: true,
                logo: true,
                discount: true,
                subscription_preview: true,
              },
              checkout_data: {
                email: params.email,
                name: params.name || "",
                custom: {
                  user_id: params.userId,
                  plan: params.plan,
                  billing_period: params.billingPeriod,
                },
              },
              expires_at: null,
              preview: false,
              test_mode:
                this.configService.get<string>("NODE_ENV") !== "production",
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: this.storeId,
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: variantId,
                },
              },
            },
          },
        }),
      });

      this.logger.log(`Created LS checkout: ${response.data.id}`);

      return {
        checkoutId: response.data.id,
        checkoutUrl: response.data.attributes.url,
      };
    } catch (error) {
      this.logger.error("Failed to create LS checkout", error);
      throw error;
    }
  }

  async getSubscription(
    subscriptionId: string,
  ): Promise<LemonSqueezySubscription> {
    if (!this.isConfigured()) {
      throw new Error("Lemon Squeezy is not configured");
    }

    try {
      const response = await this.request<any>(
        `/subscriptions/${subscriptionId}`,
      );
      const attrs = response.data.attributes;

      return {
        id: response.data.id,
        status: attrs.status,
        customerId: attrs.customer_id.toString(),
        productId: attrs.product_id.toString(),
        variantId: attrs.variant_id.toString(),
        currentPeriodStart: new Date(attrs.renews_at),
        currentPeriodEnd: new Date(attrs.ends_at || attrs.renews_at),
        trialEndsAt: attrs.trial_ends_at
          ? new Date(attrs.trial_ends_at)
          : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get LS subscription ${subscriptionId}`,
        error,
      );
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Lemon Squeezy is not configured");
    }

    try {
      await this.request(`/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          data: {
            type: "subscriptions",
            id: subscriptionId,
            attributes: {
              cancelled: true,
            },
          },
        }),
      });

      this.logger.log(`Cancelled LS subscription: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to cancel LS subscription ${subscriptionId}`,
        error,
      );
      throw error;
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Lemon Squeezy is not configured");
    }

    try {
      await this.request(`/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          data: {
            type: "subscriptions",
            id: subscriptionId,
            attributes: {
              cancelled: false,
            },
          },
        }),
      });

      this.logger.log(`Resumed LS subscription: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to resume LS subscription ${subscriptionId}`,
        error,
      );
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    newVariantId: string,
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Lemon Squeezy is not configured");
    }

    try {
      await this.request(`/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          data: {
            type: "subscriptions",
            id: subscriptionId,
            attributes: {
              variant_id: parseInt(newVariantId, 10),
            },
          },
        }),
      });

      this.logger.log(
        `Updated LS subscription ${subscriptionId} to variant ${newVariantId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update LS subscription ${subscriptionId}`,
        error,
      );
      throw error;
    }
  }

  async getCustomerPortalUrl(customerId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Lemon Squeezy is not configured");
    }

    try {
      const response = await this.request<any>(`/customers/${customerId}`);
      return response.data.attributes.urls.customer_portal;
    } catch (error) {
      this.logger.error(
        `Failed to get customer portal URL for ${customerId}`,
        error,
      );
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require("crypto");
    const webhookSecret = this.configService.get<string>(
      "LEMONSQUEEZY_WEBHOOK_SECRET",
    );

    if (!webhookSecret) {
      this.logger.warn("Lemon Squeezy webhook secret not configured");
      return false;
    }

    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = hmac.update(payload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  getVariantIdForPlan(
    plan: PlanType,
    billingPeriod: "monthly" | "yearly",
  ): string {
    return this.variantIds[plan]?.[billingPeriod] || "";
  }
}

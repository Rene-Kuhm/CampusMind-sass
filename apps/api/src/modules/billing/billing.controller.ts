import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  RawBodyRequest,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { SubscriptionService } from "./services/subscription.service";
import { WebhookService } from "./services/webhook.service";
import {
  CreateCheckoutDto,
  CancelSubscriptionDto,
  ChangePlanDto,
  SubscriptionResponseDto,
  CheckoutResponseDto,
  UsageResponseDto,
  BillingPortalResponseDto,
} from "./dto/billing.dto";
import { PLANS } from "./constants/plans.constant";

@ApiTags("Billing")
@Controller("billing")
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private subscriptionService: SubscriptionService,
    private webhookService: WebhookService,
  ) {}

  @Get("plans")
  @Public()
  @ApiOperation({ summary: "Get available plans" })
  @ApiResponse({ status: 200, description: "Returns all available plans" })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get("subscription")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current subscription" })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getSubscription(
    @CurrentUser() user: any,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.getSubscription(user.id);
  }

  @Post("checkout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create checkout session" })
  @ApiResponse({ status: 201, type: CheckoutResponseDto })
  async createCheckout(
    @CurrentUser() user: any,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.subscriptionService.createCheckout(user.id, dto);
  }

  @Patch("subscription/cancel")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel subscription" })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async cancelSubscription(
    @CurrentUser() user: any,
    @Body() dto: CancelSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.cancelSubscription(user.id, dto);
  }

  @Patch("subscription/change-plan")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change subscription plan" })
  async changePlan(@CurrentUser() user: any, @Body() dto: ChangePlanDto) {
    return this.subscriptionService.changePlan(user.id, dto);
  }

  @Get("usage")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current usage" })
  @ApiResponse({ status: 200, type: UsageResponseDto })
  async getUsage(@CurrentUser() user: any): Promise<UsageResponseDto> {
    return this.subscriptionService.getUsage(user.id);
  }

  @Get("payments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment history" })
  async getPaymentHistory(@CurrentUser() user: any) {
    return this.subscriptionService.getPaymentHistory(user.id);
  }

  @Get("portal")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get billing portal URL" })
  @ApiResponse({ status: 200, type: BillingPortalResponseDto })
  async getBillingPortal(
    @CurrentUser() user: any,
  ): Promise<BillingPortalResponseDto> {
    const portalUrl = await this.subscriptionService.getBillingPortalUrl(
      user.id,
    );
    const subscription = await this.subscriptionService.getSubscription(
      user.id,
    );
    return {
      portalUrl,
      provider: subscription.provider || "MERCADOPAGO",
    };
  }

  // Webhooks - these are public endpoints called by payment providers

  @Post("webhooks/mercadopago")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mercado Pago webhook endpoint" })
  async handleMercadoPagoWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-signature") xSignature: string,
    @Headers("x-request-id") xRequestId: string,
    @Body() body: any,
  ) {
    this.logger.log("Received MP webhook");

    // Verify signature in production
    if (process.env.NODE_ENV === "production" && body.data?.id) {
      const isValid = this.webhookService.verifyMercadoPagoSignature(
        xSignature,
        xRequestId,
        body.data.id,
      );
      if (!isValid) {
        this.logger.warn("Invalid MP webhook signature");
        return { received: false };
      }
    }

    await this.webhookService.handleMercadoPagoWebhook(body);
    return { received: true };
  }

  @Post("webhooks/lemonsqueezy")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lemon Squeezy webhook endpoint" })
  async handleLemonSqueezyWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-signature") signature: string,
    @Body() body: any,
  ) {
    this.logger.log("Received LS webhook");

    const rawBody = req.rawBody?.toString() || JSON.stringify(body);
    await this.webhookService.handleLemonSqueezyWebhook(
      body,
      signature,
      rawBody,
    );
    return { received: true };
  }
}

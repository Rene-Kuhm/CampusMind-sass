import { Module, Global } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { SubscriptionService } from "./services/subscription.service";
import { WebhookService } from "./services/webhook.service";
import { UsageLimitsService } from "./services/usage-limits.service";
import { MercadoPagoProvider } from "./providers/mercadopago.provider";
import { LemonSqueezyProvider } from "./providers/lemonsqueezy.provider";
import { PlanLimitGuard } from "./guards/plan-limit.guard";
import { FeatureGuard } from "./guards/feature.guard";

@Global()
@Module({
  controllers: [BillingController],
  providers: [
    SubscriptionService,
    WebhookService,
    UsageLimitsService,
    MercadoPagoProvider,
    LemonSqueezyProvider,
    PlanLimitGuard,
    FeatureGuard,
  ],
  exports: [SubscriptionService, UsageLimitsService, PlanLimitGuard, FeatureGuard],
})
export class BillingModule {}

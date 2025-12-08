import { Module, Global } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { SubscriptionService } from "./services/subscription.service";
import { WebhookService } from "./services/webhook.service";
import { MercadoPagoProvider } from "./providers/mercadopago.provider";
import { LemonSqueezyProvider } from "./providers/lemonsqueezy.provider";
import { PlanLimitGuard } from "./guards/plan-limit.guard";

@Global()
@Module({
  controllers: [BillingController],
  providers: [
    SubscriptionService,
    WebhookService,
    MercadoPagoProvider,
    LemonSqueezyProvider,
    PlanLimitGuard,
  ],
  exports: [SubscriptionService, PlanLimitGuard],
})
export class BillingModule {}

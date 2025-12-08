import { IsEnum, IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  PlanType,
  PaymentProvider,
  SubscriptionStatus,
  UsageType,
} from "@prisma/client";

export class CreateCheckoutDto {
  @ApiProperty({ enum: PlanType, description: "Plan to subscribe to" })
  @IsEnum(PlanType)
  plan!: PlanType;

  @ApiProperty({ enum: PaymentProvider, description: "Payment provider" })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @ApiPropertyOptional({ description: "Billing period: monthly or yearly" })
  @IsOptional()
  @IsString()
  billingPeriod?: "monthly" | "yearly" = "monthly";

  @ApiPropertyOptional({ description: "Success redirect URL" })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ description: "Cancel redirect URL" })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: "Cancel at end of billing period" })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean = true;

  @ApiPropertyOptional({ description: "Reason for cancellation" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ChangePlanDto {
  @ApiProperty({ enum: PlanType, description: "New plan to switch to" })
  @IsEnum(PlanType)
  newPlan!: PlanType;

  @ApiPropertyOptional({
    description: "Apply change immediately or at period end",
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = true;
}

export class SubscriptionResponseDto {
  id!: string;
  plan!: PlanType;
  status!: string;
  provider: PaymentProvider | undefined;
  currentPeriodStart: Date | undefined;
  currentPeriodEnd: Date | undefined;
  trialEndsAt: Date | undefined;
  createdAt!: Date;
}

export class CheckoutResponseDto {
  checkoutUrl!: string;
  provider!: PaymentProvider;
  externalId?: string;
}

export class UsageResponseDto {
  ragQueries!: { used: number; limit: number };
  flashcards!: { used: number; limit: number };
  storageMb!: { used: number; limit: number };
  subjects!: { used: number; limit: number };
  quizzes!: { used: number; limit: number };
  periodStart!: Date;
  periodEnd!: Date;
}

export class BillingPortalResponseDto {
  portalUrl!: string;
  provider!: PaymentProvider;
}

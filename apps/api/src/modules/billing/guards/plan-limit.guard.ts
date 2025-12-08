import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageType } from '@prisma/client';
import { SubscriptionService } from '../services/subscription.service';

export const PLAN_LIMIT_KEY = 'planLimit';
export const PlanLimit = (usageType: UsageType) => SetMetadata(PLAN_LIMIT_KEY, usageType);

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const usageType = this.reflector.getAllAndOverride<UsageType>(PLAN_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!usageType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let auth guard handle this
    }

    const withinLimit = await this.subscriptionService.checkLimit(user.id, usageType);

    if (!withinLimit) {
      throw new ForbiddenException({
        message: 'Has alcanzado el límite de tu plan',
        code: 'PLAN_LIMIT_EXCEEDED',
        usageType,
        upgradeUrl: '/app/settings/billing',
      });
    }

    return true;
  }
}

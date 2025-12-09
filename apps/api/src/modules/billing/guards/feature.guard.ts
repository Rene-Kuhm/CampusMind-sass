import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PlanLimits } from "../constants/plans.constant";
import { UsageLimitsService } from "../services/usage-limits.service";

export const REQUIRED_FEATURE_KEY = "requiredFeature";

export const RequireFeature = (feature: keyof PlanLimits) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usageLimitsService: UsageLimitsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<keyof PlanLimits>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let auth guard handle this
    }

    const check = await this.usageLimitsService.checkFeature(user.id, requiredFeature);

    if (!check.allowed) {
      throw new ForbiddenException({
        message: `Esta función requiere un plan superior`,
        code: "FEATURE_NOT_AVAILABLE",
        feature: requiredFeature,
        upgradeTo: check.planRequired,
        upgradeUrl: "/app/settings/billing",
      });
    }

    return true;
  }
}

import {
  Injectable,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { PlanType, UsageType } from "@prisma/client";
import {
  PlanLimits,
  getPlanLimits,
  getPlanConfig,
  isWithinLimit,
  getRemainingUsage,
  hasFeature,
  getUsagePercentage,
  USAGE_TO_LIMIT_MAP,
  UsageTypeEnum,
} from "../constants/plans.constant";

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
  planRequired?: PlanType;
}

export interface FeatureCheckResult {
  allowed: boolean;
  feature: keyof PlanLimits;
  planRequired?: PlanType;
}

export interface AllUsageStats {
  plan: PlanType;
  planName: string;
  periodStart: Date;
  periodEnd: Date;
  usage: {
    ragQueries: UsageCheckResult;
    documentsIndexed: UsageCheckResult;
    flashcards: UsageCheckResult;
    quizzes: UsageCheckResult;
    subjects: UsageCheckResult;
    storageMb: UsageCheckResult;
  };
  features: {
    aiSummaries: boolean;
    advancedMindMaps: boolean;
    studyGroups: boolean;
    leaderboard: boolean;
    gamification: boolean;
    achievements: boolean;
    calendarComplete: boolean;
    reminders: boolean;
    prioritySupport: boolean;
    exportData: boolean;
    betterModels: boolean;
  };
}

@Injectable()
export class UsageLimitsService {
  private readonly logger = new Logger(UsageLimitsService.name);

  constructor(private prisma: PrismaService) {}

  async getUserPlan(userId: string): Promise<PlanType> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    return subscription?.plan || PlanType.FREE;
  }

  async checkUsageLimit(
    userId: string,
    usageType: UsageTypeEnum,
  ): Promise<UsageCheckResult> {
    const plan = await this.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const limitKey = USAGE_TO_LIMIT_MAP[usageType];
    const limit = limits[limitKey] as number;

    const current = await this.getCurrentUsage(userId, usageType);

    const allowed = limit === -1 || current < limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - current);
    const percentage = limit === -1 ? 0 : Math.min(100, Math.round((current / limit) * 100));

    const result: UsageCheckResult = {
      allowed,
      current,
      limit,
      remaining,
      percentage,
    };

    if (!allowed) {
      result.planRequired = this.getUpgradePlan(plan);
    }

    return result;
  }

  async getCurrentUsage(userId: string, usageType: UsageTypeEnum): Promise<number> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return 0;

    const now = new Date();
    const periodStart = subscription.currentPeriodStart ||
      new Date(now.getFullYear(), now.getMonth(), 1);

    switch (usageType) {
      case UsageTypeEnum.RAG_QUERIES:
        return this.getUsageRecordCount(subscription.id, UsageType.RAG_QUERIES, periodStart);

      case UsageTypeEnum.DOCUMENTS_INDEXED:
        return this.getUsageRecordCount(subscription.id, UsageType.DOCUMENTS_INDEXED, periodStart);

      case UsageTypeEnum.FLASHCARDS:
        return this.prisma.flashcard.count({
          where: { deck: { userId } },
        });

      case UsageTypeEnum.QUIZZES:
        return this.getUsageRecordCount(subscription.id, UsageType.QUIZZES, periodStart);

      case UsageTypeEnum.SUBJECTS:
        return this.prisma.subject.count({
          where: { userId, isArchived: false },
        });

      case UsageTypeEnum.STORAGE_MB:
        return this.getUsageRecordCount(subscription.id, UsageType.STORAGE_MB, periodStart);

      case UsageTypeEnum.TASKS:
        return this.prisma.task.count({
          where: { userId, status: { not: 'COMPLETED' } },
        });

      case UsageTypeEnum.STUDY_SESSIONS:
        return this.getUsageRecordCount(subscription.id, UsageType.STUDY_SESSIONS, periodStart);

      default:
        return 0;
    }
  }

  private async getUsageRecordCount(
    subscriptionId: string,
    type: UsageType,
    periodStart: Date,
  ): Promise<number> {
    const record = await this.prisma.usageRecord.findFirst({
      where: {
        subscriptionId,
        type,
        periodStart: { gte: periodStart },
      },
    });
    return record?.count || 0;
  }

  async incrementUsage(
    userId: string,
    usageType: UsageTypeEnum,
    amount: number = 1,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      await this.prisma.subscription.create({
        data: {
          userId,
          plan: PlanType.FREE,
        },
      });
      return this.incrementUsage(userId, usageType, amount);
    }

    const now = new Date();
    const periodStart = subscription.currentPeriodStart ||
      new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = subscription.currentPeriodEnd ||
      new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const prismaUsageType = this.toPrismaUsageType(usageType);

    await this.prisma.usageRecord.upsert({
      where: {
        subscriptionId_type_periodStart: {
          subscriptionId: subscription.id,
          type: prismaUsageType,
          periodStart,
        },
      },
      update: {
        count: { increment: amount },
      },
      create: {
        subscriptionId: subscription.id,
        type: prismaUsageType,
        count: amount,
        periodStart,
        periodEnd,
      },
    });

    this.logger.debug(`Incremented ${usageType} by ${amount} for user ${userId}`);
  }

  async checkFeature(
    userId: string,
    feature: keyof PlanLimits,
  ): Promise<FeatureCheckResult> {
    const plan = await this.getUserPlan(userId);
    const allowed = hasFeature(plan, feature);

    const result: FeatureCheckResult = {
      allowed,
      feature,
    };

    if (!allowed) {
      result.planRequired = this.getUpgradePlan(plan);
    }

    return result;
  }

  async enforceUsageLimit(
    userId: string,
    usageType: UsageTypeEnum,
    errorMessage?: string,
  ): Promise<void> {
    const check = await this.checkUsageLimit(userId, usageType);

    if (!check.allowed) {
      const plan = await this.getUserPlan(userId);
      const planConfig = getPlanConfig(plan);
      const upgradePlan = this.getUpgradePlan(plan);
      const upgradePlanConfig = upgradePlan ? getPlanConfig(upgradePlan) : null;

      throw new ForbiddenException({
        message: errorMessage || `Has alcanzado el límite de tu plan ${planConfig.name}`,
        code: "PLAN_LIMIT_EXCEEDED",
        usageType,
        current: check.current,
        limit: check.limit,
        remaining: check.remaining,
        percentage: check.percentage,
        currentPlan: plan,
        upgradeTo: upgradePlan,
        upgradeToName: upgradePlanConfig?.name,
        upgradeUrl: "/app/settings/billing",
      });
    }
  }

  async enforceFeature(
    userId: string,
    feature: keyof PlanLimits,
    errorMessage?: string,
  ): Promise<void> {
    const check = await this.checkFeature(userId, feature);

    if (!check.allowed) {
      const plan = await this.getUserPlan(userId);
      const planConfig = getPlanConfig(plan);
      const upgradePlan = this.getUpgradePlan(plan);
      const upgradePlanConfig = upgradePlan ? getPlanConfig(upgradePlan) : null;

      throw new ForbiddenException({
        message: errorMessage || `La función "${feature}" no está disponible en tu plan ${planConfig.name}`,
        code: "FEATURE_NOT_AVAILABLE",
        feature,
        currentPlan: plan,
        upgradeTo: upgradePlan,
        upgradeToName: upgradePlanConfig?.name,
        upgradeUrl: "/app/settings/billing",
      });
    }
  }

  async getAllUsageStats(userId: string): Promise<AllUsageStats> {
    const plan = await this.getUserPlan(userId);
    const planConfig = getPlanConfig(plan);
    const limits = getPlanLimits(plan);

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    const now = new Date();
    const periodStart = subscription?.currentPeriodStart ||
      new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = subscription?.currentPeriodEnd ||
      new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      ragQueries,
      documentsIndexed,
      flashcards,
      quizzes,
      subjects,
      storageMb,
    ] = await Promise.all([
      this.checkUsageLimit(userId, UsageTypeEnum.RAG_QUERIES),
      this.checkUsageLimit(userId, UsageTypeEnum.DOCUMENTS_INDEXED),
      this.checkUsageLimit(userId, UsageTypeEnum.FLASHCARDS),
      this.checkUsageLimit(userId, UsageTypeEnum.QUIZZES),
      this.checkUsageLimit(userId, UsageTypeEnum.SUBJECTS),
      this.checkUsageLimit(userId, UsageTypeEnum.STORAGE_MB),
    ]);

    return {
      plan,
      planName: planConfig.name,
      periodStart,
      periodEnd,
      usage: {
        ragQueries,
        documentsIndexed,
        flashcards,
        quizzes,
        subjects,
        storageMb,
      },
      features: {
        aiSummaries: limits.aiSummaries,
        advancedMindMaps: limits.advancedMindMaps,
        studyGroups: limits.studyGroups,
        leaderboard: limits.leaderboard,
        gamification: limits.gamification,
        achievements: limits.achievements,
        calendarComplete: limits.calendarComplete,
        reminders: limits.reminders,
        prioritySupport: limits.prioritySupport,
        exportData: limits.exportData,
        betterModels: limits.betterModels,
      },
    };
  }

  private getUpgradePlan(currentPlan: PlanType): PlanType | undefined {
    switch (currentPlan) {
      case PlanType.FREE:
        return PlanType.PRO;
      case PlanType.PRO:
        return PlanType.PREMIUM;
      case PlanType.PREMIUM:
        return undefined;
      default:
        return PlanType.PRO;
    }
  }

  private toPrismaUsageType(usageType: UsageTypeEnum): UsageType {
    switch (usageType) {
      case UsageTypeEnum.RAG_QUERIES:
        return UsageType.RAG_QUERIES;
      case UsageTypeEnum.DOCUMENTS_INDEXED:
        return UsageType.DOCUMENTS_INDEXED;
      case UsageTypeEnum.FLASHCARDS:
        return UsageType.FLASHCARDS;
      case UsageTypeEnum.QUIZZES:
        return UsageType.QUIZZES;
      case UsageTypeEnum.STORAGE_MB:
        return UsageType.STORAGE_MB;
      case UsageTypeEnum.SUBJECTS:
        return UsageType.SUBJECTS;
      case UsageTypeEnum.TASKS:
        return UsageType.TASKS;
      case UsageTypeEnum.STUDY_SESSIONS:
        return UsageType.STUDY_SESSIONS;
      default:
        throw new Error(`Unknown usage type: ${usageType}`);
    }
  }
}

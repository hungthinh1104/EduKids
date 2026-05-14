import { Injectable, NotFoundException } from "@nestjs/common";
import { PlanTier, SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SubscriptionDto,
  UpgradeSubscriptionDto,
  PLAN_LIMITS,
} from "./subscription.dto";

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(userId: number): Promise<SubscriptionDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: true },
    });

    if (!user) throw new NotFoundException("User not found");

    const plan = user.subscription?.plan ?? PlanTier.FREE;
    const status = user.subscription?.status ?? SubscriptionStatus.ACTIVE;
    const expiresAt = user.subscription?.expiresAt?.toISOString() ?? null;
    const limits = PLAN_LIMITS[plan];

    return { plan, status, expiresAt, ...limits };
  }

  async upgradePlan(
    userId: number,
    dto: UpgradeSubscriptionDto,
  ): Promise<SubscriptionDto> {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: dto.plan,
        status: SubscriptionStatus.ACTIVE,
        expiresAt,
      },
      update: {
        plan: dto.plan,
        status: SubscriptionStatus.ACTIVE,
        expiresAt,
      },
    });

    return this.getSubscription(userId);
  }

  async cancelSubscription(userId: number): Promise<SubscriptionDto> {
    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: PlanTier.FREE,
        status: SubscriptionStatus.CANCELLED,
      },
      update: { status: SubscriptionStatus.CANCELLED },
    });

    return this.getSubscription(userId);
  }

  async getPlanForUser(userId: number): Promise<PlanTier> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) return PlanTier.FREE;
    if (sub.expiresAt && sub.expiresAt < new Date()) return PlanTier.FREE;
    return sub.plan;
  }
}

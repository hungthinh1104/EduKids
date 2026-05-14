import { IsEnum, IsOptional } from "class-validator";
import { PlanTier, SubscriptionStatus } from "@prisma/client";

export class SubscriptionDto {
  plan: PlanTier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  maxChildProfiles: number;
  features: string[];
}

export class UpgradeSubscriptionDto {
  @IsEnum(PlanTier)
  plan: PlanTier;

  @IsOptional()
  expiresAt?: string;
}

export const PLAN_LIMITS: Record<
  PlanTier,
  { maxChildProfiles: number; features: string[] }
> = {
  FREE: {
    maxChildProfiles: 1,
    features: ["1 hồ sơ bé", "5 chủ đề cơ bản"],
  },
  PREMIUM: {
    maxChildProfiles: 3,
    features: [
      "Tối đa 3 hồ sơ bé",
      "Tất cả chủ đề",
      "AI phát âm",
      "Báo cáo nâng cao",
    ],
  },
};

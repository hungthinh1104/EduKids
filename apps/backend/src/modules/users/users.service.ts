import { Injectable } from "@nestjs/common";
import { Role, SubscriptionStatus, PlanTier } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        role: Role.PARENT,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        subscription: {
          select: { plan: true, status: true, expiresAt: true },
        },
        children: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            nickname: true,
            age: true,
            totalPoints: true,
            streakCount: true,
            currentLevel: true,
          },
        },
      },
    });

    return users.map((user) => {
      const sub = user.subscription;
      const isActivePremium =
        sub?.plan === PlanTier.PREMIUM &&
        sub.status === SubscriptionStatus.ACTIVE &&
        (!sub.expiresAt || sub.expiresAt > new Date());
      const plan = isActivePremium ? ("premium" as const) : ("free" as const);

      return {
      id: user.id,
      email: user.email,
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
      plan,
      status: user.isActive ? "active" : "banned",
      joinedAt: user.createdAt.toISOString(),
      lastLogin: (user.lastLoginAt ?? user.updatedAt).toISOString(),
      children: user.children.map((child) => ({
        nickname: child.nickname,
        age: child.age,
        totalPoints: child.totalPoints,
        streakDays: child.streakCount,
        currentLevel: child.currentLevel,
      })),
      };
    });
  }
}

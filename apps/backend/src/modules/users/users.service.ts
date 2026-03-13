import { Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
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

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
      plan: "free" as const,
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
    }));
  }
}
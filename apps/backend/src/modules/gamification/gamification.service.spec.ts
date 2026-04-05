import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { GamificationService } from "./gamification.service";
import { GamificationRepository } from "./repositories/gamification.repository";
import { PrismaService } from "../../prisma/prisma.service";

describe("GamificationService", () => {
  let service: GamificationService;
  let gamificationRepository: any;
  let prismaService: any;

  beforeEach(async () => {
    const mockGamificationRepository: any = {
      getRewardSummary: jest.fn(),
      getAllBadgesForChild: jest.fn(),
      getShopItemById: jest.fn(),
      getAllShopItems: jest.fn(),
      getShopItemsByCategory: jest.fn(),
      recordPurchase: jest.fn(),
      recordEquip: jest.fn(),
      purchaseItem: jest.fn(),
      equipItem: jest.fn(),
      getLeaderboard: jest.fn(),
    };

    const mockPrismaService: any = {
      childProfile: { findUnique: jest.fn(), update: jest.fn() },
      shopPurchase: { create: jest.fn(), findUnique: jest.fn() },
      shopEquipped: { upsert: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: GamificationRepository,
          useValue: mockGamificationRepository,
        },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    gamificationRepository = module.get(GamificationRepository);
    prismaService = module.get(PrismaService);
  });

  describe("getRewardSummary", () => {
    it("returns reward summary with recent badges", async () => {
      const childId = 5;

      const mockSummary = {
        totalPoints: 500,
        currentLevel: 3,
        badgesEarned: 5,
        streakDays: 7,
      };

      const mockBadges = [
        {
          id: 1,
          name: "Quick Learner",
          isEarned: true,
          earnedAt: new Date("2026-03-20"),
        },
        {
          id: 2,
          name: "Quiz Master",
          isEarned: true,
          earnedAt: new Date("2026-03-19"),
        },
        {
          id: 3,
          name: "Pronunciation Expert",
          isEarned: false,
          earnedAt: null,
        },
      ];

      gamificationRepository.getRewardSummary.mockResolvedValue(mockSummary);
      gamificationRepository.getAllBadgesForChild.mockResolvedValue(mockBadges);

      const result = await service.getRewardSummary(childId);

      expect(result.totalPoints).toBe(500);
      expect(result.currentLevel).toBe(3);
      expect(result.recentBadges).toHaveLength(2);
      expect(result.recentBadges[0].name).toBe("Quick Learner");
    });
  });

  describe("getAllBadges", () => {
    it("returns all badges for child", async () => {
      const childId = 5;
      const mockBadges = [
        { id: 1, name: "Badge 1", isEarned: true },
        { id: 2, name: "Badge 2", isEarned: false },
      ];

      gamificationRepository.getAllBadgesForChild.mockResolvedValue(mockBadges);

      const result = await service.getAllBadges(childId);

      expect(result).toHaveLength(2);
      expect(gamificationRepository.getAllBadgesForChild).toHaveBeenCalledWith(
        childId,
      );
    });
  });

  describe("getEarnedBadges", () => {
    it("returns only earned badges", async () => {
      const childId = 5;
      const mockBadges = [
        { id: 1, name: "Badge 1", isEarned: true },
        { id: 2, name: "Badge 2", isEarned: false },
        { id: 3, name: "Badge 3", isEarned: true },
      ];

      gamificationRepository.getAllBadgesForChild.mockResolvedValue(mockBadges);

      const result = await service.getEarnedBadges(childId);

      expect(result).toHaveLength(2);
      expect(result.every((b) => b.isEarned)).toBe(true);
    });
  });

  describe("getShopItems", () => {
    it("returns all shop items", async () => {
      const childId = 5;
      const mockItems = [
        { id: 1, name: "Item 1", price: 100, owned: false },
        { id: 2, name: "Item 2", price: 200, owned: true },
      ];

      gamificationRepository.getAllShopItems.mockResolvedValue(mockItems);

      const result = await service.getShopItems(childId);

      expect(result).toHaveLength(2);
      expect(gamificationRepository.getAllShopItems).toHaveBeenCalledWith(
        childId,
      );
    });
  });

  describe("purchaseItem", () => {
    it("purchases item with sufficient points", async () => {
      const childId = 5;
      const itemId = 10;
      const dto = { itemId };

      const mockChild = { id: childId, totalPoints: 500 };
      const mockItem = { id: itemId, price: 100, name: "Hat" };

      prismaService.childProfile.findUnique.mockResolvedValue(mockChild);
      gamificationRepository.getShopItemById.mockResolvedValue(mockItem);
      prismaService.shopPurchase.findUnique.mockResolvedValue(null); // Not already owned
      gamificationRepository.purchaseItem.mockResolvedValue({
        id: 1,
        childId,
        itemId,
        purchasedAt: new Date(),
      });
      prismaService.childProfile.update.mockResolvedValue({
        ...mockChild,
        totalPoints: 400,
      });

      const result = await service.purchaseItem(childId, dto as any);

      expect(result).toBeDefined();
      expect(gamificationRepository.purchaseItem).toHaveBeenCalled();
    });

    it("throws BadRequestException for insufficient points", async () => {
      const childId = 5;
      const itemId = 10;
      const dto = { itemId };

      const mockChild = { id: childId, totalPoints: 50 };
      const mockItem = { id: itemId, price: 100, name: "Hat" };

      prismaService.childProfile.findUnique.mockResolvedValue(mockChild);
      gamificationRepository.getShopItemById.mockResolvedValue(mockItem);

      await expect(service.purchaseItem(childId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws NotFoundException for child not found", async () => {
      const childId = 999;
      const dto = { itemId: 10 };

      prismaService.childProfile.findUnique.mockResolvedValue(null);

      await expect(service.purchaseItem(childId, dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws NotFoundException for item not found", async () => {
      const childId = 5;
      const itemId = 999;
      const dto = { itemId };

      const mockChild = { id: childId, totalPoints: 500 };

      prismaService.childProfile.findUnique.mockResolvedValue(mockChild);
      gamificationRepository.getShopItemById.mockResolvedValue(null);

      await expect(service.purchaseItem(childId, dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("equipItem", () => {
    it("equips purchased item to avatar", async () => {
      const childId = 5;
      const itemId = 10;
      const dto = { itemId };

      const mockChild = { id: childId };
      const mockItem = {
        id: itemId,
        name: "Hat",
        category: "HAIR",
        isPurchased: true,
      };

      prismaService.childProfile.findUnique.mockResolvedValue(mockChild);
      gamificationRepository.getShopItemById.mockResolvedValue(mockItem);
      prismaService.shopPurchase.findUnique.mockResolvedValue({ id: 1 });
      gamificationRepository.equipItem.mockResolvedValue({
        id: 1,
        childId,
        itemId,
      });

      const result = await service.equipItem(childId, dto as any);

      expect(result).toBeDefined();
      expect(gamificationRepository.equipItem).toHaveBeenCalled();
    });

    it("throws BadRequestException for unowned item", async () => {
      const childId = 5;
      const itemId = 10;
      const dto = { itemId };

      const mockChild = { id: childId };
      const mockItem = { id: itemId, name: "Hat" };

      prismaService.childProfile.findUnique.mockResolvedValue(mockChild);
      gamificationRepository.getShopItemById.mockResolvedValue(mockItem);
      prismaService.shopPurchase.findUnique.mockResolvedValue(null);

      await expect(service.equipItem(childId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getLeaderboard", () => {
    it("returns top children by points", async () => {
      const childId = 5;
      const limit = 10;

      const mockLeaderboard = [
        { rank: 1, childId: 1, nickname: "Anna", totalPoints: 1000 },
        { rank: 2, childId: 2, nickname: "Bob", totalPoints: 900 },
        {
          rank: 3,
          childId: 5,
          nickname: "Charlie",
          totalPoints: 800,
          isCurrentUser: true,
        },
      ];

      gamificationRepository.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const result = await service.getLeaderboard(childId, limit);

      expect(result).toHaveLength(3);
      expect(result[0].totalPoints).toBe(1000);
      expect(gamificationRepository.getLeaderboard).toHaveBeenCalledWith(limit);
    });
  });
});

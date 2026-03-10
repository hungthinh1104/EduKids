import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface RewardsSummary {
  totalPoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  streakDays: number;
  totalBadges: number;
  stars: number;
  coins: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  rarity?: string;
  category?: string;
  icon?: string;
  criteria?: string;
  earnedAt?: string;
}

export interface EarnedBadge extends Badge {
  earnedAt: string;
}

export interface ShopItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  emoji?: string;
  rarity: string;
  owned: boolean;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  remainingStars: number;
  remainingCoins: number;
  item: ShopItem;
}

export interface EquipResult {
  success: boolean;
  message: string;
}

export interface AvatarCustomization {
  childId: number;
  equippedItems: ShopItem[];
  availableItems: ShopItem[];
}

export interface LeaderboardEntry {
  rank: number;
  childId: number;
  nickname: string;
  avatar: string;
  totalPoints: number;
  level: number;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export const gamificationApi = {
  // Get rewards summary
  getRewardsSummary: async (childId: number): Promise<RewardsSummary> => {
    const response = await axiosInstance.get<ApiEnvelope<RewardsSummary>>(
      `gamification/rewards/summary?childId=${childId}`
    );
    return response.data.data;
  },

  // Get all badges
  getBadges: async (): Promise<Badge[]> => {
    const response = await axiosInstance.get<ApiEnvelope<Badge[]>>('gamification/badges');
    return response.data.data;
  },

  // Get earned badges
  getEarnedBadges: async (childId: number): Promise<EarnedBadge[]> => {
    const response = await axiosInstance.get<ApiEnvelope<EarnedBadge[]>>(
      `gamification/badges/earned?childId=${childId}`
    );
    return response.data.data;
  },

  // Get shop items
  getShopItems: async (): Promise<ShopItem[]> => {
    const response = await axiosInstance.get<ApiEnvelope<ShopItem[]>>('gamification/shop/items');
    return response.data.data;
  },

  // Purchase item
  purchaseItem: async (childId: number, itemId: number): Promise<PurchaseResult> => {
    const response = await axiosInstance.post<ApiEnvelope<PurchaseResult>>(
      'gamification/shop/purchase',
      { childId, itemId }
    );
    return response.data.data;
  },

  // Equip item
  equipItem: async (childId: number, itemId: number): Promise<EquipResult> => {
    const response = await axiosInstance.post<ApiEnvelope<EquipResult>>(
      'gamification/shop/equip',
      { childId, itemId }
    );
    return response.data.data;
  },

  // Get avatar customization
  getAvatarCustomization: async (childId: number): Promise<AvatarCustomization> => {
    const response = await axiosInstance.get<ApiEnvelope<AvatarCustomization>>(
      `gamification/avatar/customization?childId=${childId}`
    );
    return response.data.data;
  },

  // Get leaderboard
  getLeaderboard: async (limit: number = 10): Promise<LeaderboardEntry[]> => {
    const response = await axiosInstance.get<ApiEnvelope<LeaderboardEntry[]>>(
      `gamification/leaderboard?limit=${limit}`
    );
    return response.data.data;
  },
};

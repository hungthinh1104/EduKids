import { apiClient } from '@/shared/services/api.client';

// ==================== GAMIFICATION API ====================
// Rewards, badges, shop, leaderboard

export interface RewardSummary {
  childId: number;
  totalPoints: number;
  currentLevel: number;
  streakDays: number;
  nextLevelPoints: number;
  badgesEarned: number;
}

export interface Badge {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Fields from ChildBadge join
  earnedAt?: string;
  childId?: number;
  isEarned?: boolean;
}

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  category: 'AVATAR' | 'BACKGROUND' | 'POWER_UP' | 'SPECIAL';
  isOwned: boolean;
  isEquipped: boolean;
}

export interface PurchaseResult {
  itemId: number;
  remainingPoints: number;
  message: string;
}

export interface LeaderboardEntry {
  rank: number;
  childId: number;
  nickname: string;
  avatarUrl: string;
  totalPoints: number;
  level: number;
  childName?: string;
  levelName?: string;
  badgesEarned?: number;
  currentStreak?: number;
}

/**
 * Get reward summary
 * GET /api/gamification/rewards/summary
 * @Roles LEARNER
 */
export const getRewardSummary = async (): Promise<RewardSummary> => {
  const response = await apiClient.get('/gamification/rewards/summary');
  return response.data.data;
};

/**
 * Get all badges with progress
 * GET /api/gamification/badges
 * @Roles LEARNER
 */
export const getAllBadges = async (): Promise<Badge[]> => {
  const response = await apiClient.get('/gamification/badges');
  return response.data.data;
};

/**
 * Get earned badges only
 * GET /api/gamification/badges/earned
 * @Roles LEARNER
 */
export const getEarnedBadges = async (): Promise<Badge[]> => {
  const response = await apiClient.get('/gamification/badges/earned');
  return response.data.data;
};

/**
 * Get shop items
 * GET /api/gamification/shop/items?category=AVATAR
 * @Roles LEARNER
 */
export const getShopItems = async (category?: string): Promise<ShopItem[]> => {
  const url = category ? `/gamification/shop/items?category=${category}` : '/gamification/shop/items';
  const response = await apiClient.get(url);
  return response.data.data;
};

/**
 * Purchase shop item
 * POST /api/gamification/shop/purchase
 * @Roles LEARNER
 * @body { itemId: number }
 */
export const purchaseShopItem = async (itemId: number): Promise<PurchaseResult> => {
  const response = await apiClient.post('/gamification/shop/purchase', { itemId });
  return response.data.data;
};

/**
 * Equip purchased item
 * POST /api/gamification/shop/equip
 * @Roles LEARNER
 * @body { itemId: number }
 */
export const equipShopItem = async (itemId: number): Promise<{ message: string }> => {
  const response = await apiClient.post('/gamification/shop/equip', { itemId });
  return response.data.data;
};

/**
 * Get avatar customization
 * GET /api/gamification/avatar/customization
 * @Roles LEARNER
 */
export const getAvatarCustomization = async (): Promise<{
  equippedItems: ShopItem[];
  availableSlots: string[];
}> => {
  const response = await apiClient.get('/gamification/avatar/customization');
  return response.data.data;
};

/**
 * Get leaderboard
 * GET /api/gamification/leaderboard?scope=global&limit=100
 * @Roles LEARNER
 * @param scope: 'global' | 'friends' | 'age_group'
 */
export const getLeaderboard = async (
  scope: 'global' | 'friends' | 'age_group' = 'global',
  limit = 100
): Promise<LeaderboardEntry[]> => {
  const response = await apiClient.get(`/gamification/leaderboard?scope=${scope}&limit=${limit}`);
  return response.data.data;
};

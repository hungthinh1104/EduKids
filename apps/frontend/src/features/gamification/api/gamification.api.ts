import { apiClient } from '@/shared/services/api.client';

// ==================== GAMIFICATION API ====================
// Rewards, badges, shop, leaderboard

export interface RewardSummary {
  totalPoints: number;
  currentLevel: number;
  streakDays: number;
  nextLevelPoints: number;
  badgesEarned: number;
  totalBadges?: number;
  levelProgress?: number;
}

export interface Badge {
  id: number;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  // Fields from ChildBadge join
  earnedAt?: string;
  childId?: number;
  isEarned?: boolean;
  progress?: number;
  requirement?: number;
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
  currentLevel?: number;
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
  const data = response.data.data as {
    totalPoints: number;
    currentLevel: number;
    streakDays: number;
    pointsToNextLevel: number;
    badgesEarned: number;
    totalBadges?: number;
    levelProgress?: number;
  };

  return {
    totalPoints: data.totalPoints,
    currentLevel: data.currentLevel,
    streakDays: data.streakDays,
    nextLevelPoints: data.pointsToNextLevel,
    badgesEarned: data.badgesEarned,
    totalBadges: data.totalBadges,
    levelProgress: data.levelProgress,
  };
};

/**
 * Get all badges with progress
 * GET /api/gamification/badges
 * @Roles LEARNER
 */
export const getAllBadges = async (): Promise<Badge[]> => {
  const response = await apiClient.get('/gamification/badges');
  return (response.data.data as Array<Record<string, unknown>>).map((badge) => ({
    id: Number(badge.id ?? 0),
    name: String(badge.name ?? ''),
    description: typeof badge.description === 'string' ? badge.description : undefined,
    category: typeof badge.category === 'string' ? badge.category : undefined,
    icon: typeof badge.icon === 'string' ? badge.icon : undefined,
    isEarned: Boolean(badge.isEarned),
    progress: typeof badge.progress === 'number' ? badge.progress : undefined,
    requirement: typeof badge.requirement === 'number' ? badge.requirement : undefined,
    earnedAt: typeof badge.earnedAt === 'string' ? badge.earnedAt : undefined,
  }));
};

/**
 * Get earned badges only
 * GET /api/gamification/badges/earned
 * @Roles LEARNER
 */
export const getEarnedBadges = async (): Promise<Badge[]> => {
  const response = await apiClient.get('/gamification/badges/earned');
  return (response.data.data as Array<Record<string, unknown>>).map((badge) => ({
    id: Number(badge.id ?? 0),
    name: String(badge.name ?? ''),
    description: typeof badge.description === 'string' ? badge.description : undefined,
    category: typeof badge.category === 'string' ? badge.category : undefined,
    icon: typeof badge.icon === 'string' ? badge.icon : undefined,
    isEarned: true,
    earnedAt: typeof badge.earnedAt === 'string' ? badge.earnedAt : undefined,
  }));
};

/**
 * Get shop items
 * GET /api/gamification/shop/items?category=AVATAR
 * @Roles LEARNER
 */
export const getShopItems = async (category?: string): Promise<ShopItem[]> => {
  const url = category ? `/gamification/shop/items?category=${category}` : '/gamification/shop/items';
  const response = await apiClient.get(url);
  return (response.data.data as Array<Record<string, unknown>>).map((item) => ({
    id: Number(item.id ?? 0),
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    imageUrl: String(item.imageUrl ?? ''),
    price: Number(item.price ?? 0),
    category: String(item.category ?? 'BACKGROUND') as ShopItem['category'],
    isOwned: Boolean(item.isPurchased),
    isEquipped: Boolean(item.isEquipped),
  }));
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
  const data = response.data.data as Record<string, unknown>;
  const ownedItems = Array.isArray(data.ownedItems) ? data.ownedItems as Array<Record<string, unknown>> : [];

  return {
    equippedItems: ownedItems
      .filter((item) => Boolean(item.isEquipped))
      .map((item) => ({
        id: Number(item.id ?? 0),
        name: String(item.name ?? ''),
        description: String(item.description ?? ''),
        imageUrl: String(item.imageUrl ?? ''),
        price: Number(item.price ?? 0),
        category: String(item.category ?? 'BACKGROUND') as ShopItem['category'],
        isOwned: Boolean(item.isPurchased),
        isEquipped: Boolean(item.isEquipped),
      })),
    availableSlots: ['hair', 'outfit', 'accessory', 'pet', 'background'],
  };
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
  void scope;
  const response = await apiClient.get(`/gamification/leaderboard?limit=${limit}`);
  return (response.data.data as Array<Record<string, unknown>>).map((entry) => ({
    rank: Number(entry.rank ?? 0),
    childId: Number(entry.childId ?? 0),
    nickname: String(entry.childName ?? ''),
    avatarUrl: String(entry.avatar ?? ''),
    totalPoints: Number(entry.totalPoints ?? 0),
    level: Number(entry.currentLevel ?? 0),
    childName: typeof entry.childName === 'string' ? entry.childName : undefined,
    badgesEarned: typeof entry.badgesEarned === 'number' ? entry.badgesEarned : undefined,
  }));
};

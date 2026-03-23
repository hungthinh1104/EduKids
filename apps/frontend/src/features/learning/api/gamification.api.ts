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
  category?: string;
  icon?: string;
  earnedAt?: string;
  isEarned?: boolean;
  progress?: number;
  requirement?: number;
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
  rawCategory: 'AVATAR_HAIR' | 'AVATAR_OUTFIT' | 'AVATAR_ACCESSORY' | 'AVATAR_PET' | 'BACKGROUND';
  imageUrl?: string;
  owned: boolean;
  isEquipped?: boolean;
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
  avatar: string;
  equippedItems: ShopItem[];
  availableItems: ShopItem[];
}

export interface LeaderboardEntry {
  rank: number;
  childId: number;
  childName: string;
  avatar: string;
  totalPoints: number;
  currentLevel: number;
  badgesEarned?: number;
  isCurrentUser?: boolean;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

const mapShopCategoryToLabel = (category: unknown): ShopItem['category'] => {
  switch (String(category ?? '')) {
    case 'AVATAR_HAIR':
      return 'Mũ';
    case 'AVATAR_OUTFIT':
      return 'Áo';
    case 'AVATAR_ACCESSORY':
      return 'Phụ kiện';
    case 'AVATAR_PET':
      return 'Thú cưng';
    case 'BACKGROUND':
      return 'Nền';
    default:
      return 'Khác';
  }
};

const normalizeShopItem = (item: Record<string, unknown>): ShopItem => {
  const rawCategory = String(item.category ?? 'BACKGROUND') as ShopItem['rawCategory'];

  return {
    id: Number(item.id ?? 0),
    name: String(item.name ?? ''),
    description: typeof item.description === 'string' ? item.description : undefined,
    price: Number(item.price ?? 0),
    currency: 'stars',
    category: mapShopCategoryToLabel(rawCategory),
    rawCategory,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
    owned: Boolean(item.isPurchased),
    isEquipped: Boolean(item.isEquipped),
  };
};

export const gamificationApi = {
  // Get rewards summary
  getRewardsSummary: async (childId: number): Promise<RewardsSummary> => {
    void childId;
    const response = await axiosInstance.get<ApiEnvelope<{
      totalPoints: number;
      currentLevel: number;
      pointsToNextLevel: number;
      streakDays: number;
      badgesEarned: number;
      totalBadges?: number;
    }>>('gamification/rewards/summary');

    const payload = response.data.data;
    return {
      totalPoints: payload.totalPoints,
      currentLevel: payload.currentLevel,
      pointsToNextLevel: payload.pointsToNextLevel,
      streakDays: payload.streakDays,
      totalBadges: payload.totalBadges ?? payload.badgesEarned,
      stars: payload.totalPoints,
      coins: 0,
    };
  },

  // Get all badges
  getBadges: async (): Promise<Badge[]> => {
    const response = await axiosInstance.get<ApiEnvelope<Array<Record<string, unknown>>>>('gamification/badges');
    return (response.data.data ?? []).map((badge) => ({
      id: Number(badge.id ?? 0),
      name: String(badge.name ?? ''),
      description: typeof badge.description === 'string' ? badge.description : '',
      category: typeof badge.category === 'string' ? badge.category : 'Khác',
      icon: typeof badge.icon === 'string' ? badge.icon : '🏆',
      isEarned: Boolean(badge.isEarned),
      progress: typeof badge.progress === 'number' ? badge.progress : undefined,
      requirement: typeof badge.requirement === 'number' ? badge.requirement : undefined,
      earnedAt: typeof badge.earnedAt === 'string' ? badge.earnedAt : undefined,
    }));
  },

  // Get earned badges
  getEarnedBadges: async (childId: number): Promise<EarnedBadge[]> => {
    void childId;
    const response = await axiosInstance.get<ApiEnvelope<Array<Record<string, unknown>>>>(
      'gamification/badges/earned'
    );
    return (response.data.data ?? []).map((badge) => ({
      id: Number(badge.id ?? 0),
      name: String(badge.name ?? ''),
      description: typeof badge.description === 'string' ? badge.description : '',
      category: typeof badge.category === 'string' ? badge.category : 'Khác',
      icon: typeof badge.icon === 'string' ? badge.icon : '🏆',
      earnedAt: String(badge.earnedAt ?? new Date().toISOString()),
    }));
  },

  // Get shop items
  getShopItems: async (): Promise<ShopItem[]> => {
    const response = await axiosInstance.get<ApiEnvelope<Array<Record<string, unknown>>>>('gamification/shop/items');
    return (response.data.data ?? []).map(normalizeShopItem);
  },

  // Purchase item
  purchaseItem: async (childId: number, itemId: number): Promise<PurchaseResult> => {
    void childId;
    const response = await axiosInstance.post<ApiEnvelope<{
      itemId: number;
      remainingPoints: number;
      message: string;
    }>>(
      'gamification/shop/purchase',
      { itemId }
    );
    const payload = response.data.data;
    return {
      success: true,
      message: payload.message,
      remainingStars: payload.remainingPoints,
      remainingCoins: 0,
      item: {
        id: payload.itemId,
        name: '',
        price: 0,
        currency: 'stars',
        category: 'Khác',
        rawCategory: 'BACKGROUND',
        owned: true,
        isEquipped: false,
      },
    };
  },

  // Equip item
  equipItem: async (childId: number, itemId: number): Promise<EquipResult> => {
    void childId;
    const response = await axiosInstance.post<ApiEnvelope<EquipResult>>(
      'gamification/shop/equip',
      { itemId }
    );
    return response.data.data;
  },

  // Get avatar customization
  getAvatarCustomization: async (childId: number): Promise<AvatarCustomization> => {
    void childId;
    const response = await axiosInstance.get<ApiEnvelope<{
      childId?: number;
      avatar?: string;
      ownedItems?: Array<Record<string, unknown>>;
    }>>(
      'gamification/avatar/customization'
    );
    const payload = response.data.data;
    const ownedItems = Array.isArray(payload.ownedItems)
      ? payload.ownedItems.map(normalizeShopItem)
      : [];

    return {
      childId: Number(payload.childId ?? 0),
      avatar: typeof payload.avatar === 'string' ? payload.avatar : '',
      equippedItems: ownedItems.filter((item) => item.isEquipped),
      availableItems: ownedItems,
    };
  },

  // Get leaderboard
  getLeaderboard: async (limit: number = 10): Promise<LeaderboardEntry[]> => {
    const response = await axiosInstance.get<ApiEnvelope<Array<Record<string, unknown>>>>(
      `gamification/leaderboard?limit=${limit}`
    );
    return (response.data.data ?? []).map((entry) => ({
      rank: Number(entry.rank ?? 0),
      childId: Number(entry.childId ?? 0),
      childName: typeof entry.childName === 'string' ? entry.childName : 'User',
      avatar: typeof entry.avatar === 'string' ? entry.avatar : '',
      totalPoints: Number(entry.totalPoints ?? 0),
      currentLevel: Number(entry.currentLevel ?? 1),
      badgesEarned: typeof entry.badgesEarned === 'number' ? entry.badgesEarned : undefined,
      isCurrentUser: Boolean(entry.isCurrentUser),
    }));
  },
};

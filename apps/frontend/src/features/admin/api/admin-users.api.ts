import { apiClient } from '@/shared/services/api.client';
import type { AdminUser } from '@/features/admin/components/UserTableRow';

type Dict = Record<string, unknown>;

const isRecord = (value: unknown): value is Dict => typeof value === 'object' && value !== null;

const normalizeUsers = (payload: unknown): AdminUser[] => {
  const rawList =
    Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.items)
        ? payload.items
        : [];

  return rawList.map((rawUser, index) => {
    const user = isRecord(rawUser) ? rawUser : {};
    const rawChildren = Array.isArray(user.children) ? user.children : [];
    const children = rawChildren.map((rawChild) => {
      const child = isRecord(rawChild) ? rawChild : {};
      return {
        nickname: typeof child.nickname === 'string' ? child.nickname : 'Bé',
        age: typeof child.age === 'number' ? child.age : 0,
        totalPoints: typeof child.totalPoints === 'number' ? child.totalPoints : 0,
        streakDays: typeof child.streakDays === 'number' ? child.streakDays : 0,
        currentLevel: typeof child.currentLevel === 'number' ? child.currentLevel : 1,
      };
    });

    const planRaw = typeof user.plan === 'string' ? user.plan.toLowerCase() : '';
    const statusRaw = typeof user.status === 'string' ? user.status.toLowerCase() : '';

    return {
      id: typeof user.id === 'number' ? user.id : index + 1,
      email: typeof user.email === 'string' ? user.email : 'unknown@example.com',
      avatar:
        typeof user.avatar === 'string' && user.avatar.length > 0
          ? user.avatar
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${typeof user.email === 'string' ? user.email : `user-${index + 1}`}`,
      children,
      plan: planRaw === 'premium' ? 'premium' : 'free',
      status:
        statusRaw === 'active' || statusRaw === 'pending' || statusRaw === 'banned'
          ? (statusRaw as 'active' | 'pending' | 'banned')
          : 'active',
      joinedAt: typeof user.joinedAt === 'string' ? user.joinedAt : new Date().toISOString(),
      lastLogin:
        typeof user.lastLogin === 'string'
          ? user.lastLogin
          : typeof user.updatedAt === 'string'
            ? user.updatedAt
            : new Date().toISOString(),
    };
  });
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await apiClient.get('/admin/users');
  return normalizeUsers(response.data?.data ?? response.data);
};


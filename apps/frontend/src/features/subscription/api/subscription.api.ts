import { apiClient } from '@/shared/services/api.client';

export type PlanTier = 'FREE' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Subscription {
  plan: PlanTier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  maxChildProfiles: number;
  features: string[];
}

export const getSubscription = async (): Promise<Subscription> => {
  const response = await apiClient.get('/subscription');
  return response.data.data as Subscription;
};

export const upgradeSubscription = async (
  plan: PlanTier,
  expiresAt?: string,
): Promise<Subscription> => {
  const response = await apiClient.post('/subscription/upgrade', { plan, expiresAt });
  return response.data.data as Subscription;
};

export const cancelSubscription = async (): Promise<Subscription> => {
  const response = await apiClient.delete('/subscription');
  return response.data.data as Subscription;
};

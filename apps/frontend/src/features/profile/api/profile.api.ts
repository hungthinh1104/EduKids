import { apiClient } from '@/shared/services/api.client';
import { setTopicModeProgressChildScope } from '@/features/learning/utils/topic-mode-progress';
import { backupParentSession } from '@/shared/utils/parent-session-handoff';

export interface ChildProfile {
  id: number;
  nickname: string;
  age: number;
  avatar: string;
  totalPoints: number;
  currentLevel: number;
  badgesEarned: number;
  streakDays: number;
  isActive: boolean;
  createdAt: string;
  lastActivityAt: string;
  parentId?: number;
}

export interface ChildProfileWithStats extends ChildProfile {
  rewards: {
    streakDays: number;
    totalPoints: number;
    currentLevel: number;
  };
  hp: number;
}

export interface ProfileSwitchResponse {
  success: boolean;
  message: string;
  profile: ChildProfile;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Get all child profiles for current parent
 * GET /api/profiles
 */
export const getAllProfiles = async (): Promise<ChildProfile[]> => {
  const response = await apiClient.get('/profiles');
  return response.data.data?.profiles || response.data.data || [];
};

/**
 * Get currently active child profile
 * GET /api/profiles/active/current
 */
export const getActiveProfile = async (): Promise<ChildProfileWithStats | null> => {
  try {
    const response = await apiClient.get('/profiles/active/current');
    const profile = response.data.data;
    
    if (!profile) {
      return null;
    }

    setTopicModeProgressChildScope(typeof profile.id === 'number' ? profile.id : null);

    // Backend already includes totalPoints, currentLevel, streakDays
    // Transform to match component expectations
    return {
      ...profile,
      hp: 5, // Default HP (could fetch from learning progress if needed)
      rewards: {
        streakDays: profile.streakDays || 0,
        totalPoints: profile.totalPoints || 0,
        currentLevel: profile.currentLevel || 1,
      },
    };
  } catch (error: unknown) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404) {
      return null; // No active profile
    }
    throw error;
  }
};

/**
 * Switch to a different child profile
 * POST /api/profiles/switch
 * @returns New JWT tokens with LEARNER role
 */
export const switchProfile = async (childId: number): Promise<ProfileSwitchResponse> => {
  backupParentSession();
  const response = await apiClient.post('/profiles/switch', { childId });
  const data = response.data.data;
  
  // Store new tokens with LEARNER role (matching api.client.ts cookie names)
  if (data.accessToken) {
    document.cookie = `access_token=${data.accessToken}; path=/; max-age=${15 * 60}`; // 15 min
  }
  if (data.refreshToken) {
    document.cookie = `refresh_token=${data.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
  }
  
  // CRITICAL: Set role=LEARNER so middleware can validate child routes
  document.cookie = `role=LEARNER; path=/; max-age=${15 * 60}`; // 15 min, same as access_token

  setTopicModeProgressChildScope(childId);
  
  return data;
};

/**
 * Set active child for parent pages without switching auth role.
 * POST /api/profiles/active
 */
export const setActiveProfile = async (childId: number): Promise<ProfileSwitchResponse> => {
  const response = await apiClient.post('/profiles/active', { childId });
  return response.data.data;
};

/**
 * Create a new child profile
 * POST /api/profiles
 */
export const createProfile = async (data: {
  nickname: string;
  age: number;
  avatar?: string;
}): Promise<ChildProfile> => {
  const response = await apiClient.post('/profiles', data);
  return response.data.data.profile;
};

/**
 * Update child profile
 * PUT /api/profiles/:id
 */
export const updateProfile = async (
  id: number,
  data: { nickname?: string; age?: number; avatar?: string }
): Promise<ChildProfile> => {
  const response = await apiClient.put(`/profiles/${id}`, data);
  return response.data.data.profile;
};

/**
 * Delete child profile
 * DELETE /api/profiles/:id
 */
export const deleteProfile = async (id: number): Promise<void> => {
  await apiClient.delete(`/profiles/${id}`);
};

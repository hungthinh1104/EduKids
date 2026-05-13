import Cookies from 'js-cookie';
import { apiClient } from '@/shared/services/api.client';
import { setTopicModeProgressChildScope } from '@/features/learning/utils/topic-mode-progress';
import { backupParentSession } from '@/shared/utils/parent-session-handoff';
import { COOKIE_OPTS, COOKIE_EXPIRY } from '@/shared/constants/cookies';

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
  
  // Store new tokens with LEARNER role
  if (data.accessToken) {
    Cookies.set('access_token', data.accessToken, { ...COOKIE_OPTS, expires: COOKIE_EXPIRY.ACCESS_TOKEN });
  }
  if (data.refreshToken) {
    Cookies.set('refresh_token', data.refreshToken, { ...COOKIE_OPTS, expires: COOKIE_EXPIRY.REFRESH_TOKEN });
  }
  // role must outlive access_token — middleware checks this on every /play request
  Cookies.set('role', 'LEARNER', { ...COOKIE_OPTS, expires: COOKIE_EXPIRY.ROLE });

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

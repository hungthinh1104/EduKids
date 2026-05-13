'use client';

import Cookies from 'js-cookie';
import { clearTopicModeProgressChildScope } from '@/features/learning/utils/topic-mode-progress';

const STORAGE_KEY = 'edukids:parent-session-backup';

type ParentSessionBackup = {
  accessToken: string;
  refreshToken?: string;
  role: 'PARENT' | 'ADMIN';
};

export function backupParentSession(): boolean {
  if (typeof window === 'undefined') return false;

  const accessToken = Cookies.get('access_token');
  const refreshToken = Cookies.get('refresh_token');
  const role = Cookies.get('role');

  if (!accessToken || (role !== 'PARENT' && role !== 'ADMIN')) {
    return false;
  }

  const payload: ParentSessionBackup = {
    accessToken,
    refreshToken,
    role,
  };

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return true;
}

export function restoreParentSession(): string | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as Partial<ParentSessionBackup>;
    if (!payload.accessToken || (payload.role !== 'PARENT' && payload.role !== 'ADMIN')) {
      return null;
    }

    const cookieOpts = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    Cookies.set('access_token', payload.accessToken, { ...cookieOpts, expires: 1 / 24 });

    if (payload.refreshToken) {
      Cookies.set('refresh_token', payload.refreshToken, { ...cookieOpts, expires: 7 });
    }

    Cookies.set('role', payload.role, { ...cookieOpts, expires: 7 });

    clearTopicModeProgressChildScope();

    return payload.role;
  } catch {
    return null;
  } finally {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function clearParentSessionBackup(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage cleanup errors
  }
}

'use client';

import Cookies from 'js-cookie';

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

    Cookies.set('access_token', payload.accessToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (payload.refreshToken) {
      Cookies.set('refresh_token', payload.refreshToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    Cookies.set('role', payload.role, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return payload.role;
  } catch {
    return null;
  } finally {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { switchProfile } from '../api/profile.api';

/**
 * Auto-switch to child profile when entering (child) routes.
 * Only fires once per activeChildId — not on every pathname change.
 */
export function ProfileAutoSwitcher({ activeChildId }: { activeChildId: number | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const isChildRoute = pathname?.startsWith('/play');
  const switchedForId = useRef<number | null>(null);

  useEffect(() => {
    if (!isChildRoute || !activeChildId) return;

    // Already switched for this child in this session
    if (switchedForId.current === activeChildId) return;

    // Role cookie already correct — no need to re-switch
    const role = Cookies.get('role');
    if (role === 'LEARNER') {
      switchedForId.current = activeChildId;
      return;
    }

    const performSwitch = async () => {
      try {
        await switchProfile(activeChildId);
        switchedForId.current = activeChildId;
        router.refresh();
      } catch (error) {
        console.error('[ProfileAutoSwitcher] Failed to switch profile:', error);
      }
    };

    performSwitch();
  }, [activeChildId, isChildRoute, router]);

  return null;
}

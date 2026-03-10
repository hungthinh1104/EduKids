'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { switchProfile } from '../api/profile.api';

/**
 * Auto-switch to child profile when entering (child) routes
 * Ensures JWT has LEARNER role for content access
 */
export function ProfileAutoSwitcher({ activeChildId }: { activeChildId: number | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const isChildRoute = pathname?.startsWith('/play');

  useEffect(() => {
    const performSwitch = async () => {
      // Only auto-switch on child routes and if we have an active profile
      if (!isChildRoute || !activeChildId) {
        return;
      }

      try {
        // Switch profile to get LEARNER role JWT
        await switchProfile(activeChildId);
        console.log(`[ProfileAutoSwitcher] Switched to child profile ${activeChildId}`);
        
        // Force router refresh to use new JWT
        router.refresh();
      } catch (error) {
        console.error('[ProfileAutoSwitcher] Failed to switch profile:', error);
        // Don't redirect on error - let API error handlers deal with it
      }
    };

    performSwitch();
  }, [activeChildId, isChildRoute, router, pathname]);

  return null; // This is a behavior component, renders nothing
}

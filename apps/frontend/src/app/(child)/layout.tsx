'use client';

import type { ReactNode } from 'react';
import { useChildProfiles } from '@/features/dashboard/hooks/useChildProfiles';
import { ProfileAutoSwitcher } from '@/features/profile/components/ProfileAutoSwitcher';

// Full-screen gamified shell — no header, no scroll indicator
export default function ChildLayout({ children }: { children: ReactNode }) {
    // Get active child profile ID for auto-switching
    const { activeProfileId } = useChildProfiles();
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-light via-background to-accent-light">
            {/* Auto-switch to active child profile when entering child routes */}
            <ProfileAutoSwitcher activeChildId={activeProfileId ?? null} />
            {children}
        </div>
    );
}

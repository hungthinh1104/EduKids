import type { ReactNode } from 'react';

// Full-screen gamified shell — no header, no scroll indicator
export default function ChildLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-light via-background to-accent-light">
            {children}
        </div>
    );
}

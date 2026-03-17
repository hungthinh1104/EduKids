export type AppRole = 'PARENT' | 'LEARNER' | 'ADMIN';

export type ChildNavTab = 'map' | 'leaderboard' | 'achievements' | 'shop' | 'review';

export interface ChildNavItem {
    id: ChildNavTab;
    label: string;
    href: string;
}

export interface ParentNavItem {
    href: string;
    label: string;
}

// Route protection definitions (sync with proxy.ts)
export const PUBLIC_PATHS = ['/', '/login', '/register', '/privacy', '/terms', '/faq', '/contact', '/session/restore-parent'];
export const PARENT_PATHS = [
    '/dashboard',
    '/add-child',
    '/reports',
    '/settings',
    '/analytics',
    '/recommendations',
    '/onboarding',
];
export const CHILD_PATHS = ['/play'];
export const ADMIN_PATHS = ['/admin'];

export const ROLE_HOME_ROUTE: Record<AppRole, string> = {
    PARENT: '/dashboard',
    LEARNER: '/play',
    ADMIN: '/admin',
};

export const CHILD_NAV_ITEMS: ChildNavItem[] = [
    { id: 'map', label: 'Bản đồ', href: '/play' },
    { id: 'leaderboard', label: 'BXH', href: '/play/leaderboard' },
    { id: 'achievements', label: 'Huy hiệu', href: '/play/achievements' },
    { id: 'shop', label: 'Shop', href: '/play/shop' },
    { id: 'review', label: 'Ôn tập', href: '/play/review' },
];

export const PARENT_NAV_ITEMS: ParentNavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/reports', label: 'Báo cáo' },
    { href: '/recommendations', label: 'Gợi ý' },
    { href: '/settings', label: 'Cài đặt' },
];

export function getDefaultRouteByRole(role?: string | null): string {
    const normalized = role?.toUpperCase();

    if (normalized === 'LEARNER') return ROLE_HOME_ROUTE.LEARNER;
    if (normalized === 'ADMIN') return ROLE_HOME_ROUTE.ADMIN;

    return ROLE_HOME_ROUTE.PARENT;
}

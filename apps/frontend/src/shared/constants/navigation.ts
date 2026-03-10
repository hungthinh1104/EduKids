export type AppRole = 'PARENT' | 'LEARNER' | 'ADMIN';

export type ChildNavTab = 'map' | 'achievements' | 'shop' | 'review';

export interface ChildNavItem {
    id: ChildNavTab;
    label: string;
    href: string;
}

export interface ParentNavItem {
    href: string;
    label: string;
}

export const ROLE_HOME_ROUTE: Record<AppRole, string> = {
    PARENT: '/dashboard',
    LEARNER: '/play',
    ADMIN: '/admin',
};

export const CHILD_NAV_ITEMS: ChildNavItem[] = [
    { id: 'map', label: 'Bản đồ', href: '/play' },
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

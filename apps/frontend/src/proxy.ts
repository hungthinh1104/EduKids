import { NextRequest, NextResponse } from 'next/server';

/**
 * Route Protection Middleware
 *
 * Route Structure:
 * PUBLIC  → /, /login, /register, /privacy, /terms, /faq, /contact
 * PARENT  → /dashboard, /add-child, /reports, /settings, /analytics, /recommendations, /onboarding
 *         (requires PARENT/ADMIN role)
 * CHILD   → /play, /play/topic/[id] (requires active child session inside parent session)
 * ADMIN   → /admin/* (requires ADMIN role)
 */

const PUBLIC_PATHS = ['/', '/login', '/register', '/privacy', '/terms', '/faq', '/contact'];
const PARENT_PATHS = [
    '/dashboard',
    '/add-child',
    '/reports',
    '/settings',
    '/analytics',
    '/recommendations',
    '/onboarding',
];
const CHILD_PATHS = ['/play'];
const ADMIN_PATHS = ['/admin'];

function matchesPrefix(pathname: string, prefixes: string[]) {
    return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow Next.js internals and static files
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Read tokens from cookies (set by auth store / js-cookie)
    const accessToken = request.cookies.get('access_token')?.value;
    const role = request.cookies.get('role')?.value; // 'PARENT' | 'ADMIN'

    const isPublicPath = matchesPrefix(pathname, PUBLIC_PATHS);

    // ── Unauthenticated user trying to access protected route ──
    if (!accessToken) {
        if (matchesPrefix(pathname, [...PARENT_PATHS, ...CHILD_PATHS, ...ADMIN_PATHS])) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (isPublicPath) {
            return NextResponse.next();
        }
        return NextResponse.next();
    }

    // ── Authenticated user trying to access login/register ──
    if (accessToken && (pathname === '/login' || pathname === '/register')) {
        const target = role === 'ADMIN' ? '/admin' : role === 'LEARNER' ? '/play' : '/dashboard';
        return NextResponse.redirect(new URL(target, request.url));
    }

    // ── Admin path requires ADMIN role ──
    if (matchesPrefix(pathname, ADMIN_PATHS) && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Run on all paths except Next.js internals
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

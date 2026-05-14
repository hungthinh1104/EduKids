import { NextRequest, NextResponse } from 'next/server';

/**
 * Route Protection Middleware
 *
 * Route Structure:
 * PUBLIC  → /, /login, /register, /privacy, /terms, /faq, /contact
 * PARENT  → /dashboard, /add-child, /reports, /settings, /analytics, /recommendations, /onboarding
 *         (requires PARENT or ADMIN role)
 * CHILD   → /play, /play/topic/[id] (requires LEARNER role only)
 * ADMIN   → /admin/* (requires ADMIN role only)
 */

const PUBLIC_PATHS = ['/', '/login', '/register', '/privacy', '/terms', '/faq', '/contact', '/session/restore-parent'];
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
    const role = request.cookies.get('role')?.value; // 'PARENT' | 'LEARNER' | 'ADMIN'

    const isPublicPath = matchesPrefix(pathname, PUBLIC_PATHS);

    // ── Unauthenticated user trying to access protected route ──
    if (!accessToken) {
        if (matchesPrefix(pathname, [...PARENT_PATHS, ...CHILD_PATHS, ...ADMIN_PATHS])) {
            // Preserve the original path for redirect after login (deep-link support)
            const nextUrl = encodeURIComponent(pathname + request.nextUrl.search);
            return NextResponse.redirect(new URL(`/login?next=${nextUrl}`, request.url));
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

    // ── Parent path requires PARENT or ADMIN role ──
    if (matchesPrefix(pathname, PARENT_PATHS) && !['PARENT', 'ADMIN'].includes(role || '')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ── Child path requires LEARNER role only ──
    if (matchesPrefix(pathname, CHILD_PATHS) && role !== 'LEARNER') {
        // If parent is viewing child routes without active child session, redirect to select child
        if (role === 'PARENT' || role === 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard?intent=select-child', request.url));
        }
        // Other cases redirect to home
        return NextResponse.redirect(new URL('/dashboard', request.url));
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

/**
 * Next.js API Proxy Route
 *
 * Mọi request từ browser đến /api/* sẽ được Next.js server
 * forward đến backend (server-to-server = không có CORS).
 *
 * Frontend gọi: POST /api/auth/login
 * Next.js forward: POST https://backend/api/auth/login
 *
 * Đây là cách fix CORS triệt để nhất:
 * - Browser ↔ Vercel (same origin, no CORS)
 * - Vercel ↔ Azure Backend (server-to-server, no CORS)
 */

import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ??
    'http://localhost:3001/api';

// Normalize: ensure BACKEND_URL ends with /api
const API_BASE = BACKEND_URL.endsWith('/api')
    ? BACKEND_URL
    : `${BACKEND_URL}/api`;

type RouteParams = { path: string[] };

async function proxyRequest(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> },
) {
    const { path } = await params;
    const pathStr = path.join('/');

    // Build target URL preserving query string
    const { search } = new URL(request.url);
    const targetUrl = `${API_BASE}/${pathStr}${search}`;

    // Forward safe headers (drop host, content-length, connection)
    const forwardHeaders = new Headers();
    request.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (
            lower === 'host' ||
            lower === 'content-length' ||
            lower === 'connection' ||
            lower === 'transfer-encoding'
        ) return;
        forwardHeaders.set(key, value);
    });

    // Always set Content-Type if not present
    if (!forwardHeaders.has('content-type')) {
        forwardHeaders.set('content-type', 'application/json');
    }

    let body: BodyInit | null = null;
    const method = request.method.toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        body = await request.text();
    }

    try {
        const backendResponse = await fetch(targetUrl, {
            method,
            headers: forwardHeaders,
            body,
            // Required for Node 18+ to allow self-signed certs in dev
            // @ts-expect-error node fetch option
            duplex: 'half',
        });

        // Build response: forward all headers from backend
        const responseHeaders = new Headers();
        backendResponse.headers.forEach((value, key) => {
            const lower = key.toLowerCase();
            // Drop hop-by-hop headers
            if (
                lower === 'connection' ||
                lower === 'transfer-encoding' ||
                lower === 'keep-alive'
            ) return;
            responseHeaders.set(key, value);
        });

        const responseBody = await backendResponse.arrayBuffer();

        return new NextResponse(responseBody, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers: responseHeaders,
        });
    } catch (err) {
        console.error('[API Proxy] Failed to reach backend:', targetUrl, err);
        return NextResponse.json(
            {
                statusCode: 502,
                message: 'Backend is unreachable. Please try again.',
                path: `/${pathStr}`,
                timestamp: new Date().toISOString(),
            },
            { status: 502 },
        );
    }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;

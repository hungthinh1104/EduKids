import { headers } from 'next/headers';

/**
 * Cache strategy helpers for API routes and data fetching
 */

export const CACHE_CONFIG = {
  // No cache - sensitive data
  NONE: { revalidate: 0 },
  
  // Short cache - frequently changing data (5 minutes)
  SHORT: { revalidate: 300 },
  
  // Medium cache - moderately changing data (30 minutes)
  MEDIUM: { revalidate: 1800 },
  
  // Long cache - rarely changing data (1 hour)
  LONG: { revalidate: 3600 },
  
  // Very long cache - static data (1 day)
  VERY_LONG: { revalidate: 86400 },
  
  // ISR - incremental static regeneration
  ISR_SHORT: { revalidate: 600 }, // 10 minutes
  ISR_MEDIUM: { revalidate: 3600 }, // 1 hour
  ISR_LONG: { revalidate: 86400 }, // 1 day
};

/**
 * Get cache headers for responses
 */
export function getCacheHeaders(cacheType: 'public' | 'private' | 'none', duration: number) {
  if (cacheType === 'none') {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  const maxAge = duration;
  const cacheControl = `${cacheType}, max-age=${maxAge}, stale-while-revalidate=${Math.round(maxAge * 1.5)}`;

  return {
    'Cache-Control': cacheControl,
  };
}

/**
 * Generate ETag for cache validation
 */
export function generateETag(data: unknown): string {
  const content = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Check if request has valid ETag (async version)
 */
export async function checkETag(currentETag: string) {
  const requestHeaders = await headers();
  const ifNoneMatch = requestHeaders.get('if-none-match');
  return ifNoneMatch === currentETag;
}

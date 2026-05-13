export const COOKIE_OPTS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const COOKIE_EXPIRY = {
  ACCESS_TOKEN: 1 / 24,  // 1 hour
  REFRESH_TOKEN: 7,       // 7 days
  ROLE: 7,               // 7 days — must match refresh_token lifetime
} as const;

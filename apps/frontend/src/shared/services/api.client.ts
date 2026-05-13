import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/auth.store';
import { COOKIE_OPTS, COOKIE_EXPIRY } from '../constants/cookies';

/**
 * Resolve the API base URL.
 *
 * Strategy:
 * - Browser in production (non-localhost HTTPS page)
 *   → Use Next.js proxy at same-origin `/api`.
 *     This avoids CORS entirely (browser ↔ Vercel is same-origin,
 *     Vercel ↔ Azure is server-to-server with no CORS restriction).
 * - Browser in development (localhost)
 *   → Call backend directly using NEXT_PUBLIC_API_URL.
 * - Server-side (SSR / SSG)
 *   → Call backend directly using NEXT_PUBLIC_API_URL for performance.
 */
const resolveApiUrl = (): string => {
    // ── Browser context ──────────────────────────────────────────
    if (typeof window !== 'undefined') {
        const isLocalhost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        // Production browser: route through Next.js proxy (same-origin → no CORS)
        if (!isLocalhost) {
            return `${window.location.origin}/api`;
        }

        // Development browser: call backend directly
        const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
        if (envUrl) {
            const stripped = envUrl.replace(/\/+$/, '');
            if (stripped.endsWith('/api')) return stripped;
            if (stripped.endsWith('/api/v1')) return stripped.replace(/\/api\/v1$/, '/api');
            return `${stripped}/api`;
        }

        return 'http://localhost:3001/api';
    }

    // ── Server-side context (SSR) ────────────────────────────────
    // Call backend directly for performance (no proxy hop)
    const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (envUrl) {
        const stripped = envUrl.replace(/\/+$/, '');
        if (stripped.endsWith('/api')) return stripped;
        if (stripped.endsWith('/api/v1')) return stripped.replace(/\/api\/v1$/, '/api');
        return `${stripped}/api`;
    }

    return 'http://localhost:3001/api';
};

const API_URL = resolveApiUrl();

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Quan trọng để gửi/nhận JWT cookie (refresh token) từ server
    withCredentials: true,
});

// Flag để ngăn chặn gọi nhiều API refresh token cùng lúc
let isRefreshing = false;
// Mảng chứa các request bị tạm ngưng chờ refresh token xong
let failedQueue: Array<{
    resolve: (token?: string) => void;
    reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

/**
 * REQUEST INTERCEPTOR:
 * - Tự động đính kèm Access Token vào mọi request gửi đi
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * RESPONSE INTERCEPTOR:
 * - Xử lý lỗi toàn cục, đặc biệt là lỗi 401 (Hết hạn Token)
 * - Tự động gọi API `/auth/refresh` để lấy token mới và gọi lại request bị lỗi
 */
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';

        // Nếu lỗi không phải là 401 hoặc request này không tồn tại / đã retry rồi
        if (error.response?.status !== 401 || !originalRequest || (originalRequest as unknown as { _retry?: boolean })._retry) {
            return Promise.reject(error);
        }

        // Không auto-refresh khi chính request login/register bị 401
        if (requestUrl.includes('auth/login') || requestUrl.includes('auth/register')) {
            return Promise.reject(error);
        }

        // Bỏ qua nếu lỗi 401 xảy ra ở chính API refresh token (tránh vòng lặp vô hạn)
        if (requestUrl.includes('auth/refresh')) {
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }

        (originalRequest as unknown as { _retry?: boolean })._retry = true;

        if (isRefreshing) {
            // Nếu đang refresh, đưa request hiện tại vào hàng đợi
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return apiClient(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
        }

        isRefreshing = true;

        try {
            const refreshToken = Cookies.get('refresh_token');
            const { data } = await axios.post(
                `${API_URL}/auth/refresh`,
                refreshToken ? { refreshToken } : {},
                { withCredentials: true },
            );

            const newAccessToken = typeof data?.data?.accessToken === 'string'
                ? data.data.accessToken
                : typeof data?.accessToken === 'string'
                    ? data.accessToken
                    : undefined;

            if (!newAccessToken) {
                throw new Error('Invalid refresh response');
            }

            Cookies.set('access_token', newAccessToken, { ...COOKIE_OPTS, expires: COOKIE_EXPIRY.ACCESS_TOKEN });

            // Cập nhật lại request interceptor cho các API khác sắp tới
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

            // Xử lý lại các request đang đợi trong queue
            processQueue(null, newAccessToken);

            // Gắn token mới vào request vừa bị hỏng và gọi lại
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError as Error, null);

            // Chỉ logout khi backend xác nhận token thực sự hết hạn (401/403).
            // Nếu lỗi là network/502/503 (backend tạm thời không tới được),
            // KHÔNG logout — giữ session, để user thử lại.
            const refreshAxiosError = refreshError as AxiosError;
            const status = refreshAxiosError?.response?.status;
            const isAuthError = status === 401 || status === 403;
            const isNetworkError = !refreshAxiosError?.response;

            if (isAuthError) {
                useAuthStore.getState().logout();
            } else if (!isNetworkError) {
                // 4xx khác hoặc 5xx từ backend → token có vấn đề → logout
                useAuthStore.getState().logout();
            }
            // Network error / 502 / 503: giữ nguyên session, không logout

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

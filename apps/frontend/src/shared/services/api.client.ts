import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/auth.store';

// Lấy API URL từ biến môi trường, mặc định là localhost:3001/api
const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

const API_URL = (() => {
    if (RAW_API_URL.endsWith('/api/v1')) return RAW_API_URL.replace(/\/api\/v1$/, '/api');
    if (RAW_API_URL.endsWith('/api')) return RAW_API_URL;
    return `${RAW_API_URL}/api`;
})();

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

            if (!refreshToken) {
                throw new Error('Missing refresh token');
            }

            // Backend yêu cầu refreshToken trong body
            const { data } = await axios.post(
                `${API_URL}/auth/refresh`,
                { refreshToken },
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

            // Lưu access token mới vào JS Cookie
            Cookies.set('access_token', newAccessToken, { secure: process.env.NODE_ENV === 'production' });

            // Cập nhật lại request interceptor cho các API khác sắp tới
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

            // Xử lý lại các request đang đợi trong queue
            processQueue(null, newAccessToken);

            // Gắn token mới vào request vừa bị hỏng và gọi lại
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);

        } catch (refreshError) {
            // Nếu refresh token cũng thất bại (hết hạn / token không hợp lệ)
            processQueue(refreshError as Error, null);

            // Xóa cookie, update state Zustand => Đẩy người dùng văng ra màn Login
            useAuthStore.getState().logout();

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

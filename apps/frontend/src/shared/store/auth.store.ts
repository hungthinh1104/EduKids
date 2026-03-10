import { create } from 'zustand';
import Cookies from 'js-cookie';

// Tương đương với Entity User ở Backend
export interface User {
    id: number;
    email: string;
    role: string;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (user: User, accessToken: string, role?: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Mặc định là true để chờ check auth lúc mới load app

    setAuth: (user, accessToken, role) => {
        // Lưu access token vào JS Cookie để Axios Interceptor có thể chèn vào Header tự động
        Cookies.set('access_token', accessToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            // expire không thật sự cần thiết nếu token ngắn hạn, nhưng có thể map theo config
            // expire: 1/24 // ví dụ 1 giờ
        });

        // Xóa refresh token cũ ở JS Cookie nếu có (chỉ backend lưu HttpOnly cookie là an toàn nhất)
        Cookies.remove('refresh_token');

        // Middleware đọc role từ cookie để phân quyền route (/admin)
        Cookies.set('role', (role || user.role || '').toUpperCase(), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        set({ user, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
        Cookies.remove('access_token');
        Cookies.remove('role');
        set({ user: null, isAuthenticated: false, isLoading: false });

        // TODO: Chuyển hướng người dùng về trang chủ hoặc màn hình /login 
        // Window object redirect là cách an toàn ngắt mạch React lifecycle
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),
}));

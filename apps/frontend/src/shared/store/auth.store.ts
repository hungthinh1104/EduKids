import { create } from 'zustand';
import Cookies from 'js-cookie';

// Tương đương với Entity User ở Backend
export interface User {
    id: number | string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    isActive: boolean;
    firstName?: string;
    lastName?: string;
    createdAt?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (user: User, accessToken: string, refreshToken?: string, role?: string) => void;
    patchUser: (patch: Partial<User>) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Mặc định là true để chờ check auth lúc mới load app

    setAuth: (user, accessToken, refreshToken, role) => {
        // Lưu access token vào JS Cookie để Axios Interceptor có thể chèn vào Header tự động
        Cookies.set('access_token', accessToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            // expire không thật sự cần thiết nếu token ngắn hạn, nhưng có thể map theo config
            // expire: 1/24 // ví dụ 1 giờ
        });

        if (refreshToken) {
            Cookies.set('refresh_token', refreshToken, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
        } else {
            Cookies.remove('refresh_token');
        }

        // Middleware đọc role từ cookie để phân quyền route (/admin)
        const normalizedRole = (role || user.role || '').toUpperCase();
        Cookies.set('role', normalizedRole, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        set({
            user: {
                ...user,
                role: normalizedRole || user.role,
            },
            isAuthenticated: true,
            isLoading: false,
        });
    },

    logout: () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('role');
        set({ user: null, isAuthenticated: false, isLoading: false });

        // Use window.location.href for logout to ensure hard page reload
        // and complete cleanup of cookies. Router.push is not sufficient
        // because it doesn't hard-refresh and cookies may persist in memory.
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),

    patchUser: (patch) =>
        set((state) =>
            state.user ? { user: { ...state.user, ...patch } } : state,
        ),
}));

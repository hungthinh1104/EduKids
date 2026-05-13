import { create } from 'zustand';
import Cookies from 'js-cookie';
import { clearTopicModeProgressChildScope } from '@/features/learning/utils/topic-mode-progress';

// Tương đương với Entity User ở Backend
export interface User {
    id: number;
    email: string;
    role: string;
    isEmailVerified?: boolean;
    isActive?: boolean;
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
        const isProd = process.env.NODE_ENV === 'production';
        // access_token: 1 giờ (JWT_EXPIRY = 15m nhưng cookie sống lâu hơn để refresh kịp)
        Cookies.set('access_token', accessToken, {
            secure: isProd,
            sameSite: 'lax',
            expires: 1 / 24, // 1 hour
        });

        if (refreshToken) {
            // refresh_token: 7 ngày (khớp JWT_REFRESH_EXPIRY)
            Cookies.set('refresh_token', refreshToken, {
                secure: isProd,
                sameSite: 'lax',
                expires: 7,
            });
        } else {
            Cookies.remove('refresh_token');
        }

        // Middleware đọc role từ cookie để phân quyền route (/admin)
        const normalizedRole = (role || user.role || '').toUpperCase();
        Cookies.set('role', normalizedRole, {
            secure: isProd,
            sameSite: 'lax',
            expires: 7, // sống cùng với refresh_token
        });

        if (normalizedRole === 'PARENT' || normalizedRole === 'ADMIN') {
            clearTopicModeProgressChildScope();
        }

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
        clearTopicModeProgressChildScope();
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

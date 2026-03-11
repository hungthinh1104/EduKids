import { apiClient } from '@/shared/services/api.client';
import { ApiEnvelope, AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<ApiEnvelope<AuthResponse>>('auth/login', data);
        return response.data.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<ApiEnvelope<AuthResponse>>('auth/register', data);
        return response.data.data;
    },

    logout: async () => {
        return apiClient.post('auth/logout');
    },

    exitChildMode: async (): Promise<AuthResponse> => {
        const response = await apiClient.post<ApiEnvelope<AuthResponse>>('auth/exit-child');
        return response.data.data;
    },

    forgotPassword: async (email: string): Promise<{ message: string; resetToken?: string }> => {
        const response = await apiClient.post<ApiEnvelope<{ message: string; resetToken?: string }>>(
            'auth/forgot-password',
            { email },
        );
        return response.data.data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const response = await apiClient.post<ApiEnvelope<{ message: string }>>(
            'auth/reset-password',
            { token, newPassword },
        );
        return response.data.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const response = await apiClient.post<ApiEnvelope<{ message: string }>>(
            'auth/change-password',
            { currentPassword, newPassword },
        );
        return response.data.data;
    },

    updateProfile: async (data: { firstName?: string; lastName?: string }): Promise<{ message: string }> => {
        const response = await apiClient.patch<ApiEnvelope<{ message: string }>>(
            'auth/profile',
            data,
        );
        return response.data.data;
    },
};

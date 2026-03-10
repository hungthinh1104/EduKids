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
    }
};

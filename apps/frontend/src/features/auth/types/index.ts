import { User } from '@/shared/store/auth.store';
export type { User };

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface ApiEnvelope<T> {
    statusCode: number;
    message: string;
    data: T;
    timestamp?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    role: string;
    user: User;
}

export interface SwitchProfileResponse {
    learnerToken: string;
    child: {
        id: number;
        nickname: string;
        age: number;
    };
}

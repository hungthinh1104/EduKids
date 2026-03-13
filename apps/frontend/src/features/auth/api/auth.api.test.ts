import { authApi } from './auth.api';
import { apiClient } from '@/shared/services/api.client';
import { LoginRequest, RegisterRequest } from '../types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('authApi', () => {
  let mockedPost: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockedPost = vi.spyOn(apiClient, 'post');
    mockedPost.mockReset();
  });

  it('login calls POST auth/login and returns response data', async () => {
    const payload: LoginRequest = {
      email: 'parent@example.com',
      password: 'SecurePass123',
    };

    const apiResponse = {
      data: {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          role: 'PARENT',
          user: {
            id: '1',
            email: payload.email,
            firstName: 'John',
            lastName: 'Doe',
            role: 'PARENT',
            isAuthenticated: true,
          },
        },
      },
    };

    mockedPost.mockResolvedValueOnce(apiResponse);

    const result = await authApi.login(payload);

    expect(mockedPost).toHaveBeenCalledWith('auth/login', payload);
    expect(result).toEqual(apiResponse.data.data);
  });

  it('register calls POST auth/register and returns response data', async () => {
    const payload: RegisterRequest = {
      firstName: 'Alice',
      lastName: 'Nguyen',
      email: 'alice@example.com',
      password: 'SecurePass123',
    };

    const apiResponse = {
      data: {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          role: 'PARENT',
          user: {
            id: '2',
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            role: 'PARENT',
            isAuthenticated: true,
          },
        },
      },
    };

    mockedPost.mockResolvedValueOnce(apiResponse);

    const result = await authApi.register(payload);

    expect(mockedPost).toHaveBeenCalledWith('auth/register', payload);
    expect(result).toEqual(apiResponse.data.data);
  });

  it('logout calls POST auth/logout', async () => {
    mockedPost.mockResolvedValueOnce({ data: {} });

    await authApi.logout();

    expect(mockedPost).toHaveBeenCalledWith('auth/logout');
  });
});

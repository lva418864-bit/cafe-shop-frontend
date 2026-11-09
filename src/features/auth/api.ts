import { authClient } from '@/services/axios';
import { unwrap } from '@/lib/apiResponse';
import type { ApiResponse } from '@/types/api';
import type {
  AuthUser,
  CreateUserRequest,
  LoginRequest,
  TokenResponse,
} from '@/features/auth/types';

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const response = await authClient.post<ApiResponse<TokenResponse>>('/api/auth/login', payload);
  return unwrap(response.data);
}

export async function register(payload: CreateUserRequest): Promise<AuthUser> {
  const response = await authClient.post<ApiResponse<AuthUser>>('/api/auth', payload);
  return unwrap(response.data);
}

export async function getMe(): Promise<AuthUser> {
  const response = await authClient.get<ApiResponse<AuthUser>>('/api/auth/me');
  return unwrap(response.data);
}

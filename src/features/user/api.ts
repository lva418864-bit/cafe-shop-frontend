import { authClient } from '@/services/axios';
import { unwrap } from '@/lib/apiResponse';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  UserResponse,
} from '@/features/user/types';

export interface ListUsersParams {
  page?: number;
  page_size?: number;
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedData<UserResponse>> {
  const response = await authClient.get<ApiResponse<PaginatedData<UserResponse>>>('/api/auth', {
    params,
  });
  return unwrap(response.data);
}

export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const response = await authClient.post<ApiResponse<UserResponse>>('/api/auth', payload);
  return unwrap(response.data);
}

export async function getUser(id: number): Promise<UserResponse> {
  const response = await authClient.get<ApiResponse<UserResponse>>(`/api/auth/${id}`);
  return unwrap(response.data);
}

export async function updateUser(id: number, payload: UpdateUserRequest): Promise<UserResponse> {
  const response = await authClient.put<ApiResponse<UserResponse>>(`/api/auth/${id}`, payload);
  return unwrap(response.data);
}

export async function updateUserRole(
  id: number,
  payload: UpdateUserRoleRequest,
): Promise<UserResponse> {
  const response = await authClient.patch<ApiResponse<UserResponse>>(
    `/api/auth/${id}/role`,
    payload,
  );
  return unwrap(response.data);
}

export async function changePassword(
  id: number,
  payload: ChangePasswordRequest,
): Promise<UserResponse> {
  const response = await authClient.patch<ApiResponse<UserResponse>>(
    `/api/auth/${id}/password`,
    payload,
  );
  return unwrap(response.data);
}

export async function deleteUser(id: number): Promise<UserResponse> {
  const response = await authClient.delete<ApiResponse<UserResponse>>(`/api/auth/${id}`);
  return unwrap(response.data);
}

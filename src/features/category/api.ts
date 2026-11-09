import { operationClient } from '@/services/axios';
import { unwrap } from '@/lib/apiResponse';
import type { ApiResponse } from '@/types/api';
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from './types';

export async function listCategories(): Promise<CategoryResponse[]> {
  const response = await operationClient.get<ApiResponse<CategoryResponse[]>>('/api/categories');
  return unwrap(response.data);
}

export async function createCategory(payload: CreateCategoryRequest): Promise<CategoryResponse> {
  const response = await operationClient.post<ApiResponse<CategoryResponse>>(
    '/api/categories',
    payload,
  );
  return unwrap(response.data);
}

export async function updateCategory(
  id: number,
  payload: UpdateCategoryRequest,
): Promise<CategoryResponse> {
  const response = await operationClient.put<ApiResponse<CategoryResponse>>(
    `/api/categories/${id}`,
    payload,
  );
  return unwrap(response.data);
}

export async function deleteCategory(id: number): Promise<CategoryResponse> {
  const response = await operationClient.delete<ApiResponse<CategoryResponse>>(
    `/api/categories/${id}`,
  );
  return unwrap(response.data);
}

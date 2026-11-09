import { operationClient } from '@/services/axios';
import { unwrap } from '@/lib/apiResponse';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type {
  AdjustStockRequest,
  CreateProductRequest,
  ProductImageResponse,
  ProductResponse,
  UpdateProductImageRequest,
  UpdateProductRequest,
} from '@/features/product/types';

export interface UploadProductImageOptions {
  altText?: string;
  isPrimary?: boolean;
  replaceExisting?: boolean;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface ListProductsParams {
  page?: number;
  page_size?: number;
  active_only?: boolean;
}

export async function listProducts(
  params: ListProductsParams,
): Promise<PaginatedData<ProductResponse>> {
  const response = await operationClient.get<ApiResponse<PaginatedData<ProductResponse>>>(
    '/api/products',
    { params },
  );
  return unwrap(response.data);
}

export async function getProduct(id: number): Promise<ProductResponse> {
  const response = await operationClient.get<ApiResponse<ProductResponse>>(`/api/products/${id}`);
  return unwrap(response.data);
}

export async function createProduct(payload: CreateProductRequest): Promise<ProductResponse> {
  const response = await operationClient.post<ApiResponse<ProductResponse>>(
    '/api/products',
    payload,
  );
  return unwrap(response.data);
}

export async function updateProduct(
  id: number,
  payload: UpdateProductRequest,
): Promise<ProductResponse> {
  const response = await operationClient.put<ApiResponse<ProductResponse>>(
    `/api/products/${id}`,
    payload,
  );
  return unwrap(response.data);
}

export async function adjustStock(
  id: number,
  payload: AdjustStockRequest,
): Promise<ProductResponse> {
  const response = await operationClient.post<ApiResponse<ProductResponse>>(
    `/api/products/${id}/stock`,
    payload,
  );
  return unwrap(response.data);
}

export async function deactivateProduct(id: number): Promise<ProductResponse> {
  const response = await operationClient.delete<ApiResponse<ProductResponse>>(
    `/api/products/${id}`,
  );
  return unwrap(response.data);
}

export async function uploadProductImage(
  productId: number,
  file: File,
  options: UploadProductImageOptions = {},
): Promise<ProductImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.altText !== undefined) {
    formData.append('alt_text', options.altText);
  }
  formData.append('is_primary', String(options.isPrimary ?? true));
  formData.append('replace_existing', String(options.replaceExisting ?? true));

  const response = await operationClient.post<ApiResponse<ProductImageResponse>>(
    `/api/products/${productId}/images`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
      signal: options.signal,
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total && progressEvent.total > 0) {
          const percent = Math.min(
            100,
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
          );
          options.onProgress(percent);
        }
      },
    },
  );
  return unwrap(response.data);
}

export async function updateProductImage(
  productId: number,
  imageId: string,
  payload: UpdateProductImageRequest,
): Promise<ProductImageResponse> {
  const response = await operationClient.patch<ApiResponse<ProductImageResponse>>(
    `/api/products/${productId}/images/${imageId}`,
    payload,
  );
  return unwrap(response.data);
}

export async function deleteProductImage(
  productId: number,
  imageId: string,
): Promise<{ deleted: boolean; id: string }> {
  const response = await operationClient.delete<ApiResponse<{ deleted: boolean; id: string }>>(
    `/api/products/${productId}/images/${imageId}`,
  );
  return unwrap(response.data);
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as productApi from '@/features/product/api';
import type { ListProductsParams, UploadProductImageOptions } from '@/features/product/api';
import type {
  AdjustStockRequest,
  CreateProductRequest,
  ProductResponse,
  UpdateProductImageRequest,
  UpdateProductRequest,
} from '@/features/product/types';
import { queryKeys } from '@/constants/queryKeys';
import { useToast } from '@/hooks/useToast';
import type { ApiError } from '@/services/apiError';

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productApi.listProducts(params),
    // v5's replacement for the old keepPreviousData option - keeps the
    // current page's rows on screen (instead of a loading flash) while the
    // next page fetches.
    placeholderData: (previousData) => previousData,
  });
}

export function useProduct(id: number, initialData?: ProductResponse) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productApi.getProduct(id),
    enabled: Number.isFinite(id),
    initialData,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateProductRequest) => productApi.createProduct(payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast({
        title: 'Product added',
        description: `"${product.name}" was created.`,
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({ title: 'Could not add product', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateProductRequest) => productApi.updateProduct(id, payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.setQueryData(queryKeys.products.detail(id), product);
      toast({ title: 'Product updated', variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not update product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAdjustStock(id: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AdjustStockRequest) => productApi.adjustStock(id, payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.setQueryData(queryKeys.products.detail(id), product);
      toast({
        title: 'Stock updated',
        description: `New stock: ${product.stock_quantity}`,
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not adjust stock',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => productApi.deactivateProduct(id),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.setQueryData(queryKeys.products.detail(product.id), product);
      toast({
        title: 'Product deactivated',
        description: `"${product.name}" is no longer orderable.`,
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not deactivate product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUploadProductImage(productId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ file, options }: { file: File; options?: UploadProductImageOptions }) =>
      productApi.uploadProductImage(productId, file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast({
        title: 'Image uploaded',
        description: 'Product image has been saved.',
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Image upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProductImage(productId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ imageId, payload }: { imageId: string; payload: UpdateProductImageRequest }) =>
      productApi.updateProductImage(productId, imageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast({
        title: 'Image updated',
        description: 'Image metadata saved.',
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not update image',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteProductImage(productId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (imageId: string) => productApi.deleteProductImage(productId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast({
        title: 'Image removed',
        description: 'Product image was deleted.',
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not delete image',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

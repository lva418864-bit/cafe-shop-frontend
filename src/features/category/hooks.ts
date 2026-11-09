import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { listCategories, createCategory, updateCategory, deleteCategory } from './api';
import type { CreateCategoryRequest, UpdateCategoryRequest } from './types';

export const categoryKeys = {
  all: ['categories'] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => listCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Category created' });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryRequest }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Category updated' });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Category deleted' });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

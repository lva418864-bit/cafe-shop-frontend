'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as userApi from '@/features/user/api';
import type { ListUsersParams } from '@/features/user/api';
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
} from '@/features/user/types';
import { queryKeys } from '@/constants/queryKeys';
import { useToast } from '@/hooks/useToast';
import type { ApiError } from '@/services/apiError';
import { useAuthStore } from '@/store/authStore';

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => userApi.createUser(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast({
        title: 'User created',
        description: `"${user.username}" was created as a customer. Promote their role below if needed.`,
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({ title: 'Could not create user', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userApi.listUsers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userApi.getUser(id),
    enabled: Number.isFinite(id),
    retry: false, // a 403 (viewing someone else without admin/staff) isn't worth retrying
  });
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateUserRequest) => userApi.updateUser(id, payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.users.detail(id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      // Keep the Navbar / authStore in sync if this was the caller's own profile.
      if (currentUser?.id === user.id) {
        setAuthUser(user);
      }
      toast({ title: 'Profile updated', variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not update profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateUserRole(id: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateUserRoleRequest) => userApi.updateUserRole(id, payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.users.detail(id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast({ title: `Role updated to ${user.role}`, variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({ title: 'Could not update role', description: error.message, variant: 'destructive' });
    },
  });
}

export function useChangePassword(id: number) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => userApi.changePassword(id, payload),
    onSuccess: () => {
      toast({ title: 'Password changed', variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not change password',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => userApi.deleteUser(id),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.users.detail(user.id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast({
        title: 'User deactivated',
        description: `"${user.username}" can no longer log in.`,
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not deactivate user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

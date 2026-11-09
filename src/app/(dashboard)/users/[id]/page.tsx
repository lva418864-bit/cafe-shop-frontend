'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleBadge } from '@/features/user/components/role-badge';
import {
  useChangePassword,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserRole,
  useUser,
} from '@/features/user/hooks';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
  updateUserSchema,
  type UpdateUserFormValues,
} from '@/features/user/validation';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { formatDate } from '@/utils/formatDate';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/enums';

const ROLE_OPTIONS = [
  { label: 'Customer', value: 'customer' },
  { label: 'Staff', value: 'staff' },
  { label: 'Admin', value: 'admin' },
];

// No RoleGuard on this page - GET /user/{id} is legitimately "self or
// admin/staff" (Step 1), so any authenticated user can land here to view
// their own profile. If a customer navigates to someone else's id, the
// backend itself 403s and useUser's isError renders the ErrorState below -
// that's the real authorization boundary, not a frontend gate.
export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);

  const currentUser = useAuthStore((s) => s.user);
  const isSelf = currentUser?.id === userId;
  const isAdmin = hasAnyRole(currentUser?.role, ['admin']);

  const { data: user, isPending, isError, refetch } = useUser(userId);
  const updateUser = useUpdateUser(userId);
  const updateRole = useUpdateUserRole(userId);
  const changePassword = useChangePassword(userId);
  const deleteUser = useDeleteUser();

  const [editMode, setEditMode] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | undefined>(undefined);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const profileForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    values: user
      ? { username: user.username, email: user.email, is_active: user.is_active }
      : undefined,
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { old_password: '', new_password: '', confirm_password: '' },
  });

  if (isPending) {
    return (
      <div className="max-w-xl space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <ErrorState
        title="Could not load this profile"
        description="It may not exist, or you don't have permission to view it."
        onRetry={() => refetch()}
      />
    );
  }

  const canEdit = isSelf || isAdmin;
  const canManageRole = isAdmin && !isSelf;
  const canDeactivate = isAdmin && !isSelf && user.is_active;

  const onSubmitProfile = (values: UpdateUserFormValues) => {
    // Only admins editing someone else can flip is_active from this form -
    // self-edit always resends the user's current value unchanged, since
    // self-deactivation isn't a flow this page surfaces.
    updateUser.mutate(
      { ...values, is_active: isSelf ? user.is_active : values.is_active },
      { onSuccess: () => setEditMode(false) },
    );
  };

  const onSubmitPassword = (values: ChangePasswordFormValues) => {
    changePassword.mutate(
      { old_password: values.old_password, new_password: values.new_password },
      {
        onSuccess: () =>
          passwordForm.reset({ old_password: '', new_password: '', confirm_password: '' }),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title={user.username}
        breadcrumb={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Users', href: ROUTES.USERS },
          { label: user.username },
        ]}
      />

      <div className="grid max-w-3xl gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Profile</CardTitle>
            {canEdit && !editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!editMode ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  <span className={user.is_active ? 'text-sage-600' : 'text-foreground/50'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-foreground/50">Email</dt>
                    <dd className="text-foreground">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/50">Joined</dt>
                    <dd className="text-foreground">{formatDate(user.created_at)}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <form
                onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                className="space-y-4"
                noValidate
              >
                <Input
                  label="Username"
                  error={profileForm.formState.errors.username?.message}
                  {...profileForm.register('username')}
                />
                <Input
                  label="Email"
                  type="email"
                  error={profileForm.formState.errors.email?.message}
                  {...profileForm.register('email')}
                />
                {isAdmin && !isSelf && (
                  <label className="text-foreground flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="border-border accent-roast-600 h-4 w-4 rounded"
                      {...profileForm.register('is_active')}
                    />
                    Active
                  </label>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={updateUser.isPending}>
                    Save
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isSelf && (
            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                  className="space-y-3"
                  noValidate
                >
                  <Input
                    label="Current password"
                    type="password"
                    error={passwordForm.formState.errors.old_password?.message}
                    {...passwordForm.register('old_password')}
                  />
                  <Input
                    label="New password"
                    type="password"
                    error={passwordForm.formState.errors.new_password?.message}
                    {...passwordForm.register('new_password')}
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    error={passwordForm.formState.errors.confirm_password?.message}
                    {...passwordForm.register('confirm_password')}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    isLoading={changePassword.isPending}
                  >
                    Update password
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {canManageRole && (
            <Card>
              <CardHeader>
                <CardTitle>Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SelectField
                  options={ROLE_OPTIONS}
                  value={pendingRole ?? user.role}
                  onValueChange={setPendingRole}
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!pendingRole || pendingRole === user.role}
                  isLoading={updateRole.isPending}
                  onClick={() => pendingRole && updateRole.mutate({ role: pendingRole as Role })}
                >
                  Update role
                </Button>
              </CardContent>
            </Card>
          )}

          {canDeactivate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-brick-600">Danger zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Deactivate user
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Deactivate this user?"
        description={`"${user.username}" will no longer be able to log in.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deleteUser.isPending}
        onConfirm={() =>
          deleteUser.mutate(user.id, { onSuccess: () => setConfirmDeleteOpen(false) })
        }
      />
    </div>
  );
}

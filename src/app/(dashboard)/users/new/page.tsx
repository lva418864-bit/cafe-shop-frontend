'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { PageHeader } from '@/components/common/page-header';
import { RoleGuard } from '@/components/common/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateUser } from '@/features/user/hooks';
import { createUserSchema, type CreateUserFormValues } from '@/features/user/validation';
import { ROUTES } from '@/constants/routes';

export default function NewUserPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <NewUserContent />
    </RoleGuard>
  );
}

function NewUserContent() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({ resolver: zodResolver(createUserSchema) });

  const createUser = useCreateUser();

  const onSubmit = (values: CreateUserFormValues) => {
    createUser.mutate(values, {
      onSuccess: (user) => router.push(ROUTES.userDetail(user.id)),
    });
  };

  return (
    <div>
      <PageHeader
        title="Create User"
        breadcrumb={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Users', href: ROUTES.USERS },
          { label: 'Create' },
        ]}
      />

      <Card className="max-w-xl">
        <CardContent className="pt-6">
          <p className="text-foreground/60 mb-4 text-sm">
            This uses the same registration endpoint as public sign-up, so the new account always
            starts as a customer. Open their profile afterward to promote the role if needed.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input label="Username" error={errors.username?.message} {...register('username')} />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              hint="8-72 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(ROUTES.USERS)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createUser.isPending}>
                Create User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

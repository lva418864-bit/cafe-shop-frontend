'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useRegister } from '@/features/auth/hooks';
import { registerSchema, type RegisterFormValues } from '@/features/auth/validation';
import { sanitizeNextPath } from '@/utils/safeNextPath';

export default function RegisterPage() {
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const raw = sp.get('next') || sp.get('redirect');
      const safe = sanitizeNextPath(raw, '');
      setNextPath(safe || null);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const registerMutation = useRegister();

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  const loginHref = nextPath
    ? `${ROUTES.LOGIN}?next=${encodeURIComponent(nextPath)}`
    : ROUTES.LOGIN;

  return (
    <div className="border-border bg-surface rounded-lg border p-8 shadow-sm">
      <h1 className="font-display text-foreground text-2xl">Create account</h1>
      <p className="text-foreground/60 mt-1 text-sm">
        {nextPath
          ? 'Create an account to complete your order. Your cart items are saved.'
          : 'New accounts start as customers. Ask an admin to grant staff/admin access.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Input
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="8-72 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
          Create account
        </Button>
      </form>

      <p className="text-foreground/60 mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href={loginHref} className="text-roast-600 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

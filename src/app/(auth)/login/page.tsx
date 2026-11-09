'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema, type LoginFormValues } from '@/features/auth/validation';
import { sanitizeNextPath } from '@/utils/safeNextPath';

export default function LoginPage() {
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
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useLogin();

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const registerHref = nextPath
    ? `${ROUTES.REGISTER}?next=${encodeURIComponent(nextPath)}`
    : ROUTES.REGISTER;

  return (
    <div className="border-border bg-surface rounded-lg border p-8 shadow-sm">
      <h1 className="font-display text-foreground text-2xl">Log in</h1>
      <p className="text-foreground/60 mt-1 text-sm">
        {nextPath
          ? 'Log in to continue with your order. Your cart items are saved.'
          : 'Welcome back to the Coffee Shop.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
          Log in
        </Button>
      </form>

      <p className="text-foreground/60 mt-6 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href={registerHref} className="text-roast-600 underline">
          Create one
        </Link>
      </p>
      <p className="text-foreground/50 mt-2 text-center text-xs">
        <Link href={ROUTES.PRODUCTS} className="hover:text-foreground underline">
          Continue browsing products as a guest
        </Link>
      </p>
    </div>
  );
}

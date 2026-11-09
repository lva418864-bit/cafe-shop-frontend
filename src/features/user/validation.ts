import { z } from 'zod';

import { ROLES } from '@/types/enums';

// Mirrors user_service's Pydantic validation exactly (Step 1).
export const createUserSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(255, 'Username must be at most 255 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(255, 'Username must be at most 255 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  is_active: z.boolean(),
});
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(ROLES),
});
export type UpdateUserRoleFormValues = z.infer<typeof updateUserRoleSchema>;

// confirm_password is frontend-only (stripped before the API call) - the
// backend's ChangePasswordRequest only takes old_password/new_password.
export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

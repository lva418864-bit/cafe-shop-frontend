import { z } from 'zod';

// Mirrors user_service's Pydantic validation exactly (verified Step 1):
// LoginRequest has no length constraints (it's checked against an existing
// password server-side, not created), CreateUserRequest enforces
// username 1-255, password 8-72 (bcrypt's own limit).

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
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
export type RegisterFormValues = z.infer<typeof registerSchema>;

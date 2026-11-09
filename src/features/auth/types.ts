import type { Role } from '@/types/enums';

// Mirrors user_service's schemas/user_schema.py exactly (verified Step 1).
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in_minutes: number;
  user: AuthUser;
}

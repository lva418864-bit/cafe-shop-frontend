import type { Role } from '@/types/enums';

// Mirrors user_service's schemas/user_schema.py exactly (Step 1).
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  is_active: boolean;
}

export interface UpdateUserRoleRequest {
  role: Role;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

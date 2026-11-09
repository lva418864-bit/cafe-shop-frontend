import { create } from 'zustand';

import { clearSession, persistSession } from '@/services/auth';
import type { AuthUser } from '@/features/auth/types';

interface AuthState {
  user: AuthUser | null;
  /**
   * "idle": haven't checked yet. "authenticated": we have a verified user
   * (from GET /user/me or a fresh login/register). "unauthenticated": we
   * confirmed there's no valid session. See features/auth/components/
   * session-bootstrap.tsx for how this gets driven on page load.
   */
  status: 'idle' | 'authenticated' | 'unauthenticated';
  setSession: (token: string, user: AuthUser, expiresInMinutes?: number) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  setSession: (token, user, expiresInMinutes) => {
    persistSession(token, expiresInMinutes);
    set({ user, status: 'authenticated' });
  },

  setUser: (user) => set({ user, status: 'authenticated' }),

  clearAuth: () => {
    clearSession();
    set({ user: null, status: 'unauthenticated' });
  },
}));

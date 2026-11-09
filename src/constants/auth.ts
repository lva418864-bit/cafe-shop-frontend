/**
 * Shared between services/auth.ts (browser-only) and middleware.ts (Edge
 * runtime, no window/localStorage) - kept as plain string constants with no
 * side effects so it's safe to import from either.
 */
export const ACCESS_TOKEN_STORAGE_KEY = 'coffee-shop-access-token';

// This cookie holds only a presence flag ("1"), never the actual JWT. The
// real token stays in localStorage only, used solely by the axios request
// interceptor. The cookie exists purely so middleware - which cannot read
// localStorage - can do a fast "is there a session at all" check at the
// edge and redirect before any protected content ever renders. It is NOT a
// separate security boundary: like localStorage, it's plain JS-readable,
// not httpOnly (the FastAPI backend doesn't set cookies - it returns JSON).
export const SESSION_COOKIE_NAME = 'coffee-shop-session';

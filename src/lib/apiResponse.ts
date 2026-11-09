import type { ApiResponse } from '@/types/api';

/**
 * Every feature's api.ts function should route its response through this
 * instead of casting `response.data.data as T` directly - a successful
 * response should never actually have null data, but this makes that
 * assumption explicit and fails loudly (rather than silently propagating
 * `null` into a component expecting `T`) if the backend ever violates it.
 */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (response.data === null) {
    throw new Error(response.message || 'Expected data in a successful API response, got null.');
  }
  return response.data;
}

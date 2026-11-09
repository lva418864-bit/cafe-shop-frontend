/**
 * Envelope shapes verified against actual source in Step 1. Every custom
 * success/error response from all three services uses ApiResponse<T> -
 * FastAPI's own 422 validation errors do NOT (see FastApiValidationErrorResponse
 * below), which is why services/apiError.ts has to branch on shape, not just status.
 */
export interface ApiResponse<T> {
  success: boolean;
  error_code: string | null;
  message: string;
  data: T | null;
}

export interface PageMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PageMeta;
}

export interface FastApiValidationDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface FastApiValidationErrorResponse {
  detail: FastApiValidationDetail[];
}

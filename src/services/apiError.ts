import axios from 'axios';

import type { FastApiValidationDetail } from '@/types/api';

export interface ApiErrorShape {
  status: number;
  code: string;
  message: string;
  /** Only populated for 422 validation errors - field name -> message. */
  fieldErrors?: Record<string, string>;
}

/**
 * Every axios call in this app rejects with this, never a raw AxiosError -
 * so React Query's `error` in every hook (Step 6/7) has one predictable
 * shape regardless of which of the three services or which error format
 * (custom ApplicationError envelope vs FastAPI's raw 422) produced it.
 */
export class ApiError extends Error implements ApiErrorShape {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;

  constructor({ status, code, message, fieldErrors }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function fieldNameFromLoc(loc: (string | number)[]): string {
  // FastAPI's loc is typically ["body", "field_name"] or ["query", "field_name"].
  const last = loc[loc.length - 1];
  return String(last);
}

function parseValidationError(detail: FastApiValidationDetail[], status: number): ApiError {
  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  for (const issue of detail) {
    const field = fieldNameFromLoc(issue.loc);
    fieldErrors[field] = issue.msg;
    messages.push(`${field}: ${issue.msg}`);
  }

  return new ApiError({
    status,
    code: 'validation_error',
    message: messages.join('; ') || 'Validation failed.',
    fieldErrors,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeAxiosError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError({
      status: 0,
      code: 'unknown_error',
      message: 'An unexpected error occurred.',
    });
  }

  if (!error.response) {
    return new ApiError({
      status: 0,
      code: 'network_error',
      message: 'Could not reach the server. Check your connection and that the backend is running.',
    });
  }

  const { status, data } = error.response;

  if (status === 422 && isRecord(data) && Array.isArray(data.detail)) {
    return parseValidationError(data.detail as FastApiValidationDetail[], status);
  }

  if (isRecord(data) && data.success === false) {
    const errorCode = typeof data.error_code === 'string' ? data.error_code : 'unknown_error';
    const message = typeof data.message === 'string' ? data.message : 'Something went wrong.';
    return new ApiError({ status, code: errorCode, message });
  }

  return new ApiError({ status, code: 'unknown_error', message: 'An unexpected error occurred.' });
}

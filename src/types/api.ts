/**
 * API Response Types
 */

export interface ValidationError {
  path: (string | number)[];
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: ValidationError[];
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

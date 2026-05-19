export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; cursor?: string };
  error?: { code: string; message: string; details?: unknown };
}

export function successResponse<T>(
  data: T,
  meta?: { total: number; cursor?: string },
): ApiResponse<T> {
  return { success: true, data, ...(meta && { meta }) };
}

export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiResponse<null> {
  return { success: false, data: null, error: { code, message, details } };
}

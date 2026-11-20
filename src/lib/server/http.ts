import type { ApiErrorBody, ApiErrorCode } from "../schema";

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  headers?: HeadersInit,
): Response {
  const body: ApiErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
  return Response.json(body, { status, headers });
}

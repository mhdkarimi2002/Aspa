export type ApiErrorDetail = {
  location: string | null;
  message: string;
  type: string | null;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details: ApiErrorDetail[];

  constructor(
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorMessage(error: unknown) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "درخواست انجام نشد";
}

export function toApiError(status: number, body: unknown): ApiError {
  const error = isErrorBody(body) ? body.error : null;
  return new ApiError(
    status,
    error?.code ?? "http_error",
    error?.message ?? "درخواست انجام نشد",
    error?.details?.map((detail) => ({
      location: detail.location ?? null,
      message: detail.message,
      type: detail.type ?? null,
    })) ?? [],
  );
}

function isErrorBody(body: unknown): body is {
  error: {
    code?: string;
    message?: string;
    details?: {
      location?: string | null;
      message: string;
      type?: string | null;
    }[];
  };
} {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null
  );
}

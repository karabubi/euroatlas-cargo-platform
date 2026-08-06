import { getAccessToken } from "./auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  code?: string;
  readinessPercentage?: number;
  blockers?: Array<{
    key: string;
    label: string;
    message: string;
  }>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly data: ApiErrorPayload;

  constructor(message: string, status: number, data: ApiErrorPayload = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  get payload(): ApiErrorPayload {
    return this.data;
  }
}

export type ApiRequestOptions = RequestInit & {
  useAuthentication?: boolean;
};

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

function normalizeErrorPayload(responseBody: unknown): ApiErrorPayload {
  if (typeof responseBody === "object" && responseBody !== null) {
    return responseBody as ApiErrorPayload;
  }

  if (typeof responseBody === "string" && responseBody.trim()) {
    return {
      message: responseBody,
    };
  }

  return {};
}

function getErrorMessage(payload: ApiErrorPayload, status: number): string {
  if (Array.isArray(payload.message)) {
    return payload.message.map(String).join(", ");
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  return `Request failed with status ${status}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { useAuthentication = false, ...requestOptions } = options;

  const token = typeof window !== "undefined" ? getAccessToken() : null;

  if (useAuthentication && !token) {
    throw new ApiError(
      "No authentication token was found. Please log in again.",
      401,
    );
  }

  const headers = new Headers(requestOptions.headers);

  if (
    requestOptions.body !== undefined &&
    !(requestOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...requestOptions,
    headers,
  });

  const responseBody = await parseResponse(response);

  if (!response.ok) {
    const payload = normalizeErrorPayload(responseBody);

    const message =
      response.status === 401 && useAuthentication
        ? "Your session has expired. Please log in again."
        : getErrorMessage(payload, response.status);

    throw new ApiError(message, response.status, payload);
  }

  return responseBody as T;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    useAuthentication: true,
  });
}

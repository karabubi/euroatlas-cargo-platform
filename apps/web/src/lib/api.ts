import { getAccessToken } from './auth-storage';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
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

function getErrorMessage(
  responseBody: unknown,
  status: number,
): string {
  if (
    typeof responseBody === 'object' &&
    responseBody !== null &&
    'message' in responseBody
  ) {
    const message = responseBody.message;

    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }

    return String(message);
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody;
  }

  return `Request failed with status ${status}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    useAuthentication = false,
    ...requestOptions
  } = options;

  const token =
    typeof window !== 'undefined' ? getAccessToken() : null;

  if (useAuthentication && !token) {
    throw new ApiError(
      'No authentication token was found. Please log in again.',
      401,
    );
  }

  const headers = new Headers(requestOptions.headers);

  if (
    requestOptions.body !== undefined &&
    !(requestOptions.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...requestOptions,
    headers,
  });

  const responseBody = await parseResponse(response);

  if (!response.ok) {
    const message =
      response.status === 401 && useAuthentication
        ? 'Your session has expired. Please log in again.'
        : getErrorMessage(responseBody, response.status);

    throw new ApiError(
      message,
      response.status,
      responseBody,
    );
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

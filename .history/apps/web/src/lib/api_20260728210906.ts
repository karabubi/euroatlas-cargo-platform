import { getAccessToken } from './auth-storage';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface ApiRequestOptions extends RequestInit {
  useAuthentication?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    useAuthentication = false,
    headers,
    ...requestOptions
  } = options;

  const token = useAuthentication
    ? getAccessToken()
    : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  const data = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | T | null;

  if (!response.ok) {
    let message = 'The request failed';

    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      data.message
    ) {
      message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
    }

    throw new Error(message);
  }

  return data as T;
}
import type { AuthTokens } from './types/auth.types.js';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Low-level HTTP fetch wrapper with httpOnly cookie credentials, authorization header fallback,
 * automated token refresh, and standardized error handling.
 */
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (
    response.status === 401 &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/logout')
  ) {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });

      if (refreshRes.ok) {
        const data: AuthTokens = await refreshRes.json();
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        if (data.accessToken) {
          headers['Authorization'] = `Bearer ${data.accessToken}`;
        }
        const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
          credentials: 'include',
          ...options,
          headers,
        });
        if (retryRes.ok) {
          return retryRes.json();
        }
      }
    } catch {
      // Fall through to session eviction
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(
      new CustomEvent('bt:unauthorized', {
        detail: { message: 'Your session has expired. Please sign in again.' },
      }),
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }

  return data as T;
}

/**
 * Low-level HTTP multipart file upload wrapper with credentials, authorization fallback,
 * automated token refresh, and standardized error handling for SeaweedFS storage endpoints.
 */
export async function uploadFile<T>(
  endpoint: string,
  fileOrFormData: File | FormData,
  fieldName = 'file',
  options: Omit<RequestInit, 'body'> = {},
): Promise<T> {
  const formData =
    fileOrFormData instanceof FormData
      ? fileOrFormData
      : (() => {
          const fd = new FormData();
          fd.append(fieldName, fileOrFormData);
          return fd;
        })();

  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    ...options,
    headers,
    body: formData,
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });

      if (refreshRes.ok) {
        const data: AuthTokens = await refreshRes.json();
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        if (data.accessToken) {
          headers['Authorization'] = `Bearer ${data.accessToken}`;
        }
        const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          credentials: 'include',
          ...options,
          headers,
          body: formData,
        });
        if (retryRes.ok) {
          return retryRes.json();
        }
      }
    } catch {
      // Fall through to session eviction
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(
      new CustomEvent('bt:unauthorized', {
        detail: { message: 'Your session has expired. Please sign in again.' },
      }),
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }

  return data as T;
}

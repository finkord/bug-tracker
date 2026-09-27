import { request } from '../http.js';
import type { AuthTokens } from '../types/auth.types.js';

export const authApi = {
  register: (payload: any) =>
    request<{ message: string; userId: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  activate: (token: string) =>
    request<{ message: string; email: string }>(`/auth/activate?token=${encodeURIComponent(token)}`),

  activateAccount: (token: string) =>
    request<{ message: string; email: string }>(`/auth/activate?token=${encodeURIComponent(token)}`),

  login: (payload: any) =>
    request<
      | AuthTokens
      | { require2fa: true; tempToken: string; message: string; email: string }
      | { requires2Fa: true; challengeToken: string; message: string; email: string }
    >('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verify2fa: (data: { tempToken?: string; challengeToken?: string; code?: string; totpCode?: string }) =>
    request<AuthTokens>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        challengeToken: data.challengeToken || data.tempToken,
        totpCode: data.totpCode || data.code,
      }),
    }),

  verify2Fa: (challengeToken: string, totpCode: string) =>
    request<AuthTokens>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, totpCode }),
    }),

  generate2fa: () =>
    request<{ secret: string; qrCodeDataUrl?: string; qrCodeUrl?: string; otpauthUrl?: string; otpAuthUrl?: string }>(
      '/auth/2fa/generate',
      { method: 'POST' },
    ),

  generate2Fa: () =>
    request<{ secret: string; qrCodeDataUrl?: string; qrCodeUrl?: string; otpauthUrl?: string; otpAuthUrl?: string }>(
      '/auth/2fa/generate',
      { method: 'POST' },
    ),

  enable2fa: (codeOrObj: string | { code?: string; totpCode?: string; secret?: string }, secretArg?: string) => {
    const code = typeof codeOrObj === 'string' ? codeOrObj : codeOrObj.code || codeOrObj.totpCode || '';
    const secret = typeof codeOrObj === 'object' ? codeOrObj.secret : secretArg;
    return request<{ message: string }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code, totpCode: code, secret }),
    });
  },

  enable2Fa: (codeOrObj: string | { code?: string; totpCode?: string; secret?: string }, secretArg?: string) => {
    const code = typeof codeOrObj === 'string' ? codeOrObj : codeOrObj.code || codeOrObj.totpCode || '';
    const secret = typeof codeOrObj === 'object' ? codeOrObj.secret : secretArg;
    return request<{ message: string }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code, totpCode: code, secret }),
    });
  },

  disable2fa: (codeOrObj: string | { code?: string; totpCode?: string }) => {
    const code = typeof codeOrObj === 'string' ? codeOrObj : codeOrObj.code || codeOrObj.totpCode || '';
    return request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code, totpCode: code }),
    });
  },

  disable2Fa: (codeOrObj: string | { code?: string; totpCode?: string }) => {
    const code = typeof codeOrObj === 'string' ? codeOrObj : codeOrObj.code || codeOrObj.totpCode || '';
    return request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code, totpCode: code }),
    });
  },

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: any) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setPassword: (payload: string | { newPassword: string; currentPassword?: string }) =>
    request<{ message: string }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify(
        typeof payload === 'string'
          ? { newPassword: payload }
          : { newPassword: payload.newPassword, currentPassword: payload.currentPassword },
      ),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
};

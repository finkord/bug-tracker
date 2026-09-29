import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store';
import { api } from '../api/client';
import { Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const rawError = searchParams.get('error');
  const code = searchParams.get('code');

  const { error } = useQuery({
    queryKey: ['auth', 'oauth-exchange', code],
    queryFn: async () => {
      window.history.replaceState(null, '', '/oauth/callback');
      const tokens = await api.exchangeOAuthCode(code!);
      await login(tokens);
      navigate('/', { replace: true });
      return tokens;
    },
    enabled: Boolean(code && !rawError),
    retry: false,
    staleTime: Infinity,
  });

  const errorMessage = rawError
    ? decodeURIComponent(rawError)
    : !code
    ? 'Missing OAuth exchange code in callback response.'
    : error instanceof Error
    ? error.message
    : null;

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md p-8 m3-card shadow-lg relative overflow-hidden text-center">
        {errorMessage ? (
          <div className="space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                Authentication Failed
              </h2>
              <p className="mt-2 text-sm text-[var(--md-sys-color-error)] leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 m3-btn-filled text-sm font-semibold rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--md-sys-color-primary-container)] animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] flex items-center justify-center gap-2">
                <span>Connecting Account</span>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--md-sys-color-primary)]" />
              </h2>
              <p className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                Establishing your secure federated session...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

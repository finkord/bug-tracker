import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import confetti from 'canvas-confetti';
import { CheckCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';

export const ActivatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage('No activation token provided in URL.');
      return;
    }

    const performActivation = async () => {
      try {
        const res = await api.activate(token);
        setSuccess(true);
        setMessage(res.message);
        // Celebration confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0b57d0', '#137333', '#a8c7fa'],
        });
      } catch (err: any) {
        setSuccess(false);
        setMessage(err.message || 'Activation failed or token has expired.');
      } finally {
        setLoading(false);
      }
    };

    performActivation();
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 rounded-[28px] m3-card shadow-lg text-center space-y-6">
        {loading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-[var(--md-sys-color-primary)] animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Validating Token...</h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Verifying single-use cryptographic verification token</p>
          </div>
        ) : success ? (
          <div className="space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-[22px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-9 h-9 text-[var(--md-sys-color-success)]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Account Activated!</h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-xs mx-auto">
                {message}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-3.5 rounded-full m3-btn-filled text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-[22px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-9 h-9 text-[var(--md-sys-color-error)]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Activation Failed</h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-xs mx-auto">
                {message}
              </p>
            </div>

            <div className="p-3.5 rounded-[18px] bg-[var(--md-sys-color-surface-container-high)] text-xs text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
              Activation tokens are single-use and expire in 24 hours. If your account is already active, you can sign in directly.
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block py-2.5 px-6 rounded-full m3-btn-outline text-sm font-medium"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

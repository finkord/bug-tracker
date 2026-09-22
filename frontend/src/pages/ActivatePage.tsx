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
        // Fire celebration confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#a855f7'],
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
      <div className="w-full max-w-md p-8 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-2xl text-center space-y-6">
        {loading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">Validating Activation Token...</h3>
            <p className="text-xs text-slate-400">Verifying single-use cryptographic token (SDSecurity Task 3)</p>
          </div>
        ) : success ? (
          <div className="space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Account Activated!</h2>
              <p className="text-xs text-emerald-300/90 leading-relaxed max-w-xs mx-auto">
                {message}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Activation Failed</h2>
              <p className="text-xs text-rose-300/90 leading-relaxed max-w-xs mx-auto">
                {message}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
              Activation tokens are single-use and expire in 24 hours. If your account is already active, you can sign in directly.
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block py-2.5 px-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all"
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
